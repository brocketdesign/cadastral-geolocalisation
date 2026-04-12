import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

/**
 * GET /api/users/me?userId=xxx
 * Returns the current user's plan and isAdmin flag from MongoDB.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId requis.' });
  }

  try {
    const { db } = await connectToDatabase();
    const record = await db.collection('user_plans').findOne({ clerkUserId: userId });

    return res.status(200).json({
      plan: record?.plan ?? 'free',
      isAdmin: record?.isAdmin === true,
    });
  } catch (error) {
    console.error('Users/me error:', error);
    return res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}
