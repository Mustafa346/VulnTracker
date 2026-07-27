// pages/api/auth/register.js
// ─────────────────────────────────────────────────────────────────────────────
//  User Registration API Route
//  POST /api/auth/register
//
//  Handles creating a new user account. NextAuth does not include a built-in
//  registration endpoint — it only handles login and session management.
//  So we implement registration as a separate custom API route.
//
//  Request body (JSON):
//    { name: string, email: string, password: string }
//
//  Success response (201):
//    { success: true, message: string, user: { id, name, email } }
//
//  Error responses:
//    400 — Missing or invalid fields
//    409 — Email already registered
//    500 — Server/database error
//
//  Security:
//    - All validation runs SERVER-SIDE (client validation is UX only)
//    - Password is NOT hashed here — the User model's pre-save hook does it
//    - Duplicate email check uses case-insensitive lowercase comparison
//    - Password is stripped from the response via the User model's toJSON()
// ─────────────────────────────────────────────────────────────────────────────

import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error:   'Method not allowed. Use POST.',
    });
  }

  const { name, email, password } = req.body;

  // ── Server-side field validation ─────────────────────────────────────────
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error:   'Name, email, and password are all required.',
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error:   'Name must be at least 2 characters long.',
    });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error:   'Please enter a valid email address.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error:   'Password must be at least 6 characters long.',
    });
  }

  try {
    await connectDB();

    // ── Duplicate email check ─────────────────────────────────────────────
    // Always compare against lowercase to handle case differences
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error:   'An account with this email address already exists. Please log in.',
      });
    }

    // ── Create the new user ───────────────────────────────────────────────
    // The password is hashed automatically by the User model's pre-save hook
    // before it is written to the database — we pass the plain text here.
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: password,   // will be hashed by pre-save hook
    });

    // ── Return success ────────────────────────────────────────────────────
    // toJSON() strips the password hash from the response automatically
    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Please log in.',
      user: {
        id:    user._id.toString(),
        name:  user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('Register API error:', err);

    // Handle Mongoose duplicate key error (race condition edge case)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error:   'An account with this email address already exists.',
      });
    }

    return res.status(500).json({
      success: false,
      error:   'Server error. Please try again in a moment.',
    });
  }
}
