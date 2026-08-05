// pages/login.js
// ─────────────────────────────────────────────────────────────────────────────
//  Login Page
//  Route: /login
//
//  Allows existing users to sign in with their email and password.
//  Uses NextAuth's signIn() function with the 'credentials' provider.
//
//  Features:
//    - Email and password form with focus glow effects
//    - Error messages forwarded from NextAuth's authorize() function
//    - Loading spinner with "Authenticating..." state during sign-in
//    - Auto-redirect to /dashboard on successful login
//    - Auto-redirect to /dashboard if already logged in
//    - Terminal bar decoration matching the dark cybersecurity theme
//    - Animated background orbs and grid overlay
//    - Link to /register for new users
//
//  Auth flow:
//    1. User submits form
//    2. signIn('credentials', { redirect: false, email, password }) is called
//    3. NextAuth calls authorize() in pages/api/auth/[...nextauth].js
//    4. On success → router.push('/dashboard')
//    5. On failure → result.error is displayed in the error box
//
//  Layout: noLayout = true — renders WITHOUT shared Navbar/Footer
//  (has its own full-page dark design)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function LoginPage() {
  const router            = useRouter();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email:    formData.email.trim(),
      password: formData.password,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push('/dashboard');
    }
  };

  // Show spinner while session status is loading
  if (status === 'loading') {
    return (
      <div style={S.loadingScreen}>
        <div style={S.spinner} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Don't render form if already authenticated (redirect in progress)
  if (status === 'authenticated') return null;

  return (
    <>
      <Head>
        <title>Login — ValnTracker</title>
        <meta name="description" content="Sign in to your ValnTracker account" />
      </Head>

      <div style={S.page}>
        {/* Animated background orbs */}
        <div style={{ ...S.orb, ...S.orb1 }} />
        <div style={{ ...S.orb, ...S.orb2 }} />

        {/* Grid overlay */}
        <div style={S.grid} />

        {/* Back to home link */}
        <div style={S.backBar}>
          <Link href="/" style={S.backLink}>← Back to ValnTracker</Link>
        </div>

        <div style={S.container}>

          {/* Logo */}
          <div style={S.logo}>
            <span style={{ fontSize: 28 }}>🛡️</span>
            <span style={S.logoText}>
              Valn<span style={{ color: '#00d4ff' }}>Tracker</span>
            </span>
          </div>

          {/* Card */}
          <div style={S.card}>

            {/* Card header */}
            <div style={S.cardHeader}>
              <h1 style={S.title}>Welcome Back</h1>
              <p style={S.subtitle}>Sign in to your security dashboard</p>
            </div>

            {/* Terminal bar decoration */}
            <div style={S.termBar}>
              <span style={S.dot1} /><span style={S.dot2} /><span style={S.dot3} />
              <span style={S.termCmd}>$ auth --login</span>
            </div>

            {/* Error box */}
            {error && (
              <div style={S.errorBox}>
                <span style={{ fontSize: 16 }}>⚠</span>
                {error}
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} style={S.form}>

              {/* Email field */}
              <div style={S.fieldGroup}>
                <label style={S.label} htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={S.fieldIcon}>✉</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    style={S.input}
                    disabled={loading}
                    onFocus={e  => (e.target.style.borderColor = '#00d4ff')}
                    onBlur={e   => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={S.fieldGroup}>
                <label style={S.label} htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={S.fieldIcon}>🔒</span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    style={S.input}
                    disabled={loading}
                    onFocus={e  => (e.target.style.borderColor = '#00d4ff')}
                    onBlur={e   => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...S.submitBtn,
                  opacity: loading ? 0.7 : 1,
                  cursor:  loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <span style={S.btnInner}>
                    <span style={S.btnSpinner} /> Authenticating...
                  </span>
                ) : (
                  '→ Sign In'
                )}
              </button>
            </form>

            {/* Footer link */}
            <div style={S.cardFooter}>
              <p style={S.footerText}>
                No account yet?{' '}
                <Link href="/register" style={S.footerLink}>
                  Create one free
                </Link>
              </p>
            </div>
          </div>

          {/* Security note */}
          <p style={S.secNote}>🔐 Your session is encrypted end-to-end</p>
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes float1  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.05)} }
        @keyframes float2  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(0.97)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: #444455; }
      `}</style>
    </>
  );
}

// ── Opt out of shared Layout (has its own full-page design) ──────────────────
LoginPage.noLayout = true;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:         { minHeight:'100vh', background:'#040e1a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', fontFamily:"'Inter',sans-serif", padding:'24px 16px' },
  orb:          { position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' },
  orb1:         { width:400, height:400, background:'rgba(0,212,255,0.07)', top:'-10%', left:'-10%', animation:'float1 12s ease-in-out infinite' },
  orb2:         { width:350, height:350, background:'rgba(123,47,255,0.07)', bottom:'-10%', right:'-10%', animation:'float2 15s ease-in-out infinite' },
  grid:         { position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,212,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.03) 1px,transparent 1px)', backgroundSize:'50px 50px', pointerEvents:'none' },
  backBar:      { position:'absolute', top:24, left:32 },
  backLink:     { color:'#888899', textDecoration:'none', fontSize:14, fontFamily:"'Inter',sans-serif" },
  container:    { position:'relative', zIndex:10, width:'100%', maxWidth:440, animation:'fadeUp 0.5s ease-out' },
  logo:         { display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginBottom:32 },
  logoText:     { fontSize:24, fontWeight:700, color:'#ffffff', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'-0.5px' },
  card:         { background:'rgba(9,29,46,0.97)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'36px 40px', boxShadow:'0 24px 64px rgba(0,0,0,0.5),0 0 0 1px rgba(0,212,255,0.05)', backdropFilter:'blur(20px)' },
  cardHeader:   { textAlign:'center', marginBottom:24 },
  title:        { fontSize:26, fontWeight:700, color:'#ffffff', margin:'0 0 8px', letterSpacing:'-0.5px', fontFamily:"'Inter',sans-serif" },
  subtitle:     { fontSize:14, color:'#888899', margin:0 },
  termBar:      { display:'flex', alignItems:'center', gap:8, background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'8px 14px', marginBottom:24, border:'1px solid rgba(255,255,255,0.06)' },
  dot1:         { width:10, height:10, borderRadius:'50%', background:'#ff5f57', display:'inline-block' },
  dot2:         { width:10, height:10, borderRadius:'50%', background:'#febc2e', display:'inline-block' },
  dot3:         { width:10, height:10, borderRadius:'50%', background:'#28c840', display:'inline-block' },
  termCmd:      { fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#00d4ff', marginLeft:4 },
  errorBox:     { display:'flex', alignItems:'center', gap:10, background:'rgba(255,51,102,0.1)', border:'1px solid rgba(255,51,102,0.3)', borderRadius:8, padding:'12px 16px', color:'#ff6688', fontSize:14, marginBottom:20, fontFamily:"'Inter',sans-serif" },
  form:         { display:'flex', flexDirection:'column', gap:20 },
  fieldGroup:   { display:'flex', flexDirection:'column', gap:8 },
  label:        { fontSize:13, fontWeight:600, color:'#aaaacc', letterSpacing:'0.02em', fontFamily:"'Inter',sans-serif" },
  fieldIcon:    { position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none', opacity:0.5 },
  input:        { width:'100%', padding:'13px 14px 13px 42px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#ffffff', fontSize:15, outline:'none', transition:'border-color 0.2s', boxSizing:'border-box', fontFamily:"'Inter',sans-serif" },
  submitBtn:    { width:'100%', padding:'14px', background:'linear-gradient(135deg,#00d4ff,#0099bb)', color:'#000000', fontWeight:700, fontSize:15, border:'none', borderRadius:10, transition:'opacity 0.2s', letterSpacing:'0.02em', marginTop:4, fontFamily:"'Inter',sans-serif" },
  btnInner:     { display:'flex', alignItems:'center', justifyContent:'center', gap:10 },
  btnSpinner:   { width:16, height:16, border:'2px solid rgba(0,0,0,0.3)', borderTop:'2px solid #000', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' },
  cardFooter:   { textAlign:'center', marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.06)' },
  footerText:   { fontSize:14, color:'#888899', margin:0, fontFamily:"'Inter',sans-serif" },
  footerLink:   { color:'#00d4ff', textDecoration:'none', fontWeight:600 },
  secNote:      { textAlign:'center', fontSize:12, color:'#444455', marginTop:20, fontFamily:"'Inter',sans-serif" },
  loadingScreen:{ minHeight:'100vh', background:'#040e1a', display:'flex', alignItems:'center', justifyContent:'center' },
  spinner:      { width:40, height:40, border:'3px solid rgba(0,212,255,0.2)', borderTop:'3px solid #00d4ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
};
