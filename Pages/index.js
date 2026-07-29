// pages/index.js
// ─────────────────────────────────────────────────────────────────────────────
//  ValnTracker — Landing Page
//  Route: /
//
//  Sections:
//    1. HERO         — animated badge, title, tagline, CTA buttons
//    2. STATS BAR    — 4 key platform statistics
//    3. ABOUT        — platform description + terminal animation + pillars
//    4. FEATURES     — 3 catalog module cards with hover effects
//
//  Design system:
//    - font-orbitron  → headings, numbers, CTA text
//    - font-jetbrains → terminal lines, code text, badge text
//    - font-syne      → stat labels, section kickers
//    - Tailwind CSS   → all layout and styling
//    - animate-blink  → status dot in hero badge
//    - animate-cursor → blinking terminal cursor
//
//  This page uses the shared Layout (Navbar + Footer + background) provided
//  by _app.js. No noLayout flag is set.
// ─────────────────────────────────────────────────────────────────────────────

import Head from 'next/head';
import Link from 'next/link';

// ── Page Data ─────────────────────────────────────────────────────────────────

const stats = [
  { num: '9+',     label: 'Attack Types',   color: '#00d4ff', shadow: '0 0 20px rgba(0,212,255,0.3)' },
  { num: '70+',    label: 'AV Engines',     color: '#00ff9d', shadow: '0 0 20px rgba(0,255,157,0.3)' },
  { num: '1 in 3', label: 'Links Unsafe',   color: '#ff4560', shadow: '0 0 20px rgba(255,69,96,0.3)'  },
  { num: 'Live',   label: 'Threat Data',    color: '#f5a623', shadow: '0 0 20px rgba(245,166,35,0.3)' },
];

const pillars = [
  {
    icon:   '📚',
    name:   'Threat Encyclopedia',
    desc:   '9 documented attack types with real-world examples, indicators, and prevention checklists.',
    accent: '#00d4ff',
  },
  {
    icon:   '🛡️',
    name:   'Website Compromise Detector',
    desc:   'Submit your site URL and symptoms — get a weighted risk score and full recovery guide.',
    accent: '#00ff9d',
  },
  {
    icon:   '🔗',
    name:   'URL & Link Safety Scanner',
    desc:   'Instant threat report on any suspicious link powered by VirusTotal and Google Safe Browsing.',
    accent: '#ff4560',
  },
];

const terminalLines = [
  { type: 'cmd',    text: ' valntracker --init' },
  { type: 'ok',     text: '✔ ValnTracker v2.0 loaded' },
  { type: 'gap' },
  { type: 'cmd',    text: ' scan --url https://target.com' },
  { type: 'normal', text: '⠿ Checking domain reputation...' },
  { type: 'normal', text: '⠿ Running malware signature match...' },
  { type: 'normal', text: '⠿ Querying 70+ antivirus engines...' },
  { type: 'warn',   text: '⚠ Redirect chain detected — 3 hops' },
  { type: 'danger', text: '✖ Domain flagged in PhishTank DB' },
  { type: 'gap' },
  { type: 'cmd',    text: ' report --generate' },
  { type: 'info',   text: '→ Threat Score : 82 / 100' },
  { type: 'info',   text: '→ Risk Level   : CRITICAL' },
  { type: 'info',   text: '→ Action       : DO NOT VISIT' },
  { type: 'gap' },
  { type: 'cursor' },
];

const features = [
  {
    num:  '01',
    icon: '⚔️',
    title: 'Threat Encyclopedia',
    desc:  'A curated library of 9 cyberattacks — how they work, real-world breach examples, CVSS scores, and proven prevention strategies. Searchable and filterable by severity.',
    tags:  ['SQL Injection', 'Ransomware', 'DDoS', 'Phishing', 'XSS', '+4 more'],
    href:  '/catalog/threats',
    top:   'linear-gradient(90deg,#ff4560,#f5a623)',
    bg:    'rgba(255,69,96,0.08)',
    bdr:   'rgba(255,69,96,0.18)',
  },
  {
    num:  '02',
    icon: '🛡️',
    title: 'Hack Checker',
    desc:  'Think your website was compromised? Submit your URL and select symptoms. Our weighted scoring engine combines Google Safe Browsing, Shodan port analysis, and symptom data.',
    tags:  ['Google Safe Browsing', 'Shodan', 'Symptom Scoring', 'Risk Score'],
    href:  '/catalog/checker',
    top:   'linear-gradient(90deg,#00d4ff,#00ff9d)',
    bg:    'rgba(0,212,255,0.06)',
    bdr:   'rgba(0,212,255,0.16)',
  },
  {
    num:  '03',
    icon: '🔗',
    title: 'Link Safety Scanner',
    desc:  'Paste any suspicious link before clicking it. We scan across 70+ antivirus engines via VirusTotal, check Google Safe Browsing, and run a full URLScan.io page analysis.',
    tags:  ['VirusTotal API', 'Google Safe Browsing', 'URLScan.io', 'SSL Check'],
    href:  '/catalog/scanner',
    top:   'linear-gradient(90deg,#00ff9d,#00d4ff)',
    bg:    'rgba(0,255,157,0.06)',
    bdr:   'rgba(0,255,157,0.15)',
  },
];

// Terminal line colour classes
const lineColor = {
  cmd:    'text-[#e8f4f8]',
  ok:     'text-[#00ff9d]',
  normal: 'text-[#3a6a80]',
  warn:   'text-[#f5a623]',
  danger: 'text-[#ff4560]',
  info:   'text-[#00d4ff]',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Head>
        <title>ValnTracker — Cybersecurity Intelligence Platform</title>
        <meta name="description" content="Detect, Analyze, Protect, Recover. Powered by VirusTotal, Google Safe Browsing, Shodan, and URLScan.io." />
      </Head>

      {/* ================================================================
          SECTION 1 — HERO
      ================================================================ */}
      <section className="relative min-h-screen flex flex-col items-center
                          justify-center text-center px-6 pt-[90px] pb-16">

        {/* Live status badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-[18px] py-[6px] mb-9"
          style={{
            background: 'rgba(0,212,255,0.06)',
            border:     '1px solid rgba(0,212,255,0.25)',
          }}
        >
          <span
            className="w-[6px] h-[6px] rounded-full bg-[#00ff9d] animate-blink"
            style={{ boxShadow: '0 0 10px #00ff9d' }}
          />
          <span className="font-jetbrains text-[0.65rem] tracking-[3px] text-[#00d4ff] uppercase">
            Cybersecurity Intelligence Platform — v2.0
          </span>
        </div>

        {/* Eyebrow */}
        <p className="font-jetbrains text-[0.68rem] tracking-[6px] text-[#3a6a80] uppercase mb-5">
          Detect · Analyze · Protect · Recover
        </p>

        {/* Main heading */}
        <h1 className="font-orbitron font-black leading-none mb-4">
          <span
            className="block text-[clamp(3rem,9vw,6.5rem)] text-[#e8f4f8]"
            style={{ textShadow: '0 0 60px rgba(0,212,255,0.18)' }}
          >
            ValnTracker
          </span>
          <span
            className="block mt-2 font-normal tracking-[10px] text-transparent
                       text-[clamp(1.2rem,3vw,2.4rem)]"
            style={{ WebkitTextStroke: '1px rgba(0,212,255,0.4)' }}
          >
            SECURITY PLATFORM
          </span>
        </h1>

        {/* Tagline */}
        <p className="font-orbitron text-[clamp(0.6rem,1.3vw,0.78rem)] tracking-[5px]
                      text-[#00d4ff] uppercase mb-7">
          Vulnerability Tracking &amp;{' '}
          <em className="text-[#00ff9d] not-italic">Threat Intelligence</em>
        </p>

        {/* Description */}
        <p className="max-w-[580px] text-[0.98rem] font-light leading-[1.85] text-[#3a6a80] mb-12">
          A comprehensive cybersecurity platform built to{' '}
          <strong className="text-[#b8dce8] font-semibold">
            educate, detect, and protect
          </strong>.
          Whether you are a student, developer, or security professional —
          ValnTracker gives you the tools to understand threats, analyse your
          digital assets, and stay one step ahead of attackers.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/catalog/threats"
            className="inline-flex items-center gap-2 font-orbitron text-[0.68rem]
                       font-bold tracking-[3px] uppercase text-black bg-[#00d4ff]
                       rounded-md px-9 py-[15px] no-underline transition-all
                       duration-200 hover:bg-[#e8f4f8] hover:-translate-y-0.5"
            style={{ boxShadow: '0 0 28px rgba(0,212,255,0.4)' }}
          >
            ⬡ &nbsp; Explore Catalogs
          </Link>
          <Link
            href="#about"
            className="inline-flex items-center gap-2 font-orbitron text-[0.68rem]
                       font-semibold tracking-[3px] uppercase text-[#b8dce8]
                       bg-transparent rounded-md px-9 py-[14px] no-underline
                       transition-all duration-200 hover:text-[#00d4ff]
                       hover:-translate-y-0.5"
            style={{ border: '1px solid rgba(0,212,255,0.22)' }}
          >
            Learn More &nbsp; ↓
          </Link>
        </div>
      </section>

      {/* ================================================================
          SECTION 2 — STATS BAR
      ================================================================ */}
      <div
        id="stats"
        className="relative z-10 flex justify-center gap-16 flex-wrap
                   px-11 py-7 border-t border-b border-[rgba(0,212,255,0.10)]"
        style={{ background: 'rgba(4,14,26,0.95)' }}
      >
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <span
              className="block font-orbitron font-black text-[1.9rem] leading-none mb-1"
              style={{ color: s.color, textShadow: s.shadow }}
            >
              {s.num}
            </span>
            <span className="font-syne text-[0.7rem] font-semibold tracking-[2px]
                             uppercase text-[#3a6a80]">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ================================================================
          SECTION 3 — ABOUT
      ================================================================ */}
      <section id="about" className="relative z-10 max-w-[1200px] mx-auto px-11 py-[90px]">
        <div className="grid grid-cols-2 gap-[70px] items-center max-[860px]:grid-cols-1">

          {/* Left — Text content */}
          <div>
            {/* Section kicker */}
            <div className="flex items-center gap-2 font-jetbrains text-[0.65rem]
                            tracking-[4px] text-[#00d4ff] uppercase mb-4">
              <span className="w-6 h-px bg-[#00d4ff]" />
              About ValnTracker
            </div>

            <h2 className="font-orbitron text-[clamp(1.5rem,3vw,2.2rem)] font-bold
                           text-[#e8f4f8] leading-[1.2] mb-5">
              Your All-in-One<br />
              <span className="text-[#00d4ff]">Cyber Defense</span><br />
              Intelligence Hub
            </h2>

            <p className="text-[0.92rem] font-light leading-[1.9] text-[#3a6a80] mb-4">
              ValnTracker was built with one mission — to make{' '}
              <strong className="text-[#b8dce8] font-semibold">
                cybersecurity tools and knowledge accessible to everyone
              </strong>.
              The digital world is full of threats, from sophisticated malware
              to phishing links hiding in your inbox.
            </p>

            <p className="text-[0.92rem] font-light leading-[1.9] text-[#3a6a80] mb-6">
              Our platform combines a{' '}
              <strong className="text-[#b8dce8] font-semibold">
                rich threat knowledge base
              </strong>,
              an intelligent{' '}
              <strong className="text-[#b8dce8] font-semibold">
                website compromise detector
              </strong>,
              and a real-time{' '}
              <strong className="text-[#b8dce8] font-semibold">
                URL safety scanner
              </strong>{' '}
              — all in one unified interface backed by a full-stack
              Next.js + MongoDB backend.
            </p>

            {/* Platform pillars */}
            <div className="flex flex-col gap-[10px]">
              {pillars.map(p => (
                <div
                  key={p.name}
                  className="flex items-start gap-3 p-[14px] rounded-lg
                             transition-all duration-200 hover:translate-x-1
                             hover:bg-[#0c2438]"
                  style={{
                    background:  '#091d2e',
                    border:      '1px solid rgba(0,212,255,0.10)',
                    borderLeft:  `3px solid ${p.accent}`,
                  }}
                >
                  <span className="text-[1.1rem] flex-shrink-0 mt-[2px]">
                    {p.icon}
                  </span>
                  <div>
                    <div className="font-syne text-[0.86rem] font-bold
                                    text-[#e8f4f8] mb-1">
                      {p.name}
                    </div>
                    <div className="text-[0.78rem] text-[#3a6a80] leading-[1.5]">
                      {p.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Terminal window */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: '#071525',
              border:     '1px solid rgba(0,212,255,0.22)',
              boxShadow:  '0 24px 70px rgba(0,0,0,0.5), 0 0 28px rgba(0,212,255,0.15)',
            }}
          >
            {/* Terminal title bar */}
            <div
              className="flex items-center gap-3 px-4 py-[11px]
                         border-b border-[rgba(0,212,255,0.10)]"
              style={{ background: '#091d2e' }}
            >
              <div className="flex gap-[5px]">
                {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
                  <div
                    key={c}
                    className="w-[9px] h-[9px] rounded-full"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="font-jetbrains text-[0.65rem] text-[#3a6a80]
                              flex-1 text-center">
                valntracker — threat_scan.sh
              </div>
            </div>

            {/* Terminal body */}
            <div className="p-5 font-jetbrains text-[0.75rem] leading-[2]">
              {terminalLines.map((line, i) => {
                if (line.type === 'gap') {
                  return <div key={i} className="h-[7px]" />;
                }
                if (line.type === 'cursor') {
                  return (
                    <div key={i} className="flex gap-[7px]">
                      <span className="text-[#00ff9d]">$</span>
                      <span
                        className="inline-block w-[7px] h-[13px] bg-[#00d4ff]
                                   align-middle animate-cursor"
                      />
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    className={line.type === 'cmd' ? 'flex gap-[7px]' : 'pl-[18px]'}
                  >
                    {line.type === 'cmd' && (
                      <span className="text-[#00ff9d]">$</span>
                    )}
                    <span className={lineColor[line.type] || 'text-[#3a6a80]'}>
                      {line.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div
        className="max-w-[1200px] mx-auto h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(0,212,255,0.22), transparent)',
        }}
      />

      {/* ================================================================
          SECTION 4 — FEATURES / CATALOG PREVIEW
      ================================================================ */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-11 py-[90px]">

        {/* Section header */}
        <div className="text-center mb-12">
          <span className="block font-jetbrains text-[0.65rem] tracking-[4px]
                           text-[#00d4ff] uppercase mb-3">
            What ValnTracker Covers
          </span>
          <h2 className="font-orbitron text-[clamp(1.5rem,3vw,2.2rem)]
                         font-bold text-[#e8f4f8]">
            Three Powerful{' '}
            <span className="text-[#00d4ff]">Security Modules</span>
          </h2>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-3 gap-[18px] max-[860px]:grid-cols-1">
          {features.map(f => (
            <Link
              key={f.href}
              href={f.href}
              className="relative rounded-xl p-7 overflow-hidden no-underline
                         transition-all duration-300 group block
                         hover:-translate-y-1"
              style={{
                background: '#091d2e',
                border:     '1px solid rgba(0,212,255,0.10)',
              }}
            >
              {/* Coloured top accent bar — visible on hover */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] opacity-0
                           group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: f.top }}
              />

              {/* Card number */}
              <div className="font-orbitron text-[0.58rem] tracking-[3px]
                              text-[#3a6a80] mb-[18px] flex items-center gap-2">
                {f.num}
                <span className="flex-1 h-px bg-[rgba(0,212,255,0.10)]" />
              </div>

              {/* Icon box */}
              <div
                className="w-12 h-12 flex items-center justify-center
                           rounded-[10px] text-[1.4rem] mb-4"
                style={{ background: f.bg, border: `1px solid ${f.bdr}` }}
              >
                {f.icon}
              </div>

              {/* Title */}
              <div className="font-orbitron text-[0.88rem] font-bold
                              text-[#e8f4f8] tracking-[1px] mb-3">
                {f.title}
              </div>

              {/* Description */}
              <p className="text-[0.84rem] font-light leading-[1.75] text-[#3a6a80]">
                {f.desc}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-[6px] mt-4">
                {f.tags.map(t => (
                  <span
                    key={t}
                    className="font-jetbrains text-[0.58rem] tracking-[1px]
                               px-[9px] py-[3px] rounded text-[#3a6a80]"
                    style={{
                      background: 'rgba(0,212,255,0.06)',
                      border:     '1px solid rgba(0,212,255,0.10)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
