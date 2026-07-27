// pages/api/attacks.js
// ─────────────────────────────────────────────────────────────────────────────
//  Threat Encyclopedia API Route
//  GET /api/attacks
//  GET /api/attacks?search=sql
//  GET /api/attacks?severity=Critical
//  GET /api/attacks?search=injection&severity=High
//
//  Serves all cybersecurity attack entries from MongoDB to the
//  Threat Encyclopedia page (pages/catalog/threats.js).
//
//  This endpoint replaced the hardcoded JavaScript array used in
//  Assignments 1–3. The data now lives in MongoDB Atlas, seeded via
//  lib/seed.js, and is fetched fresh on every page load.
//
//  Query parameters:
//    search   — performs MongoDB full-text search using the $text operator
//               across title, description, category, and tags fields.
//               Matches are weighted (title ×10, tags ×5, category ×3,
//               description ×1) — see the text index in models/Attack.js
//
//    severity — filters by exact severity level: Critical | High | Medium | Low
//               Validated against the allowed enum before use in the query
//               to prevent injection or unexpected values.
//
//  Response (200):
//    { success: true, count: number, data: Attack[] }
//
//  Sorting:
//    Results are sorted by cvssScore descending (highest severity first)
//    so Critical attacks (9.0+) always appear at the top of the encyclopedia.
//
//  Auth: Public — no authentication required.
//  Method: GET only.
// ─────────────────────────────────────────────────────────────────────────────

import connectDB from '../../lib/mongodb';
import Attack from '../../models/Attack';

export default async function handler(req, res) {

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error:   'Method not allowed. Use GET.',
    });
  }

  try {
    await connectDB();

    const { search, severity } = req.query;

    // ── Build MongoDB query object ─────────────────────────────────────────
    const query = {};

    // ── Full-text search ───────────────────────────────────────────────────
    // Uses the compound text index defined in models/Attack.js
    // The $text operator is efficient and uses the pre-built index
    if (search && search.trim().length > 0) {
      query.$text = { $search: search.trim() };
    }

    // ── Severity filter ────────────────────────────────────────────────────
    // Validate against allowed values before adding to query
    if (severity && severity !== 'All') {
      const validSeverities = ['Critical', 'High', 'Medium', 'Low'];
      if (validSeverities.includes(severity)) {
        query.severity = severity;
      }
    }

    // ── Execute query ──────────────────────────────────────────────────────
    const attacks = await Attack
      .find(query)
      .select('-__v')             // exclude internal Mongoose version field
      .sort({ cvssScore: -1 });   // highest CVSS score first (most critical)

    // ── Return results ─────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      count:   attacks.length,
      data:    attacks,
    });

  } catch (err) {
    console.error('Attacks API error:', err);

    // Handle the case where the text index doesn't exist yet
    // (e.g. database not seeded, or index still building)
    if (err.code === 27 || err.message?.includes('text index')) {
      return res.status(500).json({
        success: false,
        error:   'Database not seeded. Please run: npm run seed',
      });
    }

    return res.status(500).json({
      success: false,
      error:   'Failed to fetch attack data. Please try again.',
    });
  }
}
