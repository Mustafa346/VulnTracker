// pages/api/check-website.js
// ─────────────────────────────────────────────────────────────────────────────
//  Hack Checker API Route
//  POST /api/check-website
//  Body: { url: string, symptoms: string[] }
//
//  Evaluates whether a website has been compromised by combining:
//    1. Google Safe Browsing API — checks for known malware/phishing
//    2. Shodan API              — checks open ports and known CVEs
//    3. Symptom scoring engine  — weighted risk from user-reported symptoms
//
//  Symptom Weights (higher = more dangerous):
//    ransom_note:        80 pts  → forces 'Compromised' verdict
//    antivirus_disabled: 40 pts
//    spam_sent:          40 pts
//    data_loss:          35 pts
//    password_failures:  35 pts
//    unknown_processes:  30 pts
//    new_accounts:       30 pts
//    redirects:          25 pts
//    popups:             20 pts
//    browser_homepage:   20 pts
//    high_cpu:           15 pts
//    slow_performance:   10 pts
//
//  Risk Score Formula (0–100):
//    symptom weights sum
//    + 35 pts if Google Safe Browsing flagged
//    + 8 pts per dangerous port exposed (21, 23, 3306, 5432, 6379, 27017)
//    + 10 pts per known CVE found by Shodan
//    capped at 100
//
//  Verdicts:
//    ransom_note present → Compromised (immediate)
//    score 70+           → Compromised
//    score 35–69         → Suspicious
//    score 0–34          → Clean
//
//  Auth: Optional — check runs publicly but result is only saved to MongoDB
//  if a valid session is detected (user is logged in).
// ─────────────────────────────────────────────────────────────────────────────

import connectDB from '../../lib/mongodb';
import ScanResult from '../../models/ScanResult';
import { getSession } from '../../lib/auth';

// ── Symptom weight map ────────────────────────────────────────────────────────
const SYMPTOM_WEIGHTS = {
  slow_performance:   { label: 'Slow performance',              weight: 10 },
  popups:             { label: 'Unexpected pop-ups or ads',     weight: 20 },
  redirects:          { label: 'Unexplained redirects',         weight: 25 },
  new_accounts:       { label: 'New accounts created',          weight: 30 },
  data_loss:          { label: 'Files missing or modified',     weight: 35 },
  password_failures:  { label: 'Passwords stopped working',     weight: 35 },
  antivirus_disabled: { label: 'Antivirus disabled itself',     weight: 40 },
  unknown_processes:  { label: 'Unknown background processes',  weight: 30 },
  browser_homepage:   { label: 'Browser homepage changed',      weight: 20 },
  high_cpu:           { label: 'Unusually high CPU/RAM usage',  weight: 15 },
  spam_sent:          { label: 'Spam sent from account',        weight: 40 },
  ransom_note:        { label: 'Ransom note appeared',          weight: 80 },
};

// Ports that should NEVER be exposed to the internet
const DANGEROUS_PORTS = [21, 23, 3306, 5432, 6379, 27017];

// ═════════════════════════════════════════════════════════════════════════════
//  ENGINE 1 — Google Safe Browsing API v4
// ═════════════════════════════════════════════════════════════════════════════

async function checkGoogleSafeBrowsing(url) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;

  if (!apiKey) {
    return { isSafe: true, threats: [], source: 'mock' };
  }

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'valntracker', clientVersion: '2.0.0' },
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

    if (!res.ok) throw new Error(`GSB API failed: ${res.status}`);

    const data = await res.json();

    if (data.matches?.length > 0) {
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
//  ENGINE 2 — Shodan API
// ═════════════════════════════════════════════════════════════════════════════

async function checkShodan(url) {
  const apiKey = process.env.SHODAN_API_KEY;

  // Extract hostname from URL
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return getMockShodanResult('');
  }

  if (!apiKey) {
    return getMockShodanResult(hostname);
  }

  try {
    // Step 1: Resolve hostname to IP address
    const dnsRes = await fetch(
      `https://api.shodan.io/dns/resolve?hostnames=${hostname}&key=${apiKey}`
    );

    if (!dnsRes.ok) throw new Error('Shodan DNS resolve failed');

    const dnsData = await dnsRes.json();
    const ip      = dnsData[hostname];

    if (!ip) return getMockShodanResult(hostname);

    // Step 2: Look up host information by IP
    const hostRes = await fetch(
      `https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`
    );

    if (!hostRes.ok) return getMockShodanResult(hostname);

    const hostData = await hostRes.json();

    return {
      ip:              ip,
      openPorts:       hostData.ports              || [],
      vulnerabilities: Object.keys(hostData.vulns || {}),
      country:         hostData.country_name       || 'Unknown',
      org:             hostData.org                || 'Unknown',
      os:              hostData.os                 || 'Unknown',
      source:          'shodan',
    };

  } catch (err) {
    console.error('Shodan error:', err.message);
    return getMockShodanResult(hostname);
  }
}

function getMockShodanResult(hostname = '') {
  const isSuspicious = hostname.includes('free') || hostname.length > 30;
  return {
    ip:              '0.0.0.0',
    openPorts:       isSuspicious ? [21, 22, 80, 443, 3306, 8080] : [80, 443],
    vulnerabilities: isSuspicious ? ['CVE-2021-44228', 'CVE-2022-1388'] : [],
    country:         'Unknown',
    org:             'Unknown',
    os:              'Unknown',
    source:          'mock',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  SCORING ENGINE
// ═════════════════════════════════════════════════════════════════════════════

function calculateRiskScore(symptoms, gsbResult, shodanResult) {
  let score = 0;

  // Symptom-based scoring
  for (const symptom of symptoms) {
    const data = SYMPTOM_WEIGHTS[symptom];
    if (data) score += data.weight;
  }

  // Google Safe Browsing penalty
  if (!gsbResult.isSafe) score += 35;

  // Shodan dangerous port penalties (8 pts each)
  const exposedDangerous = shodanResult.openPorts.filter(p =>
    DANGEROUS_PORTS.includes(p)
  );
  score += exposedDangerous.length * 8;

  // Shodan CVE penalties (10 pts each, max 3)
  const cveCount = Math.min(shodanResult.vulnerabilities.length, 3);
  score += cveCount * 10;

  return Math.min(Math.round(score), 100);
}

function getVerdict(score, symptoms) {
  // Ransom note is an immediate Compromised regardless of score
  if (symptoms.includes('ransom_note')) return 'Compromised';
  if (score >= 70) return 'Compromised';
  if (score >= 35) return 'Suspicious';
  return 'Clean';
}

function getRecommendations(score, symptoms, gsbResult, shodanResult) {
  const recs = [];

  // Ransomware — most critical case
  if (symptoms.includes('ransom_note')) {
    recs.push('CRITICAL: Disconnect this system from the network immediately to prevent further spread.');
    recs.push('Do NOT pay the ransom — payment does not guarantee file recovery and funds criminal activity.');
    recs.push('Contact a professional incident response team or cybersecurity expert immediately.');
    recs.push('Restore files from your most recent clean offline backup.');
    recs.push('Report the incident to your national cybercrime authority.');
    return recs;
  }

  if (score >= 70) {
    recs.push('Your system shows strong signs of compromise — take immediate action.');
    recs.push('Run a full scan using Malwarebytes and your primary antivirus tool.');
    recs.push('Change all account passwords from a separate, clean device.');
    recs.push('Enable multi-factor authentication on all important accounts.');
    recs.push('Consider engaging a professional incident response team.');
  } else if (score >= 35) {
    recs.push('Your system shows suspicious behaviour — investigate further before it escalates.');
    recs.push('Run a full antivirus scan and check all installed browser extensions.');
    recs.push('Review recently installed software and remove anything unfamiliar.');
    recs.push('Monitor your accounts for unusual login activity.');
  } else {
    recs.push('No strong signs of compromise detected based on reported symptoms.');
    recs.push('Keep all software and operating systems fully updated and patched.');
    recs.push('Enable real-time antivirus protection and automatic updates.');
    recs.push('Use unique passwords and MFA on all important accounts.');
    recs.push('Run regular antivirus scans as a preventive measure.');
  }

  if (!gsbResult.isSafe && gsbResult.threats.length > 0) {
    recs.push(`Google has flagged this site for: ${gsbResult.threats.join(', ')}.`);
  }

  if (shodanResult.vulnerabilities.length > 0) {
    recs.push(
      `Known CVEs detected on this server: ${shodanResult.vulnerabilities.slice(0, 3).join(', ')}.`
    );
  }

  const exposedPorts = shodanResult.openPorts.filter(p => DANGEROUS_PORTS.includes(p));
  if (exposedPorts.length > 0) {
    recs.push(`Dangerous ports exposed to the internet: ${exposedPorts.join(', ')}. Close or restrict these immediately.`);
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

  const { url, symptoms = [] } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'A website URL is required.' });
  }

  try {
    new URL(url.trim());
  } catch {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format. Please include http:// or https://',
    });
  }

  // Validate symptoms array
  const validSymptoms = Array.isArray(symptoms)
    ? symptoms.filter(s => typeof s === 'string' && SYMPTOM_WEIGHTS[s])
    : [];

  try {
    // ── Run both external scans in parallel ──────────────────────────────
    const [gsbResult, shodanResult] = await Promise.all([
      checkGoogleSafeBrowsing(url.trim()),
      checkShodan(url.trim()),
    ]);

    // ── Calculate unified risk score and verdict ─────────────────────────
    const riskScore       = calculateRiskScore(validSymptoms, gsbResult, shodanResult);
    const verdict         = getVerdict(riskScore, validSymptoms);
    const recommendations = getRecommendations(riskScore, validSymptoms, gsbResult, shodanResult);

    // Build symptom detail objects for the frontend
    const symptomDetails = validSymptoms.map(s => ({
      key:    s,
      label:  SYMPTOM_WEIGHTS[s]?.label  || s,
      weight: SYMPTOM_WEIGHTS[s]?.weight || 0,
    }));

    const responseData = {
      url:           url.trim(),
      riskScore,
      verdict,
      recommendations,
      symptomCount:  validSymptoms.length,
      symptoms:      symptomDetails,
      engines: {
        googleSafeBrowsing: gsbResult,
        shodan:             shodanResult,
      },
      checkedAt: new Date().toISOString(),
    };

    // ── Save to MongoDB if user is logged in ─────────────────────────────
    try {
      await connectDB();
      const session = await getSession(req, res);

      if (session?.user?.id) {
        await ScanResult.create({
          userId:      session.user.id,
          scanType:    'website',
          target:      url.trim(),
          threatScore: riskScore,
          verdict,
          details: {
            googleSafeBrowsing: gsbResult,
            shodan:             shodanResult,
            symptoms: {
              count: validSymptoms.length,
              list:  validSymptoms,
            },
          },
          recommendations,
        });
      }
    } catch (dbErr) {
      console.error('DB save error (non-fatal):', dbErr.message);
    }

    return res.status(200).json({ success: true, data: responseData });

  } catch (err) {
    console.error('check-website error:', err);
    return res.status(500).json({
      success: false,
      error:   'Check failed. Please try again in a moment.',
    });
  }
}
