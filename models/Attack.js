// models/Attack.js
// ─────────────────────────────────────────────────────────────────────────────
//  Attack Mongoose Model
//  Defines the schema for cybersecurity threat encyclopedia entries stored
//  in MongoDB. All 9 attack documents are seeded via lib/seed.js.
//
//  Key features of this model:
//
//  1. COMPOUND TEXT INDEX — Full-Text Search
//     A weighted text index is created across title, description, category,
//     and tags. This allows the /api/attacks endpoint to perform efficient
//     full-text search using MongoDB's $text operator.
//
//     Weight breakdown:
//       title       × 10  → a match in the title ranks highest
//       tags        ×  5  → tag matches rank second
//       category    ×  3  → category matches rank third
//       description ×  1  → body text matches rank lowest
//
//     This means searching "injection" returns SQL Injection and XSS
//     at the top, with broader description matches below them.
//
//  2. CVSS SCORE — Industry-Standard Severity
//     Each attack stores a CVSS (Common Vulnerability Scoring System) score
//     from 0.0 to 10.0. The /api/attacks endpoint sorts by this field
//     descending, so Critical attacks (9.0+) always appear first.
//
//  Schema fields:
//    title            — attack name e.g. "SQL Injection"
//    category         — attack category e.g. "Injection Attack"
//    severity         — Critical | High | Medium | Low
//    cvssScore        — 0.0–10.0 industry severity rating
//    description      — plain-language explanation
//    howItWorks       — technical explanation of the attack mechanism
//    indicators       — warning signs that an attack occurred
//    prevention       — actionable checklist to defend against it
//    realWorldExample — famous breach or incident that illustrates the attack
//    affectedSystems  — platforms and infrastructure targeted
//    tags             — keywords for search and filtering (indexed)
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const AttackSchema = new mongoose.Schema(
  {
    // ── Core identification ─────────────────────────────────────────────────
    title: {
      type:     String,
      required: [true, 'Attack title is required'],
      trim:     true,
    },

    category: {
      type:     String,
      required: [true, 'Category is required'],
      trim:     true,
    },

    // ── Severity classification ─────────────────────────────────────────────
    severity: {
      type:     String,
      enum:     ['Critical', 'High', 'Medium', 'Low'],
      required: [true, 'Severity level is required'],
    },

    // ── CVSS Score (Common Vulnerability Scoring System) ───────────────────
    // Industry-standard 0.0–10.0 scale
    // Critical: 9.0–10.0 | High: 7.0–8.9 | Medium: 4.0–6.9 | Low: 0.1–3.9
    cvssScore: {
      type: Number,
      min:  0,
      max:  10,
    },

    // ── Content fields ──────────────────────────────────────────────────────
    description: {
      type:     String,
      required: [true, 'Description is required'],
    },

    howItWorks: {
      type: String, // Step-by-step technical explanation
    },

    // ── Array fields (rendered as lists in the UI) ──────────────────────────
    indicators: [{ type: String }],       // Warning signs of the attack
    prevention: [{ type: String }],       // Defensive checklist items
    affectedSystems: [{ type: String }],  // Targeted platforms and systems

    // ── Real-world example ──────────────────────────────────────────────────
    realWorldExample: {
      type: String, // Famous breach/incident illustrating this attack
    },

    // ── Search tags ─────────────────────────────────────────────────────────
    // Used in the full-text search index and clickable tag filters in the UI
    tags: [{ type: String }],
  },
  {
    // Automatically adds createdAt and updatedAt to every document
    timestamps: true,
  }
);

// ── Full-Text Search Index ────────────────────────────────────────────────────
// Enables MongoDB's $text operator for efficient full-text search.
// The weights determine how heavily each field contributes to the relevance
// score when multiple fields contain the search term.
AttackSchema.index(
  {
    title:       'text',
    description: 'text',
    category:    'text',
    tags:        'text',
  },
  {
    weights: {
      title:       10,  // Title matches are most relevant
      tags:         5,  // Tag matches are second most relevant
      category:     3,  // Category matches rank third
      description:  1,  // Body text matches rank lowest
    },
    name: 'attack_text_search_index',
  }
);

// Export — use existing model if already compiled (prevents OverwriteModelError
// during Next.js hot reloads in development)
export default mongoose.models.Attack || mongoose.model('Attack', AttackSchema);
