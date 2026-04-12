import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

/**
 * POST /api/admin/update-user-plan
 * Body: { adminUserId: string, targetUserId: string, plan: 'free' | 'pro' | 'enterprise' }
 *
 * Admin updates another user's plan in MongoDB and Clerk publicMetadata.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { adminUserId, targetUserId, plan } = req.body;

    if (!adminUserId || !targetUserId) {
      return res.status(400).json({ error: 'adminUserId et targetUserId requis.' });
    }
    if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Plan invalide. Doit être free, pro ou enterprise.' });
    }

    const { db } = await connectToDatabase();

    // Verify admin
    const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
    if (!requester?.isAdmin) {
      return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }

    // Update target user's plan in MongoDB (preserve their isAdmin flag)
    const target = await db.collection('user_plans').findOne({ clerkUserId: targetUserId });
    await db.collection('user_plans').updateOne(
      { clerkUserId: targetUserId },
      {
        $set: {
          plan,
          updatedAt: new Date(),
          isAdmin: target?.isAdmin ?? false,
        },
      },
      { upsert: true }
    );

    // Update Clerk publicMetadata for the target user
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (clerkSecretKey) {
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${targetUserId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: { plan, isAdmin: target?.isAdmin ?? false },
        }),
      });

      if (!clerkRes.ok) {
        const errBody = await clerkRes.text();
        console.error('Clerk API error:', clerkRes.status, errBody);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour Clerk.', details: errBody });
      }
    } else {
      console.warn('CLERK_SECRET_KEY not set – skipping Clerk metadata update');
    }

    return res.status(200).json({ success: true, plan, targetUserId });
  } catch (error) {
    console.error('Admin update-user-plan error:', error);
    return res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}
