// pages/api/scan-url.js
// ─────────────────────────────────────────────────────────────────────────────
//  URL Scanner API Route
//  POST /api/scan-url
//  Body: { url: string }
//
//  The most complex API route in ValnTracker. Orchestrates three parallel
//  security scans using Promise.all() for maximum speed, then aggregates
//  all results into a single unified threat score and verdict.
//
//  Engines used:
//    1. VirusTotal API v3       — REAL (mock fallback if key missing)
//    2. Google Safe Browsing v4 — REAL (mock fallback if key missing)
//    3. URLScan.io v1           — REAL (mock fallback if key missing)
//
//  Threat Score Formula (0–100):
//    VirusTotal malicious ratio  → up to 50 points
//    VirusTotal suspicious ratio → up to 10 points
//    Google Safe Browsing match  → 30 points
//    URLScan.io Malicious        → 10 points
//    URLScan.io Suspicious       → 5 points
//    Heuristic penalties         → variable (HTTP, IP-URL, bad TLD, etc.)
//    Final score capped at 100
//
//  Verdicts:
//    0–34   → Safe
//    35–69  → Suspicious
//    70–100 → Dangerous
//
//  Auth: Optional — scan runs publicly but result is only saved to MongoDB
//  if a valid session is detected (user is logged in).
//
//  Response (200):
//    { success: true, data: { url, threatScore, verdict, recommendations,
//      engines: { virusTotal, googleSafeBrowsing, urlScan }, scannedAt } }
// ─────────────────────────────────────────────────────────────────────────────

import connectDB from '../../lib/mongodb';
import ScanResult from '../../models/ScanResult';
import { getSession } from '../../lib/auth';

// ═════════════════════════════════════════════════════════════════════════════
//  ENGINE 1 — VirusTotal API v3
// ═════════════════════════════════════════════════════════════════════════════

async function scanWithVirusTotal(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  // No API key — activate mock fallback
  if (!apiKey) {
    console.warn('⚠️  VIRUSTOTAL_API_KEY not set — using mock response');
    return getMockVirusTotalResult(url);
  }

  try {
    // ── Step 1: Submit the URL for analysis ──────────────────────────────
    const submitRes = await fetch('https://www.virustotal.com/api/v3/urls', {
      method:  'POST',
      headers: {
        'x-apikey':     apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(url)}`,
    });

    if (!submitRes.ok) {
      throw new Error(`VirusTotal submit failed with status ${submitRes.status}`);
    }

    const submitData = await submitRes.json();
    const analysisId = submitData.data.id;

    // ── Step 2: Poll for results (up to 5 attempts × 3 seconds = 15s) ────
    for (let attempt = 0; attempt < 5; attempt++) {
      // Wait 3 seconds between each poll
      await new Promise(resolve => setTimeout(resolve, 3000));

      const reportRes = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        { headers: { 'x-apikey': apiKey } }
      );

      if (!reportRes.ok) continue;

      const reportData = await reportRes.json();
      const status     = reportData.data.attributes.status;

      if (status === 'completed') {
        const stats = reportData.data.attributes.stats;
        return {
          malicious:    stats.malicious    || 0,
          suspicious:   stats.suspicious   || 0,
          harmless:     stats.harmless     || 0,
          undetected:   stats.undetected   || 0,
          totalEngines: Object.values(stats).reduce((a, b) => a + b, 0),
          source:       'virustotal',
        };
      }
    }

    // Timed out — fall back to mock
    console.warn('⚠️  VirusTotal polling timed out — using mock response');
    return getMockVirusTotalResult(url);

  } catch (err) {
    console.error('VirusTotal error:', err.message);
    return getMockVirusTotalResult(url);
  }
}

// Mock result based on URL heuristics when VirusTotal is unavailable
function getMockVirusTotalResult(url) {
  const isSuspicious =
    url.startsWith('http://') ||
    /\d{4,}/.test(url) ||
    ['xyz', 'tk', 'ml', 'ga', 'cf', 'pw'].some(ext =>
      url.includes(`.${ext}/`) || url.endsWith(`.${ext}`)
    );

  return isSuspicious
    ? { malicious: 8, suspicious: 4, harmless: 55, undetected: 12, totalEngines: 79, source: 'mock' }
    : { malicious: 0, suspicious: 1, harmless: 68, undetected: 10, totalEngines: 79, source: 'mock' };
}

// ═════════════════════════════════════════════════════════════════════════════
//  ENGINE 2 — Google Safe Browsing API v4
// ═════════════════════════════════════════════════════════════════════════════

async function checkGoogleSafeBrowsing(url) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;

  if (!apiKey) {
    console.warn('⚠️  GOOGLE_SAFE_BROWSING_KEY not set — using mock response');
    return { isSafe: true, threats: [], source: 'mock' };
  }

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            clientId:      'valntracker',
            clientVersion: '2.0.0',
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION',
            ],
            platformTypes:    ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries:    [{ url }],
          },
        }),
      }
    );

    if (!res.ok) throw new Error(`Safe Browsing API failed: ${res.status}`);

    const data = await res.json();

    if (data.matches && data.matches.length > 0) {
      return {
        isSafe:  false,
        threats: data.matches.map(m => m.threatType),
        source:  'google',
      };
    }

    return { isSafe: true, threats: [], source: 'google' };

  } catch (err) {
    console.error('Google Safe Browsing error:', err.message);
    return { isSafe: true, threats: [], source: 'mock' };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  ENGINE 3 — URLScan.io API v1
// ═════════════════════════════════════════════════════════════════════════════

async function scanWithURLScan(url) {
  const apiKey = process.env.URLSCAN_API_KEY;

  if (!apiKey) {
    return getMockURLScanResult(url);
  }

  try {
    // Submit scan
    const submitRes = await fetch('https://urlscan.io/api/v1/scan/', {
      method:  'POST',
      headers: {
        'API-Key':      apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, visibility: 'private' }),
    });

    if (!submitRes.ok) return getMockURLScanResult(url);

    const submitData = await submitRes.json();
    const scanId     = submitData.uuid;

    // Wait 8 seconds for the scan to complete
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Fetch results
    const resultRes = await fetch(
      `https://urlscan.io/api/v1/result/${scanId}/`
    );

    if (!resultRes.ok) return getMockURLScanResult(url);

    const result = await resultRes.json();

    return {
      verdict:    result.verdicts?.overall?.score > 50 ? 'Malicious' : 'Clean',
      tags:       result.verdicts?.overall?.tags || [],
      screenshot: result.task?.screenshotURL    || null,
      source:     'urlscan',
    };

  } catch (err) {
    console.error('URLScan error:', err.message);
    return getMockURLScanResult(url);
  }
}

function getMockURLScanResult(url) {
  const isHTTP = url.startsWith('http://');
  return {
    verdict:    isHTTP ? 'Suspicious' : 'Clean',
    tags:       isHTTP ? ['no-https', 'unencrypted'] : ['https', 'standard'],
    screenshot: null,
    source:     'mock',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  SCORING ENGINE — Aggregate all results into a single threat score
// ═════════════════════════════════════════════════════════════════════════════

function calculateThreatScore(vtResult, gsbResult, urlScanResult, url) {
  let score = 0;

  // ── VirusTotal contribution (up to 60 points) ──────────────────────────
  if (vtResult.totalEngines > 0) {
    const maliciousRatio  = vtResult.malicious  / vtResult.totalEngines;
    const suspiciousRatio = vtResult.suspicious / vtResult.totalEngines;
    score += maliciousRatio  * 50;
    score += suspiciousRatio * 10;
  }

  // ── Google Safe Browsing contribution (30 points) ─────────────────────
  if (!gsbResult.isSafe) {
    score += 30;
  }

  // ── URLScan.io contribution (up to 10 points) ─────────────────────────
  if (urlScanResult.verdict === 'Malicious')  score += 10;
  else if (urlScanResult.verdict === 'Suspicious') score += 5;

  // ── Heuristic penalties ────────────────────────────────────────────────
  if (url.startsWith('http://'))                                   score += 5;   // No SSL
  if (/\d{3,}\.\d{3,}\.\d{3,}/.test(url))                        score += 10;  // IP-based URL
  if (['xyz','tk','ml','ga','cf','pw'].some(e =>
    url.includes(`.${e}/`) || url.endsWith(`.${e}`)))             score += 8;   // Suspicious TLD
  if ((url.match(/-/g) || []).length > 4)                         score += 3;   // Many hyphens
  if (url.length > 100)                                           score += 3;   // Very long URL

  return Math.min(Math.round(score), 100);
}

function getVerdict(score) {
  if (score >= 70) return 'Dangerous';
  if (score >= 35) return 'Suspicious';
  return 'Safe';
}

function getRecommendations(score, gsbResult, vtResult) {
  const recs = [];

  if (score >= 70) {
    recs.push('Do NOT visit this URL — it has been flagged as dangerous by multiple security engines.');
    recs.push('Report this URL to your IT security team or organisation immediately.');
    recs.push('If you have already visited it, run a full antivirus scan on your device right away.');
    recs.push('Change passwords for any accounts you may have accessed recently.');
    recs.push('Check your accounts for any suspicious activity or unauthorised logins.');
  } else if (score >= 35) {
    recs.push('Exercise caution — this URL shows suspicious characteristics.');
    recs.push('Do not enter any login credentials or payment information on this site.');
    recs.push('Verify the URL by contacting the organisation directly through their official website.');
    recs.push('Consider using a sandboxed browser or virtual machine to inspect the page.');
  } else {
    recs.push('This URL appears safe based on current threat intelligence data.');
    recs.push('Always keep your browser and antivirus software up to date.');
    recs.push('Remain cautious of links received unexpectedly, even from known contacts.');
    recs.push('Enable two-factor authentication on all important accounts as a best practice.');
  }

  // Add engine-specific findings to recommendations
  if (!gsbResult.isSafe && gsbResult.threats.length > 0) {
    recs.push(`Google Safe Browsing flagged this URL for: ${gsbResult.threats.join(', ')}.`);
  }

  if (vtResult.malicious > 0) {
    recs.push(
      `${vtResult.malicious} out of ${vtResult.totalEngines} antivirus engines flagged this URL as malicious.`
    );
  }

  return recs;
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ═════════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const { url } = req.body;

  // Validate URL field is present
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, error: 'A valid URL is required.' });
  }

  // Validate URL format using the built-in URL constructor
  try {
    new URL(url.trim());
  } catch {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format. Please include http:// or https://',
    });
  }

  try {
    // ── Run all three scans in parallel ─────────────────────────────────
    const [vtResult, gsbResult, urlScanResult] = await Promise.all([
      scanWithVirusTotal(url.trim()),
      checkGoogleSafeBrowsing(url.trim()),
      scanWithURLScan(url.trim()),
    ]);

    // ── Calculate unified threat score and verdict ───────────────────────
    const threatScore      = calculateThreatScore(vtResult, gsbResult, urlScanResult, url);
    const verdict          = getVerdict(threatScore);
    const recommendations  = getRecommendations(threatScore, gsbResult, vtResult);

    const responseData = {
      url:             url.trim(),
      threatScore,
      verdict,
      recommendations,
      engines: {
        virusTotal:         vtResult,
        googleSafeBrowsing: gsbResult,
        urlScan:            urlScanResult,
      },
      scannedAt: new Date().toISOString(),
    };

    // ── Save to MongoDB if user is logged in ─────────────────────────────
    try {
      await connectDB();
      const session = await getSession(req, res);

      if (session?.user?.id) {
        await ScanResult.create({
          userId:          session.user.id,
          scanType:        'url',
          target:          url.trim(),
          threatScore,
          verdict,
          details: {
            virusTotal:         vtResult,
            googleSafeBrowsing: gsbResult,
            urlScan:            urlScanResult,
          },
          recommendations,
        });
      }
    } catch (dbErr) {
      // Non-fatal — scan result is still returned to the user
      console.error('DB save error (non-fatal):', dbErr.message);
    }

    return res.status(200).json({ success: true, data: responseData });

  } catch (err) {
    console.error('scan-url error:', err);
    return res.status(500).json({
      success: false,
      error:   'Scan failed. Please try again in a moment.',
    });
  }
}
