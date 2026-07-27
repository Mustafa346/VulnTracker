// pages/api/auth/[...nextauth].js
// ─────────────────────────────────────────────────────────────────────────────
//  NextAuth.js Configuration
//  This file is the heart of ValnTracker's authentication system.
//  The [...nextauth] catch-all route handles ALL auth-related requests:
//    GET  /api/auth/session    → returns current session
//    GET  /api/auth/csrf       → returns CSRF token
//    GET  /api/auth/providers  → returns configured providers
//    POST /api/auth/signin     → handles login
//    POST /api/auth/signout    → handles logout
//    GET  /api/auth/callback/* → handles OAuth callbacks (not used here)
//
//  Provider: Credentials
//  We use the Credentials provider (email + password) rather than OAuth
//  (Google, GitHub, etc.) so that all user data stays in our own MongoDB
//  database. This gives us full control over the auth flow and user model.
//
//  Session Strategy: JWT
//  Sessions are stored as encrypted JWT tokens in HTTP-only cookies rather
//  than in a database sessions collection. This reduces DB load and
//  eliminates the need for a separate sessions model.
//
//  JWT Token payload:
//    { id, name, email, role }
//  (password hash is NEVER included in the token)
//
//  The authOptions object is exported so it can be used in:
//    - lib/auth.js (getServerSession calls)
//    - Any API route that needs to read the current session
// ─────────────────────────────────────────────────────────────────────────────

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export const authOptions = {

  // ── Authentication Providers ────────────────────────────────────────────
  providers: [
    CredentialsProvider({
      name: 'Credentials',

      // Fields shown on the default NextAuth sign-in page (we use custom page)
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },

      // ── authorize() ──────────────────────────────────────────────────────
      // Called when the user submits the login form.
      // Must return a user object on success or throw an Error on failure.
      // The error message is forwarded to the login page as a URL query param.
      async authorize(credentials) {

        // Validate that both fields were submitted
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Connect to MongoDB and look up the user by email
        await connectDB();
        const user = await User.findOne({
          email: credentials.email.toLowerCase().trim(),
        });

        // No user found with this email
        if (!user) {
          throw new Error('No account found with this email address');
        }

        // Verify the submitted password against the stored bcrypt hash
        const isPasswordValid = await user.comparePassword(credentials.password);
        if (!isPasswordValid) {
          throw new Error('Incorrect password. Please try again.');
        }

        // Return the user object — NextAuth will encode this into the JWT
        // Only include non-sensitive fields
        return {
          id:    user._id.toString(),
          name:  user.name,
          email: user.email,
          role:  user.role,
        };
      },
    }),
  ],

  // ── Callbacks ───────────────────────────────────────────────────────────
  callbacks: {

    // jwt() — called when a JWT is created or updated
    // Adds the user's MongoDB ID and role to the token payload
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role;
      }
      return token;
    },

    // session() — called when the session is read (useSession, getServerSession)
    // Exposes the id and role from the JWT token on the session.user object
    // so components and API routes can access them without extra DB queries
    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  // ── Custom Pages ────────────────────────────────────────────────────────
  // Override NextAuth's default pages with our custom dark-themed pages
  pages: {
    signIn: '/login',   // Redirect here when login is required
    error:  '/login',   // Show errors on the login page (via ?error= query param)
  },

  // ── Session Configuration ────────────────────────────────────────────────
  session: {
    strategy: 'jwt',              // Use JWT (not database sessions)
    maxAge:   7 * 24 * 60 * 60,  // Session expires after 7 days (in seconds)
  },

  // ── Secret ──────────────────────────────────────────────────────────────
  // Used to sign and encrypt JWT tokens and CSRF tokens
  // Must be set in .env.local as NEXTAUTH_SECRET
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
