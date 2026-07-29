// pages/api/dashboard.js
// ─────────────────────────────────────────────────────────────────────────────
//  Dashboard API Route
//  GET    /api/dashboard              → fetch user's scan history + stats
//  GET    /api/dashboard?type=url     → filter by scan type
//  GET    /api/dashboard?verdict=Safe → filter by verdict
//  DELETE /api/dashboard?id=xxx       → delete a specific scan record
//
//  This is a fully PROTECTED route — requireAuth() is called at the top
//  of the handler and returns 401 Unauthorized if no valid session exists.
//  Users can only access and delete their OWN scan records.
//
//  GET handler:
//    Returns two things in a single response:
//    1. Paginated scan records (sorted newest first, up to 50 per page)
//    2. Summary statistics computed by a MongoDB aggregation pipeline:
//         totalScans, avgThreatScore, dangerousCount, safeCount, suspiciousCount
//    Both operations run in parallel with Promise.all() for efficiency.
//
//  DELETE handler:
//    Uses findOneAndDelete() with BOTH the scan _id AND the userId.
//    This ownership check is critical — without it, any authenticated user
//    could delete any other user's scan records by guessing the ID.
//    Returns 404 if the scan is not found OR belongs to a different user.
//
//  Auth: REQUIRED — returns 401 if not logged in.
//  Methods: GET, DELETE only.
// ─────────────────────────────────────────────────────────────────────────────

import connectDB from '../../lib/mongodb';
import ScanResult from '../../models/ScanResult';
import { requireAuth } from '../../lib/auth';
import mongoose from 'mongoose';

export default async function handler(req, res) {

  // ── Authentication gate — applies to ALL methods on this route ──────────
  const session = await requireAuth(req, res);
  if (!session) return; // 401 already sent by requireAuth

  await connectDB();
  const userId = session.user.id;

  // ═══════════════════════════════════════════════════════════════════════
  //  GET — Fetch scan history + aggregated stats
  // ═══════════════════════════════════════════════════════════════════════
  if (req.method === 'GET') {
    try {
      const {
        type,
        verdict,
        limit = 50,
        page  = 1,
      } = req.query;

      // ── Build filter query ──────────────────────────────────────────────
      const filter = { userId };

      // Optional scan type filter
      if (type && ['url', 'website'].includes(type)) {
        filter.scanType = type;
      }

      // Optional verdict filter
      const validVerdicts = ['Safe', 'Suspicious', 'Dangerous', 'Compromised', 'Clean'];
      if (verdict && validVerdicts.includes(verdict)) {
        filter.verdict = verdict;
      }

      // ── Pagination ──────────────────────────────────────────────────────
      const pageNum  = Math.max(1, parseInt(page)  || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      const skip     = (pageNum - 1) * limitNum;

      // ── Run query + aggregation in parallel ─────────────────────────────
      const [scans, total, statsResult] = await Promise.all([

        // 1. Paginated scan records (most recent first)
        ScanResult
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .select('-__v'),

        // 2. Total count for pagination metadata
        ScanResult.countDocuments(filter),

        // 3. Aggregation pipeline for dashboard stat cards
        // Runs over ALL of the user's scans (not filtered) for accurate totals
        ScanResult.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
            },
          },
          {
            $group: {
              _id: null,
              totalScans: { $sum: 1 },
              avgThreatScore: { $avg: '$threatScore' },

              // Count scans where verdict is Dangerous OR Compromised
              dangerousCount: {
                $sum: {
                  $cond: [
                    { $in: ['$verdict', ['Dangerous', 'Compromised']] },
                    1,
                    0,
                  ],
                },
              },

              // Count scans where verdict is Safe OR Clean
              safeCount: {
                $sum: {
                  $cond: [
                    { $in: ['$verdict', ['Safe', 'Clean']] },
                    1,
                    0,
                  ],
                },
              },

              // Count scans where verdict is Suspicious
              suspiciousCount: {
                $sum: {
                  $cond: [{ $eq: ['$verdict', 'Suspicious'] }, 1, 0],
                },
              },
            },
          },
        ]),
      ]);

      // Use aggregation result or default zeros if no scans exist yet
      const stats = statsResult[0] || {
        totalScans:      0,
        avgThreatScore:  0,
        dangerousCount:  0,
        safeCount:       0,
        suspiciousCount: 0,
      };

      return res.status(200).json({
        success: true,
        data:    scans,
        pagination: {
          total,
          page:  pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
        stats,
      });

    } catch (err) {
      console.error('Dashboard GET error:', err);
      return res.status(500).json({
        success: false,
        error:   'Failed to fetch scan history. Please try again.',
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  DELETE — Remove a single scan record
  // ═══════════════════════════════════════════════════════════════════════
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error:   'Scan ID is required.',
      });
    }

    // Validate that the id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error:   'Invalid scan ID format.',
      });
    }

    try {
      // ── Ownership-verified delete ─────────────────────────────────────
      // The query includes BOTH the scan _id AND the userId.
      // If the scan belongs to a different user, findOneAndDelete()
      // will find no matching document and return null — preventing
      // unauthorised deletion without revealing that the record exists.
      const deleted = await ScanResult.findOneAndDelete({
        _id:    id,
        userId: userId,
      });

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error:   'Scan record not found or you do not have permission to delete it.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Scan record deleted successfully.',
      });

    } catch (err) {
      console.error('Dashboard DELETE error:', err);
      return res.status(500).json({
        success: false,
        error:   'Failed to delete scan record. Please try again.',
      });
    }
  }

  // ── Any other HTTP method ───────────────────────────────────────────────
  return res.status(405).json({
    success: false,
    error:   'Method not allowed. Use GET or DELETE.',
  });
}
