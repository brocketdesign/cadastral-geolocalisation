/**
 * GET /api/admin/email-logs?adminUserId=xxx&limit=50&type=welcome
 *
 * Returns email send logs from MongoDB. Admin only.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { adminUserId, limit = '50', type } = req.query as {
    adminUserId?: string;
    limit?: string;
    type?: string;
  };

  if (!adminUserId) {
    return res.status(400).json({ error: 'adminUserId requis.' });
  }

  try {
    const { db } = await connectToDatabase();
    const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
    if (!requester?.isAdmin) {
      return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }

    const filter: Record<string, unknown> = {};
    if (type && type !== 'all') filter.type = type;

    const logs = await db
      .collection('email_logs')
      .find(filter)
      .sort({ sentAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 200))
      .toArray();

    // Stats summary
    const stats = await db
      .collection('email_logs')
      .aggregate([
        {
          $group: {
            _id: { type: '$type', status: '$status' },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    return res.status(200).json({ logs, stats });
  } catch (error) {
    console.error('Email logs error:', error);
    return res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}
