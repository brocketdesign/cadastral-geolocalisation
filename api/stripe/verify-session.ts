import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { connectToDatabase } from '../lib/mongodb.js';

/**
 * GET /api/stripe/verify-session?session_id=xxx&userId=xxx
 *
 * 1. Retrieves the Stripe Checkout session.
 * 2. Validates it belongs to the requesting user.
 * 3. If the subscription is active (or in trial), upgrades the user to Pro in:
 *    - MongoDB (user_plans collection)
 *    - Clerk publicMetadata
 * 4. Returns { plan, status }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe non configuré' });
  }

  const { session_id, userId } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'session_id requis.' });
  }
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId requis.' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Security: confirm this session was created for this user
    if (session.metadata?.userId !== userId) {
      return res.status(403).json({ error: 'Cette session ne vous appartient pas.' });
    }

    // Accept both paid and trialing states
    const isActive =
      session.payment_status === 'paid' ||
      session.status === 'complete';

    if (!isActive) {
      return res.status(200).json({ plan: 'free', status: session.status ?? 'pending' });
    }

    // Update MongoDB
    const { db } = await connectToDatabase();
    const existing = await db.collection('user_plans').findOne({ clerkUserId: userId });

    await db.collection('user_plans').updateOne(
      { clerkUserId: userId },
      {
        $set: {
          plan: 'pro',
          updatedAt: new Date(),
          stripeSessionId: session_id,
          isAdmin: existing?.isAdmin ?? false,
        },
      },
      { upsert: true }
    );

    // Update Clerk publicMetadata
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (clerkSecretKey) {
      await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: {
            plan: 'pro',
            isAdmin: existing?.isAdmin ?? false,
          },
        }),
      });
    }

    return res.status(200).json({ plan: 'pro', status: 'active' });
  } catch (err) {
    console.error('Stripe verify-session error:', err);
    return res.status(500).json({ error: 'Impossible de vérifier la session.' });
  }
}
