// lib/mongodb.js
// ─────────────────────────────────────────────────────────────────────────────
//  MongoDB Connection Utility
//  Implements a cached connection pattern specifically designed for Next.js
//  serverless environments (Vercel). Without caching, every API Route
//  invocation would open a NEW connection, quickly exhausting the MongoDB
//  Atlas free-tier connection pool limit of 500 connections.
//
//  How it works:
//    1. On first call → opens a new Mongoose connection and caches it
//       on the Node.js global object
//    2. On subsequent calls → returns the existing cached connection
//    3. During Next.js hot-reloads in dev → reuses the same connection
//       instead of leaking new ones
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/valntracker';

if (!MONGODB_URI) {
  throw new Error(
    '❌ MONGODB_URI is not defined. Please add it to your .env.local file.'
  );
}

// ── Initialise cache on Node.js global object ─────────────────────────────
// The global object persists across hot reloads in development, which is
// exactly what we need to avoid repeatedly opening connections.
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// ── Main connection function ───────────────────────────────────────────────
async function connectDB() {
  // If a connection already exists in cache, return it immediately
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection promise exists yet, create one
  if (!cached.promise) {
    const opts = {
      // Prevent Mongoose from buffering commands when not connected.
      // This surfaces connection errors immediately rather than silently queuing.
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('✅ MongoDB connected successfully');
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('❌ MongoDB connection failed:', err.message);
        throw err;
      });
  }

  // Await the pending connection promise and cache the result
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
