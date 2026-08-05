// pages/catalog/checker.js
// ─────────────────────────────────────────────────────────────────────────────
//  Hack Checker Page
//  Route: /catalog/checker
//
//  Allows users to check whether a website has been compromised by
//  submitting a URL and selecting symptoms they are experiencing.
//  Calls POST /api/check-website which runs Google Safe Browsing +
//  Shodan + a weighted symptom scoring engine.
//
//  Features:
//    - URL input field with Enter key support
//    - 12-symptom checklist — each card highlights cyan when selected
//    - Each symptom has a label, description, and risk weight
//    - "Clear all selections" button when symptoms are selected
//    - Animated progress bar while the API processes the request
//    - 5-step progress log showing what is being checked
//    - Results section:
//        → Verdict banner (Clean / Suspicious / Compromised)
//        → Large risk score number with progress bar
//        → Google Safe Browsing engine card
//        → Shodan port scan card (dangerous ports highlighted red)
//        → Symptom summary card with individual weights
//        → Tiered recommendations panel
//        → "View in Dashboard" button for logged-in users
//    - Reset button to start a new check
//    - Login nudge for unauthenticated users
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';

// ── Symptom definitions ────────────────────────────────────────────────────
const SYMPTOMS = [
  { key:'slow_performance',   label:'Slow performance',              desc:'System or website became noticeably slower',          weight:10  },
  { key:'popups',             label:'Unexpected pop-ups or ads',     desc:'Random advertisements or pop-up windows appearing',   weight:20  },
  { key:'redirects',          label:'Unexplained redirects',         desc:'Browser redirecting to unknown websites',             weight:25  },
  { key:'new_accounts',       label:'New accounts created',          desc:'Unfamiliar user accounts appearing on your system',   weight:30  },
  { key:'data_loss',          label:'Files missing or modified',     desc:'Files disappeared or altered without explanation',    weight:35  },
  { key:'password_failures',  label:'Passwords stopped working',     desc:'Your passwords no longer work on accounts',           weight:35  },
  { key:'antivirus_disabled', label:'Antivirus disabled itself',     desc:'Security software turned off without your action',    weight:40  },
  { key:'unknown_processes',  label:'Unknown background processes',  desc:'Unfamiliar programs running in the background',       weight:30  },
  { key:'browser_homepage',   label:'Browser homepage changed',      desc:'Your browser default page was changed without consent',weight:20 },
  { key:'high_cpu',           label:'High CPU / RAM usage',          desc:'Unusually high resource usage with no obvious cause', weight:15  },
  { key:'spam_sent',          label:'Spam sent from your account',   desc:'Contacts received messages you did not send',         weight:40  },
  { key:'ransom_note',        label:'Ransom note appeared',          desc:'A message demanding payment to restore your access',  weight:80  },
];

// Ports that are dangerous when exposed to the internet
const DANGEROUS_PORTS = [21, 23, 3306, 5432, 6379, 27017];

const scoreColor = (s) => s >= 70 ? '#ff3366' : s >= 35 ? '#ffaa00' : '#00ff88';
const scoreLabel = (v) => {
  if (v === 'Compromised') return '🚨 Compromised';
  if (v === 'Suspicious')  return '⚠️ Suspicious Activity';
  return '✅ No Compromise Detected';
};

export default function CheckerPage() {
  const { data: session } = useSession();

  const [url, setUrl]           = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  const toggleSymptom = (key) =>
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );

  const handleCheck = async () => {
    if (!url.trim()) { setError('Please enter the website URL to check.'); return; }
    try { new URL(url.trim()); }
    catch { setError('Invalid URL — please include http:// or https://'); return; }

    setError(''); setResult(null); setProgress(0); setLoading(true);

    // Animate progress while API processes
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(p + 7, 88);
      setProgress(p);
    }, 700);

    try {
      const res  = await fetch('/api/check-website', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: url.trim(), symptoms: selected }),
      });
      const data = await res.json();
      clearInterval(iv);
      if (!res.ok) throw new Error(data.error || 'Check failed.');
      setProgress(100);
      setResult(data.data);
    } catch (err) {
      clearInterval(iv);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null); setSelected([]); setUrl('');
    setProgress(0);  setError('');
  };

  return (
    <>
      <Head>
        <title>Hack Checker — ValnTracker</title>
        <meta name="description" content="Check if your website has been compromised using Google Safe Browsing, Shodan, and symptom analysis." />
      </Head>

      <div style={S.page}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerBadge}>🖥 Hack Checker</div>
          <h1 style={S.title}>Has Your Website Been Compromised?</h1>
          <p style={S.subtitle}>
            Enter your website URL, tick any symptoms you are experiencing,
            and we will analyse it against real threat databases using
            Google Safe Browsing and Shodan port intelligence.
          </p>
          {!session && (
            <p style={S.loginNote}>
              💡 <Link href="/login" style={{ color:'#00d4ff' }}>Log in</Link>
              {' '}to save results to your dashboard.
            </p>
          )}
        </div>

        {/* ── URL Input ────────────────────────────────────────────────── */}
        <div style={S.card}>
          <label style={S.label}>Website URL to Check</label>
          <div style={S.inputRow}>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}>🌐</span>
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && !loading && handleCheck()}
                placeholder="https://yourwebsite.com"
                style={S.input}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleCheck}
              disabled={loading}
              style={{ ...S.checkBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Analysing...' : '→ Run Check'}
            </button>
          </div>
          {error && <div style={S.errorBox}>⚠ {error}</div>}
        </div>

        {/* ── Symptom Checklist ────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.symptomHeader}>
            <h3 style={S.symptomTitle}>Symptoms Checklist</h3>
            <span style={S.symptomCount}>{selected.length} selected</span>
          </div>
          <p style={S.symptomSub}>
            Tick all symptoms your website or system is currently experiencing:
          </p>

          <div style={S.symptomsGrid}>
            {SYMPTOMS.map(s => {
              const checked = selected.includes(s.key);
              return (
                <div
                  key={s.key}
                  onClick={() => toggleSymptom(s.key)}
                  style={{
                    ...S.symptomCard,
                    background:  checked ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)',
                    borderColor: checked ? 'rgba(0,212,255,0.4)'  : 'rgba(255,255,255,0.07)',
                    cursor:      'pointer',
                  }}
                >
                  <div style={S.symptomRow}>
                    {/* Checkbox */}
                    <div style={{
                      ...S.checkbox,
                      background:  checked ? '#00d4ff' : 'transparent',
                      borderColor: checked ? '#00d4ff' : 'rgba(255,255,255,0.2)',
                    }}>
                      {checked && <span style={S.checkmark}>✓</span>}
                    </div>
                    {/* Text */}
                    <div>
                      <div style={{ ...S.symLabel, color: checked ? '#e8f4f8' : '#b8dce8' }}>
                        {s.label}
                      </div>
                      <div style={S.symDesc}>{s.desc}</div>
                    </div>
                    {/* Weight badge */}
                    <div style={{
                      ...S.weightBadge,
                      color:       s.weight >= 40 ? '#ff3366' : s.weight >= 20 ? '#ffaa00' : '#3a6a80',
                      borderColor: s.weight >= 40 ? 'rgba(255,51,102,0.3)' : s.weight >= 20 ? 'rgba(255,170,0,0.3)' : 'rgba(255,255,255,0.08)',
                    }}>
                      +{s.weight}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected.length > 0 && (
            <button onClick={() => setSelected([])} style={S.clearBtn}>
              ✕ Clear all selections
            </button>
          )}
        </div>

        {/* ── Progress ─────────────────────────────────────────────────── */}
        {loading && (
          <div style={S.card}>
            <div style={S.progHeader}>
              <span style={S.progPrompt}>$ analysing website...</span>
              <span style={S.progPct}>{progress}%</span>
            </div>
            <div style={S.progBar}>
              <div style={{ ...S.progFill, width:`${progress}%` }} />
            </div>
            <div style={S.progSteps}>
              {[
                'Querying Google Safe Browsing...',
                'Checking Shodan for open ports...',
                'Analysing domain reputation...',
                'Processing symptom data...',
                'Calculating risk score...',
              ].map((step, i) => (
                <div key={i} style={{ ...S.progStep, opacity: progress > i * 18 ? 1 : 0.3 }}>
                  <span style={{ color: progress > i * 18 ? '#00d4ff' : '#1a3a55' }}>›</span>
                  {' '}{step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────── */}
        {result && (
          <>
            {/* Verdict banner */}
            <div style={{
              ...S.verdictBanner,
              borderColor: scoreColor(result.riskScore) + '55',
              boxShadow:   `0 0 40px ${scoreColor(result.riskScore)}15`,
            }}>
              <div style={S.verdictLeft}>
                <div style={S.verdictTag}>RISK ASSESSMENT</div>
                <div style={{ ...S.verdictVal, color: scoreColor(result.riskScore) }}>
                  {scoreLabel(result.verdict)}
                </div>
                <div style={S.verdictUrl}>{result.url}</div>
                <div style={S.verdictMeta}>
                  {result.symptomCount} symptom{result.symptomCount !== 1 ? 's' : ''} reported
                  &nbsp;·&nbsp;
                  Checked {new Date(result.checkedAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Score */}
              <div style={S.scoreBox}>
                <div style={{ ...S.scoreBig, color: scoreColor(result.riskScore) }}>
                  {result.riskScore}
                </div>
                <div style={S.scoreSub}>/100</div>
                <div style={S.scoreLabel}>Risk Score</div>
                <div style={S.scoreBarBg}>
                  <div style={{
                    ...S.scoreBarFill,
                    width:      `${result.riskScore}%`,
                    background: scoreColor(result.riskScore),
                  }} />
                </div>
              </div>
            </div>

            {/* Engine cards */}
            <div style={S.engGrid}>

              {/* Google Safe Browsing */}
              {result.engines?.googleSafeBrowsing && (
                <div style={S.engCard}>
                  <div style={S.engTitle}>🛡️ Google Safe Browsing</div>
                  <div style={S.engSrc}>
                    Source:{' '}
                    <span style={{ color:'#00d4ff' }}>
                      {result.engines.googleSafeBrowsing.source === 'mock' ? 'Simulated' : 'Live API'}
                    </span>
                  </div>
                  <div style={{
                    marginTop: 14, fontSize: 18, fontWeight: 700,
                    color: result.engines.googleSafeBrowsing.isSafe ? '#00ff88' : '#ff3366',
                  }}>
                    {result.engines.googleSafeBrowsing.isSafe
                      ? '✅ No Threats Found'
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

              {/* Shodan */}
              {result.engines?.shodan && (
                <div style={S.engCard}>
                  <div style={S.engTitle}>🔌 Shodan Port Scan</div>
                  <div style={S.engSrc}>
                    Source:{' '}
                    <span style={{ color:'#00d4ff' }}>
                      {result.engines.shodan.source === 'mock' ? 'Simulated' : 'Live API'}
                    </span>
                  </div>
                  <div style={S.portRow}>
                    <div>
                      <div style={S.portNum}>{result.engines.shodan.openPorts?.length || 0}</div>
                      <div style={S.portLabel}>Open Ports</div>
                    </div>
                    <div style={S.portList}>
                      {(result.engines.shodan.openPorts || []).slice(0, 8).map((p, i) => (
                        <span key={i} style={{
                          ...S.portBadge,
                          background:  DANGEROUS_PORTS.includes(p) ? 'rgba(255,51,102,0.15)' : 'rgba(255,255,255,0.05)',
                          color:       DANGEROUS_PORTS.includes(p) ? '#ff6688' : '#3a6a80',
                          borderColor: DANGEROUS_PORTS.includes(p) ? 'rgba(255,51,102,0.3)' : 'rgba(255,255,255,0.08)',
                        }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  {result.engines.shodan.vulnerabilities?.length > 0 && (
                    <div style={{ marginTop:12 }}>
                      <div style={{ fontSize:12, color:'#ff6688', fontWeight:600, marginBottom:4 }}>
                        ⚠ Known CVEs Detected:
                      </div>
                      {result.engines.shodan.vulnerabilities.slice(0, 3).map((v, i) => (
                        <div key={i} style={{ fontSize:12, color:'#ff9999', marginTop:4 }}>• {v}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Symptom summary */}
              {result.symptoms?.length > 0 && (
                <div style={S.engCard}>
                  <div style={S.engTitle}>🩺 Reported Symptoms</div>
                  <div style={S.engSrc}>
                    {result.symptomCount} symptom{result.symptomCount !== 1 ? 's' : ''} flagged
                  </div>
                  <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:6 }}>
                    {result.symptoms.map((sym, i) => (
                      <div key={i} style={S.symRow}>
                        <span style={{
                          color: sym.weight >= 40 ? '#ff3366' : sym.weight >= 20 ? '#ffaa00' : '#3a6a80',
                          fontSize: 14,
                        }}>●</span>
                        <span style={{ fontSize:13, color:'#b8dce8' }}>{sym.label}</span>
                        <span style={{ fontSize:11, color:'#1a3a55', marginLeft:'auto' }}>
                          +{sym.weight}pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div style={S.recsCard}>
              <h3 style={S.recsTitle}>
                {result.verdict === 'Compromised' ? '🚨 Immediate Action Required'
                  : result.verdict === 'Suspicious' ? '⚠️ Recommended Actions'
                  : '✅ Security Recommendations'}
              </h3>
              {result.recommendations.map((r, i) => (
                <div key={i} style={S.recRow}>
                  <span style={{
                    ...S.recArrow,
                    color: result.verdict === 'Compromised' ? '#ff3366' : '#00d4ff',
                  }}>→</span>
                  <span style={S.recText}>{r}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ textAlign:'center', marginTop:24, display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={handleReset} style={S.resetBtn}>
                ↩ Check Another Website
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
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #3a6a80; }
      `}</style>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page:          { maxWidth:900, margin:'0 auto', padding:'48px 24px 80px' },
  header:        { textAlign:'center', marginBottom:40 },
  headerBadge:   { display:'inline-block', padding:'6px 16px', background:'rgba(123,47,255,0.1)', border:'1px solid rgba(123,47,255,0.3)', borderRadius:20, fontSize:13, color:'#a07bff', fontWeight:600, marginBottom:16, fontFamily:"'JetBrains Mono',monospace" },
  title:         { fontSize:36, fontWeight:700, color:'#e8f4f8', margin:'0 0 12px', letterSpacing:'-0.8px', fontFamily:"'Inter',sans-serif" },
  subtitle:      { fontSize:16, color:'#3a6a80', margin:'0 0 12px', lineHeight:1.6 },
  loginNote:     { fontSize:14, color:'#1a3a55', margin:0 },

  card:          { background:'rgba(9,29,46,0.9)', border:'1px solid rgba(0,212,255,0.08)', borderRadius:16, padding:'28px 32px', marginBottom:24, backdropFilter:'blur(10px)' },
  label:         { fontSize:13, fontWeight:600, color:'#b8dce8', display:'block', marginBottom:10 },
  inputRow:      { display:'flex', gap:12, flexWrap:'wrap' },
  inputWrap:     { flex:1, position:'relative', minWidth:260 },
  inputIcon:     { position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', fontSize:18, pointerEvents:'none' },
  input:         { width:'100%', padding:'14px 14px 14px 46px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(0,212,255,0.12)', borderRadius:10, color:'#e8f4f8', fontSize:15, outline:'none', fontFamily:"'Inter',sans-serif", boxSizing:'border-box', transition:'border-color 0.2s' },
  checkBtn:      { padding:'14px 28px', background:'linear-gradient(135deg,#7b2fff,#5500cc)', color:'#fff', fontWeight:700, fontSize:15, border:'none', borderRadius:10, fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' },
  errorBox:      { marginTop:14, padding:'12px 16px', background:'rgba(255,51,102,0.1)', border:'1px solid rgba(255,51,102,0.3)', borderRadius:8, color:'#ff6688', fontSize:14 },

  symptomHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 },
  symptomTitle:  { fontSize:16, fontWeight:700, color:'#e8f4f8', margin:0 },
  symptomCount:  { fontSize:13, color:'#00d4ff', fontWeight:600 },
  symptomSub:    { fontSize:14, color:'#3a6a80', margin:'0 0 20px' },
  symptomsGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 },
  symptomCard:   { padding:'12px 16px', borderRadius:10, border:'1px solid', transition:'all 0.2s' },
  symptomRow:    { display:'flex', alignItems:'flex-start', gap:10 },
  checkbox:      { width:18, height:18, borderRadius:4, border:'1.5px solid', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2, transition:'all 0.15s' },
  checkmark:     { color:'#000', fontSize:12, fontWeight:700 },
  symLabel:      { fontSize:14, fontWeight:600, marginBottom:2, transition:'color 0.15s' },
  symDesc:       { fontSize:12, color:'#1a3a55', lineHeight:1.4 },
  weightBadge:   { marginLeft:'auto', padding:'2px 8px', background:'transparent', border:'1px solid', borderRadius:6, fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 },
  clearBtn:      { marginTop:16, padding:'7px 14px', background:'rgba(255,51,102,0.08)', border:'1px solid rgba(255,51,102,0.2)', borderRadius:8, color:'#ff6688', fontSize:13, cursor:'pointer', fontFamily:"'Inter',sans-serif" },

  progHeader:    { display:'flex', justifyContent:'space-between', marginBottom:12 },
  progPrompt:    { fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:'#7b2fff' },
  progPct:       { fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:'#3a6a80' },
  progBar:       { height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden', marginBottom:20 },
  progFill:      { height:'100%', background:'linear-gradient(90deg,#7b2fff,#00d4ff)', borderRadius:2, transition:'width 0.5s ease' },
  progSteps:     { fontFamily:"'JetBrains Mono',monospace", fontSize:13, display:'flex', flexDirection:'column', gap:6 },
  progStep:      { color:'#b8dce8', transition:'opacity 0.4s' },

  verdictBanner: { background:'rgba(9,29,46,0.95)', border:'1px solid', borderRadius:16, padding:'28px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:24, marginBottom:20 },
  verdictLeft:   { flex:1 },
  verdictTag:    { fontSize:11, fontWeight:700, color:'#3a6a80', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontFamily:"'JetBrains Mono',monospace" },
  verdictVal:    { fontSize:28, fontWeight:700, marginBottom:8, fontFamily:"'Inter',sans-serif" },
  verdictUrl:    { fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:'#3a6a80', wordBreak:'break-all', marginBottom:6 },
  verdictMeta:   { fontSize:13, color:'#1a3a55' },
  scoreBox:      { display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:100 },
  scoreBig:      { fontFamily:"'JetBrains Mono',monospace", fontSize:48, fontWeight:700, lineHeight:1 },
  scoreSub:      { fontSize:14, color:'#3a6a80' },
  scoreLabel:    { fontSize:12, color:'#3a6a80', marginBottom:6 },
  scoreBarBg:    { width:80, height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' },
  scoreBarFill:  { height:'100%', borderRadius:2 },

  engGrid:       { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:20 },
  engCard:       { background:'rgba(9,29,46,0.9)', border:'1px solid rgba(0,212,255,0.08)', borderRadius:14, padding:'22px 24px', backdropFilter:'blur(10px)' },
  engTitle:      { fontSize:15, fontWeight:700, color:'#e8f4f8', marginBottom:6 },
  engSrc:        { fontSize:12, color:'#1a3a55' },
  portRow:       { display:'flex', alignItems:'flex-start', gap:16, marginTop:14 },
  portNum:       { fontSize:32, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:'#00d4ff' },
  portLabel:     { fontSize:12, color:'#3a6a80' },
  portList:      { display:'flex', flexWrap:'wrap', gap:6 },
  portBadge:     { padding:'3px 8px', borderRadius:6, fontSize:12, fontFamily:"'JetBrains Mono',monospace", border:'1px solid' },
  symRow:        { display:'flex', alignItems:'center', gap:8 },

  recsCard:      { background:'rgba(9,29,46,0.9)', border:'1px solid rgba(0,212,255,0.08)', borderRadius:16, padding:'28px 32px', backdropFilter:'blur(10px)', marginBottom:20 },
  recsTitle:     { fontSize:16, fontWeight:700, color:'#e8f4f8', margin:'0 0 16px' },
  recRow:        { display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 },
  recArrow:      { fontWeight:700, flexShrink:0, marginTop:1 },
  recText:       { fontSize:14, color:'#b8dce8', lineHeight:1.5 },

  resetBtn:      { padding:'12px 24px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#b8dce8', fontSize:14, cursor:'pointer', fontFamily:"'Inter',sans-serif" },
  dashBtn:       { padding:'12px 24px', background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', borderRadius:10, color:'#00d4ff', fontSize:14, fontWeight:600, textDecoration:'none' },
};