/** @type {import('tailwindcss').Config} */

module.exports = {
  // ── Tell Tailwind which files to scan for class names ──────────
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {

      // ── Custom Fonts ──────────────────────────────────────────
      // These match the Google Fonts loaded in _document.js
      fontFamily: {
        orbitron:  ['Orbitron',       'sans-serif'],   // futuristic headings (index.js)
        jetbrains: ['JetBrains Mono', 'monospace'],    // terminal / code text
        syne:      ['Syne',           'sans-serif'],   // labels and badges
        inter:     ['Inter',          'sans-serif'],   // body text (default)
        mono:      ['JetBrains Mono', 'Courier New', 'monospace'],
      },

      // ── Brand Colour Palette ──────────────────────────────────
      colors: {
        // Primary accent — cyan glow
        primary:        '#00d4ff',
        'primary-dark': '#0099bb',

        // Secondary — purple
        secondary:      '#7b2fff',

        // Status colours
        danger:         '#ff3366',
        warning:        '#ffaa00',
        success:        '#00ff88',

        // Neon variants used in index.js
        'neon-green':   '#00ff9d',
        'neon-red':     '#ff4560',
        'neon-amber':   '#f5a623',

        // Background shades
        bg:             '#040e1a',
        'bg-card':      '#091d2e',
        'bg-card2':     '#0c2438',

        // Border helper
        'border-glow':  'rgba(0,212,255,0.25)',
      },

      // ── Custom Animations ─────────────────────────────────────
      animation: {
        // Blinking cursor / status dot
        blink:        'blink 1.2s step-end infinite',
        cursor:       'cursor 1s step-end infinite',

        // Slow pulse for orbs / status indicators
        'pulse-slow': 'pulse 3s ease-in-out infinite',

        // Glowing box-shadow cycle
        glow:         'glow 2s ease-in-out infinite alternate',

        // Background orb floating
        float1:       'float1 14s ease-in-out infinite',
        float2:       'float2 18s ease-in-out infinite',
      },

      // ── Keyframes ─────────────────────────────────────────────
      keyframes: {
        blink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
        cursor: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(0,212,255,0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(0,212,255,0.8), 0 0 50px rgba(0,212,255,0.4)' },
        },
        float1: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(40px,-50px) scale(1.06)' },
        },
        float2: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(-30px,40px) scale(0.96)' },
        },
      },

      // ── Box Shadows ───────────────────────────────────────────
      boxShadow: {
        'glow-cyan':   '0 0 20px rgba(0,212,255,0.4)',
        'glow-purple': '0 0 20px rgba(123,47,255,0.4)',
        'glow-red':    '0 0 20px rgba(255,51,102,0.4)',
        'glow-green':  '0 0 20px rgba(0,255,136,0.4)',
        'card':        '0 4px 24px rgba(0,0,0,0.5)',
      },

    },
  },

  plugins: [],
};
