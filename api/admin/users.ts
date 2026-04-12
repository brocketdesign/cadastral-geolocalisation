import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

/**
 * GET /api/admin/users?adminUserId=xxx
 * Returns all user_plans documents. Admin only.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { adminUserId } = req.query;

  if (!adminUserId || typeof adminUserId !== 'string') {
    return res.status(400).json({ error: 'adminUserId requis.' });
  }

  try {
    const { db } = await connectToDatabase();

    const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
    if (!requester?.isAdmin) {
      return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }

    const users = await db
      .collection('user_plans')
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}
