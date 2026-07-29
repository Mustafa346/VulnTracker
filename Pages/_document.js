// pages/_document.js
// ─────────────────────────────────────────────────────────────────────────────
//  Next.js Custom Document
//  Extends the default HTML document that Next.js generates for every page.
//  This is the correct place to add:
//    - Global <head> tags (meta, fonts, favicon, Open Graph)
//    - HTML lang attribute
//    - Theme color for mobile browsers
//
//  Unlike _app.js, _document.js renders on the SERVER ONLY —
//  it is not re-rendered on the client. Keep it free of client-side
//  logic or browser APIs.
//
//  Google Fonts are loaded here with:
//    1. preconnect links — tells the browser to open a connection to
//       fonts.googleapis.com and fonts.gstatic.com early, reducing
//       the time it takes to download the fonts.
//    2. The actual stylesheet link — loads four font families:
//         Orbitron    — futuristic headings used across index.js
//         JetBrains Mono — terminal text, code blocks, stat numbers
//         Syne        — labels, badges, uppercase tracking text
//         Inter       — body text, forms, general UI (default font)
//
//  Open Graph meta tags allow the project to show a proper preview
//  card when shared on LinkedIn, WhatsApp, or other platforms.
// ─────────────────────────────────────────────────────────────────────────────

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>

        {/* ── Favicon (emoji-based SVG — no image file needed) ─────────── */}
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>"
        />

        {/* ── Theme color — browser tab / mobile status bar color ───────── */}
        <meta name="theme-color" content="#040e1a" />

        {/* ── Primary meta description ──────────────────────────────────── */}
        <meta
          name="description"
          content="ValnTracker — A full-stack cybersecurity intelligence platform. Scan URLs, detect website compromises, and explore the threat encyclopedia. Powered by VirusTotal, Google Safe Browsing, Shodan, and URLScan.io."
        />

        {/* ── Open Graph meta tags (LinkedIn, WhatsApp, Discord previews) ── */}
        <meta property="og:title"       content="ValnTracker — Cybersecurity Intelligence Platform" />
        <meta property="og:description" content="Detect, Analyze, Protect, Recover. Scan any URL against 70+ antivirus engines and check websites for compromise." />
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="ValnTracker" />

        {/* ── Twitter Card meta tags ────────────────────────────────────── */}
        <meta name="twitter:card"        content="summary" />
        <meta name="twitter:title"       content="ValnTracker — Cybersecurity Intelligence Platform" />
        <meta name="twitter:description" content="Detect, Analyze, Protect, Recover." />

        {/* ── Google Fonts preconnect (performance optimisation) ───────── */}
        {/* Opens TCP connections to Google's font servers early */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ── Google Fonts stylesheet ───────────────────────────────────── */}
        {/* Loads all four font families used across the application */}
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

      </Head>
      <body>
        {/* Next.js renders each page's component tree here */}
        <Main />
        {/* Next.js injects its scripts (hydration, routing) here */}
        <NextScript />
      </body>
    </Html>
  );
}
