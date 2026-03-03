import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

const ADMIN_EMAILS = ['nahomaho191@gmail.com'];

/**
 * POST /api/admin/update-plan
 * Body: { email: string, userId: string, plan: 'free' | 'pro' | 'enterprise' }
 *
 * Updates the user plan in both MongoDB and Clerk publicMetadata.
 * Only accessible by admin users (verified by email in the request).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, userId, plan } = req.body;

    // Validate admin
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }

    // Validate plan
    if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Plan invalide. Doit être free, pro ou enterprise.' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId requis.' });
    }

    // 1) Update MongoDB
    const { db } = await connectToDatabase();
    await db.collection('settings').updateOne(
      { key: 'user_plan' },
      { $set: { key: 'user_plan', value: plan } },
      { upsert: true }
    );

    // Also store per-user plan
    await db.collection('user_plans').updateOne(
      { clerkUserId: userId },
      { $set: { clerkUserId: userId, email, plan, updatedAt: new Date() } },
      { upsert: true }
    );

    // 2) Update Clerk publicMetadata via REST API
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (clerkSecretKey) {
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: { plan },
        }),
      });

      if (!clerkRes.ok) {
        const errBody = await clerkRes.text();
        console.error('Clerk API error:', clerkRes.status, errBody);
        return res.status(500).json({
          error: 'Erreur lors de la mise à jour Clerk.',
          details: errBody,
        });
      }
    } else {
      console.warn('CLERK_SECRET_KEY not set – skipping Clerk metadata update');
    }

    return res.status(200).json({
      success: true,
      plan,
      message: `Plan mis à jour : ${plan}`,
    });
  } catch (error) {
    console.error('Admin update-plan error:', error);
    return res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}
