// pages/catalog/scanner.js
// ─────────────────────────────────────────────────────────────────────────────
//  URL Scanner Page
//  Route: /catalog/scanner
//
//  Allows users to scan any URL against multiple real-world security engines.
//  Calls POST /api/scan-url which runs VirusTotal + Google Safe Browsing +
//  URLScan.io in parallel and returns a unified threat score.
//
//  Features:
//    - URL input with Enter key support
//    - Engine badges showing what is being used (VirusTotal, GSB, URLScan, Heuristics)
//    - 10-step animated scan log displayed while the API processes
//    - Animated progress bar filling during the scan (up to ~90% then jumps to 100%)
//    - Blinking terminal cursor during scan
//    - Results section:
//        → Verdict banner with circular SVG threat gauge
//        → VirusTotal card: malicious / suspicious / harmless / undetected counts
//        → Google Safe Browsing card: safe or threat types listed
//        → URLScan.io card: verdict + behaviour tags
//        → "Source" label per card (Live API or Simulated)
//        → Recommendations panel with actionable advice
//        → "Scan Another URL" reset button
//        → "View in Dashboard" button for logged-in users
//    - Login nudge for unauthenticated users
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';

const scoreColor = (s) => s >= 70 ? '#ff3366' : s >= 35 ? '#ffaa00' : '#00ff88';
const scoreLabel = (s) => s >= 70 ? '🚨 Dangerous' : s >= 35 ? '⚠️ Suspicious' : '✅ Safe';

// Engine badges shown below the input
const ENGINE_BADGES = [
  { icon:'🦠', label:'VirusTotal',          color:'#00d4ff' },
  { icon:'🛡️', label:'Google Safe Browsing', color:'#00ff88' },
  { icon:'🌐', label:'URLScan.io',           color:'#7b2fff' },
  { icon:'🔍', label:'Heuristic Analysis',   color:'#ffaa00' },
];

// Animated scan log messages shown while the API processes
const SCAN_LOGS = [
  '🔍 Initialising scan engines...',
  '📡 Submitting URL to VirusTotal...',
  '🛡️  Querying Google Safe Browsing...',
  '🌐 Running URLScan.io page analysis...',
  '📊 Analysing URL structure and heuristics...',
  '🔒 Checking SSL certificate validity...',
  '🕵️  Inspecting domain reputation...',
  '⚙️  Aggregating multi-engine results...',
  '📈 Calculating final threat score...',
  '✅ Scan complete — building report...',
];

export default function ScannerPage() {
  const { data: session } = useSession();

  const [url, setUrl]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs]         = useState([]);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  const addLog = (msg) => setLogs(prev => [...prev, msg]);

  const handleScan = async () => {
    if (!url.trim()) { setError('Please enter a URL to scan.'); return; }
    try { new URL(url.trim()); }
    catch { setError('Invalid URL — please include http:// or https://'); return; }

    setError(''); setResult(null); setLogs([]); setProgress(0); setLoading(true);

    // Animate scan log while API processes (every 1.4 seconds)
    let step = 0;
    const interval = setInterval(() => {
      if (step < SCAN_LOGS.length) {
        addLog(SCAN_LOGS[step]);
        setProgress(Math.round(((step + 1) / SCAN_LOGS.length) * 90));
        step++;
      }
    }, 1400);

    try {
      const res  = await fetch('/api/scan-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) throw new Error(data.error || 'Scan failed.');

      setProgress(100);
      addLog('🎯 Analysis complete.');
      setResult(data.data);
    } catch (err) {
      clearInterval(interval);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null); setLogs([]); setProgress(0); setUrl(''); setError('');
  };

  return (
    <>
      <Head>
        <title>Link Scanner — ValnTracker</title>
        <meta name="description" content="Scan any URL against 70+ antivirus engines via VirusTotal, Google Safe Browsing, and URLScan.io." />
      </Head>

      <div style={S.page}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerBadge}>🔗 Link Scanner</div>
          <h1 style={S.title}>URL Threat Scanner</h1>
          <p style={S.subtitle}>
            Scan any link against{' '}
            <span style={{ color:'#00d4ff' }}>70+ antivirus engines</span>,
            Google Safe Browsing, and URLScan.io — before you click it.
          </p>
          {!session && (
            <p style={S.loginNote}>
              💡 <Link href="/login" style={{ color:'#00d4ff' }}>Log in</Link>
              {' '}to save scan results to your dashboard.
            </p>
          )}
        </div>

        {/* ── Input card ───────────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.inputRow}>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}>🔗</span>
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && !loading && handleScan()}
                placeholder="https://example.com"
                style={S.input}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleScan}
              disabled={loading}
              style={{ ...S.scanBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Scanning...' : '→ Scan URL'}
            </button>
          </div>

          {error && <div style={S.errorBox}>⚠ {error}</div>}

          {/* Engine badges */}
          <div style={S.badges}>
            {ENGINE_BADGES.map(e => (
              <span key={e.label} style={{
                ...S.engBadge,
                borderColor: e.color + '44',
                color:       e.color,
              }}>
                {e.icon} {e.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Scan log + progress ──────────────────────────────────────── */}
        {(loading || logs.length > 0) && (
          <div style={S.card}>
            <div style={S.logHeader}>
              <span style={S.logPrompt}>$ scanning...</span>
              <span style={S.logPct}>{progress}%</span>
            </div>
            <div style={S.progBar}>
              <div style={{ ...S.progFill, width:`${progress}%` }} />
            </div>
            <div style={S.logBox}>
              {logs.map((log, i) => (
                <div
                  key={i}
                  style={{ ...S.logLine, opacity: i === logs.length - 1 ? 1 : 0.5 }}
                >
                  <span style={S.logIdx}>[{String(i + 1).padStart(2, '0')}]</span>
                  {' '}{log}
                </div>
              ))}
              {loading && <span style={S.cursor}>█</span>}
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────── */}
        {result && (
          <>
            {/* Verdict banner with circular SVG gauge */}
            <div style={{
              ...S.verdictBanner,
              borderColor: scoreColor(result.threatScore) + '55',
              boxShadow:   `0 0 40px ${scoreColor(result.threatScore)}18`,
            }}>
              <div style={S.verdictLeft}>
                <div style={S.verdictTag}>VERDICT</div>
                <div style={{ ...S.verdictVal, color: scoreColor(result.threatScore) }}>
                  {scoreLabel(result.threatScore)}
                </div>
                <div style={S.verdictUrl}>{result.url}</div>
                <div style={S.verdictMeta}>
                  Scanned {new Date(result.scannedAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Circular gauge */}
              <div style={S.gaugeWrap}>
                <div style={{ position:'relative', width:100, height:100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={scoreColor(result.threatScore)} strokeWidth="8"
                      strokeDasharray={`${(result.threatScore / 100) * 264} 264`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)" />
                  </svg>
                  <div style={S.gaugeInner}>
                    <span style={{ ...S.gaugeNum, color: scoreColor(result.threatScore) }}>
                      {result.threatScore}
                    </span>
                    <span style={S.gaugeSub}>/100</span>
                  </div>
                </div>
                <div style={S.gaugeLbl}>Threat Score</div>
              </div>
            </div>

            {/* Engine result cards */}
            <div style={S.engGrid}>

              {/* VirusTotal */}
              {result.engines?.virusTotal && (
                <div style={S.engCard}>
                  <div style={S.engCardTitle}>🦠 VirusTotal</div>
                  <div style={S.engCardSrc}>
                    Source:{' '}
                    <span style={{ color:'#00d4ff' }}>
                      {result.engines.virusTotal.source === 'mock' ? 'Simulated' : 'Live API'}
                    </span>
                  </div>
                  <div style={S.vtGrid}>
                    {[
                      { label:'Malicious',  val:result.engines.virusTotal.malicious,  color:'#ff3366' },
                      { label:'Suspicious', val:result.engines.virusTotal.suspicious, color:'#ffaa00' },
                      { label:'Harmless',   val:result.engines.virusTotal.harmless,   color:'#00ff88' },
                      { label:'Undetected', val:result.engines.virusTotal.undetected, color:'#3a6a80' },
                    ].map(s => (
                      <div key={s.label} style={S.vtStat}>
                        <span style={{ ...S.vtNum, color:s.color }}>{s.val}</span>
                        <span style={S.vtLabel}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={S.engCardSub}>
                    {result.engines.virusTotal.totalEngines} engines checked
                  </div>
                </div>
              )}

              {/* Google Safe Browsing */}
              {result.engines?.googleSafeBrowsing && (
                <div style={S.engCard}>
                  <div style={S.engCardTitle}>🛡️ Google Safe Browsing</div>
                  <div style={S.engCardSrc}>
                    Source:{' '}
                    <span style={{ color:'#00d4ff' }}>
                      {result.engines.googleSafeBrowsing.source === 'mock' ? 'Simulated' : 'Live API'}
                    </span>
                  </div>
                  <div style={{
                    marginTop: 16,
                    fontSize:  20,
                    fontWeight: 700,
                    color: result.engines.googleSafeBrowsing.isSafe ? '#00ff88' : '#ff3366',
                  }}>
                    {result.engines.googleSafeBrowsing.isSafe
                      ? '✅ URL is Safe'
                      : '🚨 Threats Detected'}
                  </div>
                  {!result.engines.googleSafeBrowsing.isSafe &&
                    result.engines.googleSafeBrowsing.threats.map((t, i) => (
                      <div key={i} style={{ color:'#ff6688', fontSize:13, marginTop:6 }}>
                        • {t}
                      </div>
                    ))
                  }
                </div>
              )}

              {/* URLScan.io */}
              {result.engines?.urlScan && (
                <div style={S.engCard}>
                  <div style={S.engCardTitle}>🌐 URLScan.io</div>
                  <div style={S.engCardSrc}>
                    Source:{' '}
                    <span style={{ color:'#00d4ff' }}>
                      {result.engines.urlScan.source === 'mock' ? 'Simulated' : 'Live API'}
                    </span>
                  </div>
                  <div style={{
                    marginTop:  16,
                    fontSize:   18,
                    fontWeight: 700,
                    color: result.engines.urlScan.verdict === 'Clean' ? '#00ff88' : '#ffaa00',
                  }}>
                    {result.engines.urlScan.verdict === 'Clean'
                      ? '✅ Clean'
                      : '⚠️ ' + result.engines.urlScan.verdict}
                  </div>
                  {/* Behaviour tags */}
                  {result.engines.urlScan.tags?.length > 0 && (
                    <div style={S.tagRow}>
                      {result.engines.urlScan.tags.map((tag, i) => (
                        <span key={i} style={S.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div style={S.recsCard}>
              <h3 style={S.recsTitle}>📋 Recommendations</h3>
              {result.recommendations.map((r, i) => (
                <div key={i} style={S.recRow}>
                  <span style={S.recArrow}>→</span>
                  <span style={S.recText}>{r}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ textAlign:'center', marginTop:24, display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={handleReset} style={S.resetBtn}>
                ↩ Scan Another URL
              </button>
              {session && (
                <Link href="/dashboard" style={S.dashBtn}>
                  📊 View in Dashboard
                </Link>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        input::placeholder { color: #3a6a80; }
      `}</style>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page:         { maxWidth:900, margin:'0 auto', padding:'48px 24px 80px' },

  header:       { textAlign:'center', marginBottom:40 },
  headerBadge:  { display:'inline-block', padding:'6px 16px', background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:20, fontSize:13, color:'#00d4ff', fontWeight:600, marginBottom:16, fontFamily:"'JetBrains Mono',monospace" },
  title:        { fontSize:40, fontWeight:700, color:'#e8f4f8', margin:'0 0 12px', letterSpacing:'-1px', fontFamily:"'Inter',sans-serif" },
  subtitle:     { fontSize:16, color:'#3a6a80', margin:'0 0 12px', lineHeight:1.6 },
  loginNote:    { fontSize:14, color:'#1a3a55', margin:0 },

  card:         { background:'rgba(9,29,46,0.9)', border:'1px solid rgba(0,212,255,0.08)', borderRadius:16, padding:'28px 32px', marginBottom:24, backdropFilter:'blur(10px)' },
  inputRow:     { display:'flex', gap:12, flexWrap:'wrap' },
  inputWrap:    { flex:1, position:'relative', minWidth:260 },
  inputIcon:    { position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', fontSize:18, pointerEvents:'none' },
  input:        { width:'100%', padding:'14px 14px 14px 46px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(0,212,255,0.12)', borderRadius:10, color:'#e8f4f8', fontSize:15, outline:'none', fontFamily:"'Inter',sans-serif", boxSizing:'border-box', transition:'border-color 0.2s' },
  scanBtn:      { padding:'14px 28px', background:'linear-gradient(135deg,#00d4ff,#0099bb)', color:'#000', fontWeight:700, fontSize:15, border:'none', borderRadius:10, fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' },
  errorBox:     { marginTop:14, padding:'12px 16px', background:'rgba(255,51,102,0.1)', border:'1px solid rgba(255,51,102,0.3)', borderRadius:8, color:'#ff6688', fontSize:14 },
  badges:       { display:'flex', flexWrap:'wrap', gap:8, marginTop:20 },
  engBadge:     { padding:'5px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid', borderRadius:20, fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono',monospace" },

  logHeader:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  logPrompt:    { fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:'#00d4ff' },
  logPct:       { fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:'#3a6a80' },
  progBar:      { height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden', marginBottom:20 },
  progFill:     { height:'100%', background:'linear-gradient(90deg,#00d4ff,#7b2fff)', borderRadius:2, transition:'width 0.4s ease' },
  logBox:       { fontFamily:"'JetBrains Mono',monospace", fontSize:13, display:'flex', flexDirection:'column', gap:6, maxHeight:220, overflowY:'auto' },
  logLine:      { color:'#b8dce8', transition:'opacity 0.3s' },
  logIdx:       { color:'#1a3a55' },
  cursor:       { color:'#00d4ff', animation:'blink 1s step-end infinite' },

  verdictBanner:{ background:'rgba(9,29,46,0.95)', border:'1px solid', borderRadius:16, padding:'28px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:24, marginBottom:20 },
  verdictLeft:  { flex:1 },
  verdictTag:   { fontSize:11, fontWeight:700, color:'#3a6a80', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontFamily:"'JetBrains Mono',monospace" },
  verdictVal:   { fontSize:30, fontWeight:700, marginBottom:8, fontFamily:"'Inter',sans-serif" },
  verdictUrl:   { fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:'#3a6a80', wordBreak:'break-all', marginBottom:4 },
  verdictMeta:  { fontSize:13, color:'#1a3a55' },
  gaugeWrap:    { display:'flex', flexDirection:'column', alignItems:'center', gap:6 },
  gaugeInner:   { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
  gaugeNum:     { fontSize:22, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 },
  gaugeSub:     { fontSize:11, color:'#3a6a80', marginTop:2 },
  gaugeLbl:     { fontSize:12, color:'#3a6a80' },

  engGrid:      { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:20 },
  engCard:      { background:'rgba(9,29,46,0.9)', border:'1px solid rgba(0,212,255,0.08)', borderRadius:14, padding:'22px 24px', backdropFilter:'blur(10px)' },
  engCardTitle: { fontSize:15, fontWeight:700, color:'#e8f4f8', marginBottom:6 },
  engCardSrc:   { fontSize:12, color:'#1a3a55' },
  engCardSub:   { fontSize:12, color:'#1a3a55', marginTop:12 },
  vtGrid:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:16 },
  vtStat:       { display:'flex', flexDirection:'column', gap:4 },
  vtNum:        { fontSize:24, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" },
  vtLabel:      { fontSize:12, color:'#3a6a80' },
  tagRow:       { display:'flex', flexWrap:'wrap', gap:6, marginTop:12 },
  tag:          { padding:'3px 10px', background:'rgba(255,255,255,0.06)', borderRadius:10, fontSize:12, color:'#3a6a80', fontFamily:"'JetBrains Mono',monospace" },

  recsCard:     { background:'rgba(9,29,46,0.9)', border:'1px solid rgba(0,212,255,0.08)', borderRadius:16, padding:'28px 32px', backdropFilter:'blur(10px)', marginBottom:20 },
  recsTitle:    { fontSize:16, fontWeight:700, color:'#e8f4f8', margin:'0 0 16px' },
  recRow:       { display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 },
  recArrow:     { color:'#00d4ff', fontWeight:700, flexShrink:0, marginTop:1 },
  recText:      { fontSize:14, color:'#b8dce8', lineHeight:1.5 },

  resetBtn:     { padding:'12px 24px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#b8dce8', fontSize:14, cursor:'pointer', fontFamily:"'Inter',sans-serif" },
  dashBtn:      { padding:'12px 24px', background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', borderRadius:10, color:'#00d4ff', fontSize:14, fontWeight:600, textDecoration:'none' },
};