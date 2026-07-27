// lib/auth.js
// ─────────────────────────────────────────────────────────────────────────────
//  Authentication Helper Utilities
//  Provides two reusable functions used across all API routes:
//
//  getSession(req, res)
//    → Retrieves the current user session from the JWT cookie.
//    → Returns null if no session exists (user not logged in).
//    → Used in routes where auth is OPTIONAL (scan routes save to DB only
//      if a session exists, but still work for unauthenticated users).
//
//  requireAuth(req, res)
//    → Calls getSession and returns 401 Unauthorized if no session found.
//    → Returns the session object if the user is authenticated.
//    → Used in routes where auth is REQUIRED (dashboard, delete scan).
//
//  Usage example in an API route:
//
//    import { requireAuth } from '../../lib/auth';
//
//    export default async function handler(req, res) {
//      const session = await requireAuth(req, res);
//      if (!session) return; // 401 already sent by requireAuth
//      // ... rest of handler
//    }
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../pages/api/auth/[...nextauth]';

// ── getSession ────────────────────────────────────────────────────────────────
// Retrieves the session without enforcing authentication.
// Returns the session object or null if not logged in.
export async function getSession(req, res) {
  return await getServerSession(req, res, authOptions);
}

// ── requireAuth ───────────────────────────────────────────────────────────────
// Retrieves the session and sends a 401 response if no session exists.
// Returns the session object if authenticated, or null after sending 401.
export async function requireAuth(req, res) {
  const session = await getSession(req, res);

  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized. Please log in to access this resource.',
    });
    return null;
  }

  return session;
}
