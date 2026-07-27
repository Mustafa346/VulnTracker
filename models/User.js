// models/User.js
// ─────────────────────────────────────────────────────────────────────────────
//  User Mongoose Model
//  Defines the schema for registered user accounts stored in MongoDB.
//
//  Key security features built into this model:
//
//  1. PRE-SAVE HOOK — Password Hashing
//     Before any User document is saved, the pre-save hook checks if the
//     password field was modified. If yes, it hashes it with bcryptjs using
//     12 salt rounds. This means the plain-text password NEVER reaches the
//     database under any circumstances.
//
//  2. INSTANCE METHOD — comparePassword()
//     Used during login to verify a submitted password against the stored hash
//     without ever exposing the hash itself. Called inside NextAuth's
//     authorize() function.
//
//  3. TOJSON OVERRIDE — Password Stripping
//     Overrides the default toJSON() serialization to delete the password
//     field before the document is sent anywhere. Even if a developer
//     accidentally returns a full User object in an API response, the
//     password hash will never be included.
//
//  Schema fields:
//    name      — display name shown in the navbar and dashboard
//    email     — unique login identifier, stored lowercase
//    password  — bcrypt hash (never the plain-text password)
//    role      — 'user' (default) or 'admin'
//    timestamps — createdAt and updatedAt added automatically by Mongoose
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    // ── Display name ────────────────────────────────────────────────────────
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    // ── Email address (unique login identifier) ─────────────────────────────
    email: {
      type:     String,
      required: [true, 'Email address is required'],
      unique:   true,         // enforced at MongoDB index level
      lowercase: true,        // always stored as lowercase
      trim:     true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Please enter a valid email address',
      ],
    },

    // ── Password (stored as bcrypt hash — see pre-save hook below) ──────────
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },

    // ── Role (for future admin functionality) ───────────────────────────────
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields to every document
    timestamps: true,
  }
);

// ── Pre-save Hook: Hash password before writing to database ──────────────────
// This runs automatically whenever User.save() is called.
// The isModified() check prevents re-hashing an already-hashed password
// on subsequent saves (e.g. updating name or email only).
UserSchema.pre('save', async function (next) {
  // Skip hashing if the password field has not changed
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt with 12 rounds (deliberate slowness to resist brute force)
    const salt = await bcrypt.genSalt(12);

    // Hash the plain-text password with the salt
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance Method: Compare submitted password with stored hash ─────────────
// Used in NextAuth's authorize() function during login.
// Returns true if passwords match, false otherwise.
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ── toJSON Override: Strip password from all serialised responses ─────────────
// Ensures the bcrypt hash is never accidentally sent in any API response,
// even if a developer forgets to manually exclude it with .select('-password').
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Export — use existing model if already compiled (prevents OverwriteModelError
// during Next.js hot reloads in development)
export default mongoose.models.User || mongoose.model('User', UserSchema);
