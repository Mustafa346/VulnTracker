// models/ScanResult.js
// ─────────────────────────────────────────────────────────────────────────────
//  ScanResult Mongoose Model
//  Stores every security scan performed by a logged-in user.
//  Created automatically by /api/scan-url and /api/check-website
//  when a valid session exists.
//
//  Key design decisions:
//
//  1. userId INDEX
//     The userId field is indexed at the database level. This makes the
//     dashboard query (filter by userId, sort by date, paginate) extremely
//     fast even with thousands of scan records in the collection.
//
//  2. Mixed TYPE for details
//     The details field uses mongoose.Schema.Types.Mixed because each
//     security engine returns a structurally different response:
//       - VirusTotal returns { malicious, suspicious, harmless, undetected }
//       - Google Safe Browsing returns { isSafe, threats: [] }
//       - Shodan returns { openPorts, vulnerabilities, country, org }
//       - Hack Checker returns symptom data
//     Using Mixed avoids creating separate sub-schemas for each engine
//     while still storing all data in a single document.
//
//  3. verdict ENUM
//     The verdict field is a strict enum, making dashboard filter queries
//     simple, reliable, and index-friendly. The five possible values are:
//       Safe        — URL scan: no threats detected
//       Suspicious  — URL or website scan: possible threats
//       Dangerous   — URL scan: confirmed threats from multiple engines
//       Compromised — Hack checker: strong signs of compromise
//       Clean       — Hack checker: no compromise indicators
//
//  4. threatScore RANGE (0–100)
//     Stored as an integer for easy filtering, sorting, and average
//     computation in MongoDB aggregation pipelines (used in /api/dashboard).
//
//  Schema fields:
//    userId          — ObjectId reference to the User who ran the scan
//    scanType        — 'url' (Link Scanner) or 'website' (Hack Checker)
//    target          — the URL or domain that was scanned
//    threatScore     — unified 0–100 risk score aggregated from all engines
//    verdict         — final verdict label (see enum above)
//    details         — flexible Mixed object with per-engine results
//    recommendations — array of actionable advice strings shown in the UI
//    createdAt       — scan timestamp (used for dashboard sort and history)
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const ScanResultSchema = new mongoose.Schema(
  {
    // ── Reference to the user who ran this scan ─────────────────────────────
    // Indexed for fast dashboard lookups — all queries filter by this field.
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,          // Database-level index for fast filtering
    },

    // ── Scan type discriminator ─────────────────────────────────────────────
    // 'url'     → ran through the URL Scanner (catalog/scanner.js)
    // 'website' → ran through the Hack Checker (catalog/checker.js)
    scanType: {
      type:     String,
      enum:     ['url', 'website'],
      required: true,
    },

    // ── The URL or domain that was scanned ──────────────────────────────────
    target: {
      type:     String,
      required: true,
      trim:     true,
    },

    // ── Unified threat/risk score (0 = perfectly safe, 100 = critical) ──────
    threatScore: {
      type:     Number,
      min:      0,
      max:      100,
      required: true,
    },

    // ── Final verdict label ─────────────────────────────────────────────────
    verdict: {
      type:     String,
      enum:     ['Safe', 'Suspicious', 'Dangerous', 'Compromised', 'Clean'],
      required: true,
    },

    // ── Per-engine result details (Mixed type for flexible structure) ────────
    // Each sub-field corresponds to one security engine.
    // Not all sub-fields will be present on every scan — for example,
    // a URL scan will have virusTotal data but no symptoms data.
    details: {
      // VirusTotal — filled for URL scans
      virusTotal: {
        malicious:  Number,   // engines that flagged as malicious
        suspicious: Number,   // engines that flagged as suspicious
        harmless:   Number,   // engines that confirmed safe
        undetected: Number,   // engines that had no verdict
      },

      // Google Safe Browsing — filled for both scan types
      googleSafeBrowsing: {
        isSafe:  Boolean,
        threats: [String],    // e.g. ['MALWARE', 'SOCIAL_ENGINEERING']
      },

      // URLScan.io — filled for URL scans
      urlScan: {
        screenshot: String,   // URL of the screenshot captured during scan
        verdict:    String,   // 'Clean' or 'Malicious'
        tags:       [String], // behaviour tags from URLScan
      },

      // Shodan — filled for website/hack-checker scans
      shodan: {
        openPorts:       [Number],  // e.g. [80, 443, 3306]
        vulnerabilities: [String],  // CVE IDs e.g. ['CVE-2021-44228']
        country:         String,
        org:             String,
      },

      // Symptom data — filled for hack-checker scans
      symptoms: {
        count: Number,          // total number of symptoms reported
        list:  [String],        // symptom key strings e.g. ['ransom_note', 'popups']
      },
    },

    // ── Actionable recommendations returned to the user ─────────────────────
    // Stored with the scan so they can be displayed again in the dashboard
    // without recalculating them.
    recommendations: [{ type: String }],
  },
  {
    // createdAt is used to sort scan history (most recent first)
    // updatedAt is included for completeness
    timestamps: true,
  }
);

// Export — use existing model if already compiled (prevents OverwriteModelError
// during Next.js hot reloads in development)
export default mongoose.models.ScanResult ||
  mongoose.model('ScanResult', ScanResultSchema);
