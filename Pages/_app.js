// pages/_app.js
// ─────────────────────────────────────────────────────────────────────────────
//  Next.js Application Entry Point
//  This file wraps EVERY page in ValnTracker with two things:
//
//  1. SessionProvider (from next-auth/react)
//     Makes the user's session available to all components via the
//     useSession() hook. Without this wrapper, useSession() would throw
//     an error on every page. The session prop is passed in from
//     Next.js's getServerSideProps/getStaticProps when using
//     next-auth's built-in session handling.
//
//  2. Layout component (components/Layout.jsx)
//     Wraps every page with the shared Navbar, Footer, animated
//     background orbs, and CSS grid overlay — creating a consistent
//     dark cybersecurity aesthetic across all pages.
//
//  Layout opt-out:
//     Pages that need their own full-page design (login, register) can
//     skip the shared Layout by setting:
//       LoginPage.noLayout = true;
//     at the bottom of their file. _app.js checks for this flag and
//     renders only the SessionProvider wrapper for those pages.
//
//  Global CSS:
//     styles/globals.css is imported here — this is the ONLY place it
//     should be imported in a Next.js app (importing it anywhere else
//     will cause an error).
// ─────────────────────────────────────────────────────────────────────────────

import { SessionProvider } from 'next-auth/react';
import Layout from '../components/Layout';
import '../styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }) {

  // ── Layout opt-out ────────────────────────────────────────────────────────
  // Pages with Component.noLayout = true render WITHOUT the shared
  // Navbar/Footer/background. Used by login.js and register.js which
  // have their own full-page dark designs.
  if (Component.noLayout) {
    return (
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    );
  }

  // ── Default — wrap with shared Layout ────────────────────────────────────
  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}
