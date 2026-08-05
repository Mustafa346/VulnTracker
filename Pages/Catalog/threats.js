// pages/catalog/threats.js
// ─────────────────────────────────────────────────────────────────────────────
//  Threat Encyclopedia Page
//  Route: /catalog/threats
//
//  Fetches all attack entries live from MongoDB via GET /api/attacks.
//  Replaced the hardcoded JavaScript array used in Assignments 1–3.
//
//  Features:
//    - Live data fetched from MongoDB on mount (useEffect)
//    - Loading spinner while API request is in progress
//    - Error message with seed instruction if database is empty
//    - Live search bar — filters by title, description, category, tags
//    - Severity filter buttons — All / Critical / High / Medium / Low
//    - Both filters work simultaneously (client-side, no extra API calls)
//    - Results count showing "X of Y threats matching..."
//    - Clickable tags on each card — instantly filter by that tag
//    - Expand / collapse button per card showing full details:
//        → How It Works
//        → Warning Indicators (orange bullets)
//        → Prevention Checklist (green checkmarks)
//        → Affected Systems (purple badges)
//        → Real-World Example (highlighted block)
//    - CVSS score badge per card
//    - Cards sorted by CVSS score descending (Critical first)
//    - "Clear filters" button when search returns no results
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import Head from 'next/head';

// ── Severity colour map ────────────────────────────────────────────────────
const SEV = {
  Critical: { bg:'rgba(255,51,102,0.12)',  border:'rgba(255,51,102,0.4)',  text:'#ff3366' },
  High:     { bg:'rgba(255,170,0,0.12)',   border:'rgba(255,170,0,0.4)',   text:'#ffaa00' },
  Medium:   { bg:'rgba(0,212,255,0.12)',   border:'rgba(0,212,255,0.4)',   text:'#00d4ff' },
  Low:      { bg:'rgba(0,255,136,0.12)',   border:'rgba(0,255,136,0.4)',   text:'#00ff88' },
};

export default function ThreatsPage() {
  const [attacks, setAttacks]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [severity, setSeverity]     = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  // ── Fetch all attacks from MongoDB on mount ──────────────────────────
  useEffect(() => {
    const fetchAttacks = async () => {
      try {
        const res  = await fetch('/api/attacks');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch attacks');
        setAttacks(data.data);
        setFiltered(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAttacks();
  }, []);

  // ── Client-side filter — runs whenever search or severity changes ─────
  useEffect(() => {
    let results = [...attacks];

    // Severity filter
    if (severity !== 'All') {
      results = results.filter(a => a.severity === severity);
    }

    // Text search across title, description, category, tags
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(a =>
        a.title.toLowerCase().includes(q)        ||
        a.description.toLowerCase().includes(q)  ||
        a.category.toLowerCase().includes(q)     ||
        (a.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    setFiltered(results);
  }, [search, severity, attacks]);

  const toggleExpand = (id) =>
    setExpandedId(prev => (prev === id ? null : id));

  const clearFilters = () => { setSearch(''); setSeverity('All'); };

  return (
    <>
      <Head>
        <title>Threat Encyclopedia — ValnTracker</title>
        <meta name="description" content="Browse 9 documented cybersecurity attack types with indicators, prevention checklists, and real-world examples." />
      </Head>

      <div style={S.page}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerBadge}>📚 Threat Encyclopedia</div>
          <h1 style={S.title}>Cybersecurity Threat Library</h1>
          <p style={S.subtitle}>
            Explore{' '}
            <span style={{ color:'#00d4ff' }}>{attacks.length} documented attack types</span>
            {' '}— understand how they work, spot the warning signs,
            and learn how to defend against them.
          </p>
        </div>

        {/* ── Search + Severity filters ────────────────────────────────── */}
        <div style={S.controls}>

          {/* Search input */}
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search threats, categories, tags..."
              style={S.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={S.clearX}>✕</button>
            )}
          </div>

          {/* Severity filter buttons */}
          <div style={S.filterBtns}>
            {['All','Critical','High','Medium','Low'].map(s => {
              const sc     = SEV[s];
              const active = severity === s;
              return (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  style={{
                    ...S.filterBtn,
                    background:  active ? (sc?.bg   || 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.03)',
                    border:      `1px solid ${active ? (sc?.border || 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.08)'}`,
                    color:       active ? (sc?.text  || '#ffffff') : '#3a6a80',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results count ────────────────────────────────────────────── */}
        {!loading && (
          <div style={S.resultBar}>
            <span style={S.resultText}>
              {filtered.length === attacks.length
                ? `${attacks.length} threats`
                : `${filtered.length} of ${attacks.length} threats`}
              {search    && <span style={{ color:'#00d4ff' }}> matching "{search}"</span>}
              {severity !== 'All' && (
                <span style={{ color: SEV[severity]?.text }}> — {severity}</span>
              )}
            </span>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loading && (
          <div style={S.loadingBox}>
            <div style={S.spinner} />
            <p style={{ color:'#3a6a80', marginTop:16 }}>
              Loading threat database...
            </p>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && (
          <div style={S.errorBox}>
            ⚠ {error} — Make sure MongoDB is connected and you have run:{' '}
            <code style={{ color:'#00d4ff', fontFamily:"'JetBrains Mono',monospace" }}>
              npm run seed
            </code>
          </div>
        )}

        {/* ── No results ───────────────────────────────────────────────── */}
        {!loading && !error && filtered.length === 0 && (
          <div style={S.emptyBox}>
            <span style={{ fontSize:40 }}>🔍</span>
            <p style={{ color:'#3a6a80', marginTop:12 }}>
              No threats match your search.
            </p>
            <button onClick={clearFilters} style={S.clearBtn}>
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Attack Cards Grid ─────────────────────────────────────────── */}
        <div style={S.grid}>
          {filtered.map(attack => {
            const sc       = SEV[attack.severity] || SEV['Medium'];
            const expanded = expandedId === attack._id;

            return (
              <div
                key={attack._id}
                style={{
                  ...S.card,
                  borderColor: expanded ? sc.border : 'rgba(255,255,255,0.07)',
                  boxShadow:   expanded ? `0 0 30px ${sc.border}22` : 'none',
                }}
              >
                {/* ── Card header ─────────────────────────────────────── */}
                <div style={S.cardTop}>

                  {/* Severity + Category + CVSS */}
                  <div style={S.cardMeta}>
                    <span style={{
                      ...S.sevBadge,
                      background: sc.bg,
                      border:     `1px solid ${sc.border}`,
                      color:      sc.text,
                    }}>
                      {attack.severity}
                    </span>
                    <span style={S.catBadge}>{attack.category}</span>
                    {attack.cvssScore && (
                      <span style={{ ...S.cvssBadge, color: sc.text }}>
                        CVSS {attack.cvssScore}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 style={S.cardTitle}>{attack.title}</h2>

                  {/* Description */}
                  <p style={S.cardDesc}>{attack.description}</p>
                </div>

                {/* ── Tags ────────────────────────────────────────────── */}
                {attack.tags?.length > 0 && (
                  <div style={S.tagRow}>
                    {attack.tags.map(tag => (
                      <span
                        key={tag}
                        style={S.tag}
                        onClick={() => setSearch(tag)}
                        title={`Search for "${tag}"`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* ── Expand / Collapse button ─────────────────────────── */}
                <button
                  onClick={() => toggleExpand(attack._id)}
                  style={{
                    ...S.expandBtn,
                    borderColor: expanded ? sc.border : 'rgba(255,255,255,0.08)',
                    color:       expanded ? sc.text   : '#3a6a80',
                  }}
                >
                  {expanded ? '▲ Hide Details' : '▼ View Full Details & Prevention'}
                </button>

                {/* ── Expanded content ─────────────────────────────────── */}
                {expanded && (
                  <div style={S.expandedSection}>

                    {/* How it works */}
                    {attack.howItWorks && (
                      <div style={S.infoBlock}>
                        <h4 style={S.blockTitle}>⚙️ How It Works</h4>
                        <p style={S.blockText}>{attack.howItWorks}</p>
                      </div>
                    )}

                    {/* Warning indicators */}
                    {attack.indicators?.length > 0 && (
                      <div style={S.infoBlock}>
                        <h4 style={{ ...S.blockTitle, color:'#ffaa00' }}>
                          🔴 Warning Indicators
                        </h4>
                        <ul style={S.list}>
                          {attack.indicators.map((ind, i) => (
                            <li key={i} style={S.listItem}>
                              <span style={{ color:'#ffaa00', marginRight:8, flexShrink:0 }}>●</span>
                              {ind}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Prevention checklist */}
                    {attack.prevention?.length > 0 && (
                      <div style={S.infoBlock}>
                        <h4 style={{ ...S.blockTitle, color:'#00ff88' }}>
                          🛡️ Prevention Checklist
                        </h4>
                        <ul style={S.list}>
                          {attack.prevention.map((step, i) => (
                            <li key={i} style={S.listItem}>
                              <span style={{ color:'#00ff88', marginRight:8, flexShrink:0 }}>✓</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Affected systems */}
                    {attack.affectedSystems?.length > 0 && (
                      <div style={S.infoBlock}>
                        <h4 style={S.blockTitle}>💻 Affected Systems</h4>
                        <div style={S.systemsRow}>
                          {attack.affectedSystems.map(sys => (
                            <span key={sys} style={S.sysBadge}>{sys}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Real-world example */}
                    {attack.realWorldExample && (
                      <div style={S.exampleBlock}>
                        <h4 style={{ ...S.blockTitle, color:'#a07bff' }}>
                          📰 Real-World Example
                        </h4>
                        <p style={{ ...S.blockText, color:'#b8dce8', fontStyle:'italic' }}>
                          {attack.realWorldExample}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #3a6a80; }
        .tag-hover:hover { color: #00d4ff !important; border-color: rgba(0,212,255,0.4) !important; }
      `}</style>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page:         { maxWidth:1100, margin:'0 auto', padding:'48px 24px 80px' },

  header:       { textAlign:'center', marginBottom:48 },
  headerBadge:  { display:'inline-block', padding:'6px 16px', background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:20, fontSize:13, color:'#00d4ff', fontWeight:600, marginBottom:16, fontFamily:"'JetBrains Mono',monospace" },
  title:        { fontSize:40, fontWeight:700, color:'#e8f4f8', margin:'0 0 14px', letterSpacing:'-1px', fontFamily:"'Inter',sans-serif" },
  subtitle:     { fontSize:16, color:'#3a6a80', margin:'0 auto', lineHeight:1.7, maxWidth:600 },

  controls:     { display:'flex', gap:16, flexWrap:'wrap', marginBottom:20, alignItems:'center' },
  searchWrap:   { flex:1, position:'relative', minWidth:260 },
  searchIcon:   { position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none' },
  searchInput:  { width:'100%', padding:'12px 14px 12px 42px', background:'rgba(9,29,46,0.8)', border:'1px solid rgba(0,212,255,0.12)', borderRadius:10, color:'#e8f4f8', fontSize:14, outline:'none', fontFamily:"'Inter',sans-serif", boxSizing:'border-box', transition:'border-color 0.2s' },
  clearX:       { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#3a6a80', fontSize:14, cursor:'pointer', padding:'2px 6px' },
  filterBtns:   { display:'flex', gap:8, flexWrap:'wrap' },
  filterBtn:    { padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' },

  resultBar:    { marginBottom:24, minHeight:20 },
  resultText:   { fontSize:13, color:'#3a6a80' },

  loadingBox:   { textAlign:'center', padding:'80px 0', display:'flex', flexDirection:'column', alignItems:'center' },
  spinner:      { width:36, height:36, border:'3px solid rgba(0,212,255,0.2)', borderTop:'3px solid #00d4ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  errorBox:     { padding:'16px 20px', background:'rgba(255,51,102,0.08)', border:'1px solid rgba(255,51,102,0.25)', borderRadius:12, color:'#ff6688', fontSize:14, marginBottom:24 },
  emptyBox:     { textAlign:'center', padding:'60px 0', display:'flex', flexDirection:'column', alignItems:'center' },
  clearBtn:     { marginTop:14, padding:'8px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#b8dce8', fontSize:14, cursor:'pointer', fontFamily:"'Inter',sans-serif" },

  grid:         { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(480px,1fr))', gap:20 },

  card:         { background:'rgba(9,29,46,0.9)', border:'1px solid', borderRadius:16, padding:'24px 28px', backdropFilter:'blur(10px)', transition:'border-color 0.2s, box-shadow 0.2s', display:'flex', flexDirection:'column', gap:16 },
  cardTop:      { display:'flex', flexDirection:'column', gap:10 },
  cardMeta:     { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  sevBadge:     { display:'inline-block', padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', fontFamily:"'JetBrains Mono',monospace" },
  catBadge:     { padding:'3px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, fontSize:11, color:'#3a6a80', fontWeight:600 },
  cvssBadge:    { fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", marginLeft:4 },
  cardTitle:    { fontSize:20, fontWeight:700, color:'#e8f4f8', margin:0, fontFamily:"'Inter',sans-serif" },
  cardDesc:     { fontSize:14, color:'#3a6a80', lineHeight:1.65, margin:0 },

  tagRow:       { display:'flex', flexWrap:'wrap', gap:6 },
  tag:          { padding:'3px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, fontSize:12, color:'#3a6a80', cursor:'pointer', transition:'color 0.15s, border-color 0.15s', fontFamily:"'JetBrains Mono',monospace" },

  expandBtn:    { padding:'10px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all 0.2s', textAlign:'left' },

  expandedSection: { display:'flex', flexDirection:'column', gap:18, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:18 },
  infoBlock:    { display:'flex', flexDirection:'column', gap:10 },
  blockTitle:   { fontSize:13, fontWeight:700, color:'#00d4ff', textTransform:'uppercase', letterSpacing:'0.05em', margin:0 },
  blockText:    { fontSize:14, color:'#b8dce8', lineHeight:1.65, margin:0 },
  list:         { listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 },
  listItem:     { fontSize:14, color:'#b8dce8', lineHeight:1.55, display:'flex', alignItems:'flex-start' },
  systemsRow:   { display:'flex', flexWrap:'wrap', gap:8 },
  sysBadge:     { padding:'4px 12px', background:'rgba(123,47,255,0.1)', border:'1px solid rgba(123,47,255,0.25)', borderRadius:8, fontSize:12, color:'#a07bff' },
  exampleBlock: { padding:'14px 18px', background:'rgba(160,123,255,0.06)', border:'1px solid rgba(160,123,255,0.15)', borderRadius:10, display:'flex', flexDirection:'column', gap:8 },
};
