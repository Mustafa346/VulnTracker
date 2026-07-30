// components/Footer.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  Shared Footer Component
//  Rendered on every page via components/Layout.jsx
//
//  Layout:
//    4-column grid:
//      Col 1 — Brand (logo, tagline, tech stack badges)
//      Col 2 — Catalog links
//      Col 3 — Account links
//      Col 4 — External API resources
//
//  Bottom bar:
//    Left  — copyright text
//    Right — live status indicator (green dot + "All systems operational")
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';

// ── Footer link sections ───────────────────────────────────────────────────
const SECTIONS = [
  {
    title: 'Catalog',
    links: [
      { href: '/catalog/threats', label: 'Threat Encyclopedia' },
      { href: '/catalog/checker', label: 'Hack Checker'        },
      { href: '/catalog/scanner', label: 'Link Scanner'        },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/login',     label: 'Login'     },
      { href: '/register',  label: 'Register'  },
    ],
  },
  {
    title: 'Powered By',
    links: [
      { href: 'https://www.virustotal.com',      label: 'VirusTotal',           external: true },
      { href: 'https://safebrowsing.google.com', label: 'Google Safe Browsing', external: true },
      { href: 'https://urlscan.io',              label: 'URLScan.io',           external: true },
      { href: 'https://www.shodan.io',           label: 'Shodan',               external: true },
    ],
  },
];

// ── Tech stack badges shown in brand column ────────────────────────────────
const TECH_BADGES = [
  'Next.js 14',
  'React 18',
  'MongoDB',
  'NextAuth.js',
  'Tailwind CSS',
  'VirusTotal API',
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={S.footer}>

      {/* ── Top section — 4 columns ───────────────────────────────────── */}
      <div style={S.top}>

        {/* Column 1 — Brand ────────────────────────────────────────────── */}
        <div style={S.brand}>

          {/* Logo */}
          <Link href="/" style={S.logo}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <span style={S.logoText}>
              Valn<span style={{ color: '#00d4ff' }}>Tracker</span>
            </span>
          </Link>

          {/* Tagline */}
          <p style={S.tagline}>
            A full-stack cybersecurity intelligence platform built to educate,
            detect, and protect. Powered by real threat intelligence APIs.
          </p>

          {/* Tech stack badges */}
          <div style={S.badges}>
            {TECH_BADGES.map(t => (
              <span key={t} style={S.badge}>{t}</span>
            ))}
          </div>
        </div>

        {/* Columns 2–4 — Link sections ─────────────────────────────────── */}
        {SECTIONS.map(section => (
          <div key={section.title} style={S.section}>
            <h4 style={S.sectionTitle}>{section.title}</h4>
            <ul style={S.linkList}>
              {section.links.map(link => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={S.footerLink}
                    >
                      {link.label} ↗
                    </a>
                  ) : (
                    <Link href={link.href} style={S.footerLink}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div style={S.divider} />

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div style={S.bottom}>

        {/* Copyright */}
        <p style={S.copyright}>
          © {year} ValnTracker — Built with Next.js, React &amp; MongoDB.
          Web Application Development — COMSATS University Islamabad.
        </p>

        {/* Live status indicator */}
        <div style={S.statusRow}>
          <span style={S.statusDot} />
          <span style={S.statusText}>All systems operational</span>
        </div>
      </div>

      {/* Pulse animation for the status dot */}
      <style>{`
        @keyframes statusPulse {
          0%,100% { opacity: 1; box-shadow: 0 0 6px #00ff88; }
          50%      { opacity: 0.6; box-shadow: 0 0 12px #00ff88; }
        }
      `}</style>
    </footer>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  footer: {
    background:  'rgba(4,10,20,0.97)',
    borderTop:   '1px solid rgba(0,212,255,0.08)',
    padding:     '60px 40px 32px',
    fontFamily:  "'Inter', sans-serif",
    marginTop:   'auto',
  },

  // ── Top grid ──────────────────────────────────────────────────────────
  top: {
    maxWidth:             1200,
    margin:               '0 auto',
    display:              'grid',
    gridTemplateColumns:  '2fr 1fr 1fr 1fr',
    gap:                  48,
  },

  // ── Brand column ──────────────────────────────────────────────────────
  brand: {
    display:        'flex',
    flexDirection:  'column',
    gap:            16,
  },
  logo: {
    display:        'flex',
    alignItems:     'center',
    gap:            8,
    textDecoration: 'none',
    width:          'fit-content',
  },
  logoText: {
    fontFamily:    "'JetBrains Mono', monospace",
    fontWeight:    700,
    fontSize:      18,
    color:         '#e8f4f8',
    letterSpacing: '-0.3px',
  },
  tagline: {
    fontSize:   13,
    color:      '#3a6a80',
    lineHeight: 1.7,
    margin:     0,
    maxWidth:   280,
  },
  badges: {
    display:   'flex',
    flexWrap:  'wrap',
    gap:       6,
  },
  badge: {
    padding:      '3px 10px',
    background:   'rgba(0,212,255,0.05)',
    border:       '1px solid rgba(0,212,255,0.12)',
    borderRadius: 10,
    fontSize:     11,
    color:        '#3a6a80',
    fontFamily:   "'JetBrains Mono', monospace",
  },

  // ── Link sections ─────────────────────────────────────────────────────
  section: {},
  sectionTitle: {
    fontSize:      11,
    fontWeight:    700,
    color:         '#3a6a80',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin:        '0 0 16px',
    fontFamily:    "'JetBrains Mono', monospace",
  },
  linkList: {
    listStyle: 'none',
    padding:   0,
    margin:    0,
    display:   'flex',
    flexDirection: 'column',
    gap:       10,
  },
  footerLink: {
    fontSize:       13,
    color:          '#3a6a80',
    textDecoration: 'none',
    transition:     'color 0.2s',
  },

  // ── Divider ───────────────────────────────────────────────────────────
  divider: {
    maxWidth:   1200,
    margin:     '40px auto 28px',
    height:     1,
    background: 'rgba(0,212,255,0.08)',
  },

  // ── Bottom bar ────────────────────────────────────────────────────────
  bottom: {
    maxWidth:       1200,
    margin:         '0 auto',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexWrap:       'wrap',
    gap:            12,
  },
  copyright: {
    fontSize: 12,
    color:    '#1a3a55',
    margin:   0,
  },
  statusRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        8,
  },
  statusDot: {
    width:        8,
    height:       8,
    borderRadius: '50%',
    background:   '#00ff88',
    boxShadow:    '0 0 8px #00ff88',
    animation:    'statusPulse 2.5s ease-in-out infinite',
    display:      'inline-block',
    flexShrink:   0,
  },
  statusText: {
    fontSize: 12,
    color:    '#1a3a55',
  },
};
