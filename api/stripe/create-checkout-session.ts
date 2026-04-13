import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

/**
 * POST /api/stripe/create-checkout-session
 * Body: {
 *   userId: string,
 *   plan: 'pro',
 *   trial: boolean,   // true → 3-day free trial (popup only)
 *   successUrl: string,
 *   cancelUrl: string,
 * }
 * Returns: { url: string, sessionId: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe non configuré' });
  }

  const { userId, plan, trial, successUrl, cancelUrl } = req.body as {
    userId?: string;
    plan?: string;
    trial?: boolean;
    successUrl?: string;
    cancelUrl?: string;
  };

  if (!userId || !plan || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'userId, plan, successUrl et cancelUrl sont requis.' });
  }

  if (plan !== 'pro') {
    return res.status(400).json({ error: 'Plan invalide. Seul le plan Pro est disponible.' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'CadastrMap Pro',
              description: 'Accès illimité à toutes les fonctionnalités Pro – recherches, exports PDF, Risk Score IA et plus.',
            },
            unit_amount: 2900, // 29,00 €
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        plan: 'pro',
        trial: trial ? 'true' : 'false',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    if (trial) {
      sessionParams.subscription_data = {
        trial_period_days: 3,
        metadata: {
          userId,
          plan: 'pro',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe create-checkout-session error:', err);
    return res.status(500).json({ error: 'Impossible de créer la session de paiement.' });
  }
}
