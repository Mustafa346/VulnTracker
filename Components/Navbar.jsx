// components/Navbar.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  Shared Navigation Bar
//  Rendered on every page via components/Layout.jsx
//
//  Features:
//    - Fixed position at top — stays visible while scrolling
//    - Scroll shrink effect — height transitions 68px → 56px on scroll
//    - Backdrop blur + background darkens on scroll
//    - Catalog dropdown menu with 3 links + descriptions
//    - Dropdown closes on outside click (useRef + document listener)
//    - Dropdown closes on route change (useEffect on pathname)
//    - Auth-aware rendering:
//        Not logged in → Login button + Get Started button
//        Logged in     → User avatar chip + Dashboard link + Sign Out button
//    - Active link highlighting using useRouter().pathname
//    - Responsive hamburger menu for mobile viewports
//    - Animated hamburger bars (rotate on open)
//    - Mobile menu closes on route change
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Catalog dropdown items
const CATALOG_LINKS = [
  {
    href:  '/catalog/threats',
    label: '📚 Threat Encyclopedia',
    desc:  'Browse 9 documented attack types',
  },
  {
    href:  '/catalog/checker',
    label: '🖥 Hack Checker',
    desc:  'Is your website compromised?',
  },
  {
    href:  '/catalog/scanner',
    label: '🔗 Link Scanner',
    desc:  'Scan any URL in real time',
  },
];

export default function Navbar() {
  const { data: session }   = useSession();
  const router              = useRouter();
  const dropdownRef         = useRef(null);

  const [dropOpen, setDropOpen]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);

  // ── Scroll detection — shrinks navbar height ────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Close dropdown when clicking outside ────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Close menus on route change ─────────────────────────────────────────
  useEffect(() => {
    setDropOpen(false);
    setMobileOpen(false);
  }, [router.pathname]);

  // ── Active link helper ──────────────────────────────────────────────────
  const isActive = (path) =>
    router.pathname === path || router.pathname.startsWith(path + '/');

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          MAIN NAVBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <nav style={{
        ...S.nav,
        height:     scrolled ? 56  : 68,
        background: scrolled
          ? 'rgba(4,14,26,0.98)'
          : 'rgba(4,14,26,0.85)',
        boxShadow:  scrolled
          ? '0 2px 30px rgba(0,0,0,0.5)'
          : 'none',
      }}>

        {/* ── Logo ───────────────────────────────────────────────────── */}
        <Link href="/" style={S.logo}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <span style={S.logoText}>
            Valn<span style={{ color: '#00d4ff' }}>Tracker</span>
          </span>
        </Link>

        {/* ── Desktop links ──────────────────────────────────────────── */}
        <div style={S.desktopLinks}>

          {/* Home */}
          <Link
            href="/"
            style={{
              ...S.navLink,
              color: router.pathname === '/' ? '#00d4ff' : '#3a6a80',
            }}
          >
            Home
          </Link>

          {/* Catalog dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropOpen(p => !p)}
              style={{
                ...S.dropTrigger,
                color: isActive('/catalog') ? '#00d4ff' : '#3a6a80',
              }}
            >
              Catalog
              <span style={{
                ...S.chevron,
                transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                ▾
              </span>
            </button>

            {/* Dropdown panel */}
            {dropOpen && (
              <div style={S.dropdown}>
                <div style={S.dropInner}>
                  {CATALOG_LINKS.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        ...S.dropItem,
                        background:  isActive(item.href)
                          ? 'rgba(0,212,255,0.08)'
                          : 'transparent',
                        borderLeft:  isActive(item.href)
                          ? '2px solid #00d4ff'
                          : '2px solid transparent',
                      }}
                    >
                      <span style={S.dropLabel}>{item.label}</span>
                      <span style={S.dropDesc}>{item.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Auth-aware links ──────────────────────────────────────── */}
          {session ? (
            <>
              {/* Dashboard link */}
              <Link
                href="/dashboard"
                style={{
                  ...S.navLink,
                  color: isActive('/dashboard') ? '#00d4ff' : '#3a6a80',
                }}
              >
                Dashboard
              </Link>

              {/* User avatar chip */}
              <div style={S.userChip}>
                <div style={S.userAvatar}>
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={S.userName}>
                  {session.user.name}
                </span>
              </div>

              {/* Sign Out */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={S.signOutBtn}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              {/* Login */}
              <Link href="/login" style={S.loginBtn}>Login</Link>

              {/* Get Started */}
              <Link href="/register" style={S.registerBtn}>
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger button ────────────────────────────────── */}
        <button
          onClick={() => setMobileOpen(p => !p)}
          style={S.hamburger}
          aria-label="Toggle menu"
        >
          <span style={{
            ...S.bar,
            transform: mobileOpen
              ? 'rotate(45deg) translate(5px,5px)'
              : 'none',
          }} />
          <span style={{
            ...S.bar,
            opacity: mobileOpen ? 0 : 1,
          }} />
          <span style={{
            ...S.bar,
            transform: mobileOpen
              ? 'rotate(-45deg) translate(5px,-5px)'
              : 'none',
          }} />
        </button>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE MENU
      ═══════════════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div style={S.mobileMenu}>

          <Link href="/"                 style={S.mobileLink}>Home</Link>
          <Link href="/catalog/threats"  style={S.mobileLink}>📚 Threat Encyclopedia</Link>
          <Link href="/catalog/checker"  style={S.mobileLink}>🖥 Hack Checker</Link>
          <Link href="/catalog/scanner"  style={S.mobileLink}>🔗 Link Scanner</Link>

          {session ? (
            <>
              <Link href="/dashboard" style={S.mobileLink}>
                📊 Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={S.mobileSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login"    style={S.mobileLink}>Login</Link>
              <Link href="/register" style={{ ...S.mobileLink, color: '#00d4ff', fontWeight: 700 }}>
                Get Started →
              </Link>
            </>
          )}
        </div>
      )}

      {/* Dropdown animation */}
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 769px) {
          .hamburger-btn { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-links { display: none !important; }
        }
      `}</style>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  // Main navbar bar
  nav: {
    position:       'fixed',
    top:            0,
    left:           0,
    right:          0,
    zIndex:         1000,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0 40px',
    backdropFilter: 'blur(20px)',
    borderBottom:   '1px solid rgba(0,212,255,0.08)',
    transition:     'height 0.3s, background 0.3s, box-shadow 0.3s',
    fontFamily:     "'Inter', sans-serif",
  },

  // Logo
  logo: {
    display:        'flex',
    alignItems:     'center',
    gap:            8,
    textDecoration: 'none',
  },
  logoText: {
    fontFamily:    "'JetBrains Mono', monospace",
    fontWeight:    700,
    fontSize:      19,
    color:         '#e8f4f8',
    letterSpacing: '-0.3px',
  },

  // Desktop nav links container
  desktopLinks: {
    display:    'flex',
    alignItems: 'center',
    gap:        28,
  },

  // Individual nav link
  navLink: {
    fontSize:       14,
    fontWeight:     500,
    textDecoration: 'none',
    transition:     'color 0.2s',
  },

  // Catalog dropdown trigger button
  dropTrigger: {
    background:  'none',
    border:      'none',
    cursor:      'pointer',
    fontSize:    14,
    fontWeight:  500,
    fontFamily:  "'Inter', sans-serif",
    display:     'flex',
    alignItems:  'center',
    gap:         4,
    padding:     0,
    transition:  'color 0.2s',
  },
  chevron: {
    fontSize:   11,
    display:    'inline-block',
    transition: 'transform 0.2s',
  },

  // Dropdown panel
  dropdown: {
    position:     'absolute',
    top:          'calc(100% + 14px)',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   'rgba(9,29,46,0.98)',
    border:       '1px solid rgba(0,212,255,0.15)',
    borderRadius: 14,
    overflow:     'hidden',
    minWidth:     260,
    boxShadow:    '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.05)',
    animation:    'fadeDown 0.18s ease-out',
    zIndex:       200,
  },
  dropInner: {
    padding: 8,
  },
  dropItem: {
    display:        'flex',
    flexDirection:  'column',
    padding:        '12px 14px',
    textDecoration: 'none',
    borderRadius:   8,
    transition:     'background 0.15s',
    marginBottom:   2,
  },
  dropLabel: {
    fontSize:   14,
    fontWeight: 600,
    color:      '#e8f4f8',
  },
  dropDesc: {
    fontSize:  12,
    color:     '#3a6a80',
    marginTop: 2,
  },

  // Auth — user chip (shown when logged in)
  userChip: {
    display:       'flex',
    alignItems:    'center',
    gap:           8,
    padding:       '5px 12px',
    background:    'rgba(255,255,255,0.04)',
    border:        '1px solid rgba(255,255,255,0.08)',
    borderRadius:  20,
  },
  userAvatar: {
    width:          22,
    height:         22,
    borderRadius:   '50%',
    background:     'linear-gradient(135deg,#00d4ff,#7b2fff)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       12,
    fontWeight:     700,
    color:          '#000',
    flexShrink:     0,
  },
  userName: {
    fontSize:   13,
    fontWeight: 500,
    color:      '#b8dce8',
  },

  // Auth — buttons (shown when logged out)
  loginBtn: {
    padding:        '7px 16px',
    border:         '1px solid rgba(255,255,255,0.12)',
    borderRadius:   8,
    color:          '#b8dce8',
    fontSize:       13,
    fontWeight:     600,
    textDecoration: 'none',
    transition:     'border-color 0.2s, color 0.2s',
  },
  registerBtn: {
    padding:        '7px 16px',
    background:     'linear-gradient(135deg,#00d4ff,#0099bb)',
    borderRadius:   8,
    color:          '#000000',
    fontSize:       13,
    fontWeight:     700,
    textDecoration: 'none',
  },
  signOutBtn: {
    padding:     '7px 14px',
    background:  'rgba(255,51,102,0.1)',
    border:      '1px solid rgba(255,51,102,0.25)',
    borderRadius: 8,
    color:       '#ff6688',
    fontSize:    13,
    fontWeight:  600,
    cursor:      'pointer',
    fontFamily:  "'Inter', sans-serif",
    transition:  'background 0.2s',
  },

  // Mobile hamburger button
  hamburger: {
    display:        'none',  // shown via media query in <style> tag
    flexDirection:  'column',
    gap:            5,
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    padding:        4,
  },
  bar: {
    width:        22,
    height:       2,
    background:   '#b8dce8',
    borderRadius: 1,
    display:      'block',
    transition:   'all 0.25s',
  },

  // Mobile dropdown menu
  mobileMenu: {
    position:       'fixed',
    top:            68,
    left:           0,
    right:          0,
    zIndex:         999,
    background:     'rgba(4,14,26,0.98)',
    borderBottom:   '1px solid rgba(0,212,255,0.08)',
    backdropFilter: 'blur(20px)',
    display:        'flex',
    flexDirection:  'column',
    padding:        '8px 0 20px',
    fontFamily:     "'Inter', sans-serif",
  },
  mobileLink: {
    padding:        '13px 28px',
    color:          '#b8dce8',
    textDecoration: 'none',
    fontSize:       15,
    fontWeight:     500,
    borderBottom:   '1px solid rgba(255,255,255,0.04)',
    transition:     'color 0.2s',
  },
  mobileSignOut: {
    margin:       '14px 24px 0',
    padding:      '11px',
    background:   'rgba(255,51,102,0.1)',
    border:       '1px solid rgba(255,51,102,0.25)',
    borderRadius: 10,
    color:        '#ff6688',
    fontSize:     14,
    fontWeight:   600,
    cursor:       'pointer',
    fontFamily:   "'Inter', sans-serif",
  },
};
