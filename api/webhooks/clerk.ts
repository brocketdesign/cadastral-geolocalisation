/**
 * POST /api/webhooks/clerk
 *
 * Handles Clerk webhook events and triggers transactional emails.
 * Supported events:
 *   - user.created  → welcome + trial-started emails
 *   - user.updated  → account-locked email (when locked: true)
 *
 * Requires CLERK_WEBHOOK_SECRET in environment variables.
 * Set it in Clerk Dashboard → Webhooks → your endpoint → Signing Secret.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Webhook } from 'svix';
import { sendEmail } from '../lib/send-email.js';

interface ClerkUserData {
  id: string;
  first_name?: string;
  last_name?: string;
  locked?: boolean;
  email_addresses?: Array<{ email_address: string; verification?: { status: string } }>;
}

function getPrimaryEmail(data: ClerkUserData): string | null {
  if (!data.email_addresses?.length) return null;
  const verified = data.email_addresses.find((e) => e.verification?.status === 'verified');
  return (verified ?? data.email_addresses[0]).email_address;
}

function getDisplayName(data: ClerkUserData): string {
  if (data.first_name && data.last_name) return `${data.first_name} ${data.last_name}`;
  if (data.first_name) return data.first_name;
  return 'là';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'CLERK_WEBHOOK_SECRET is not configured.' });
  }

  // Verify signature using Svix
  const svixId = req.headers['svix-id'] as string;
  const svixTimestamp = req.headers['svix-timestamp'] as string;
  const svixSignature = req.headers['svix-signature'] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: 'Missing Svix headers.' });
  }

  let payload: string;
  try {
    // Vercel provides the raw body via req.body when using bodyParser
    payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  } catch {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  let event: { type: string; data: ClerkUserData };
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof event;
  } catch {
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  const { type, data } = event;
  const email = getPrimaryEmail(data);
  const name = getDisplayName(data);

  try {
    if (type === 'user.created') {
      if (email) {
        // Send both welcome and trial-started in parallel
        await Promise.allSettled([
          sendEmail({ type: 'welcome', to: email, data: { name, email } }),
          sendEmail({ type: 'trial-started', to: email, data: { name, email } }),
        ]);
      }
    } else if (type === 'user.updated' && data.locked === true) {
      if (email) {
        await sendEmail({ type: 'account-locked', to: email, data: { name, email } });
      }
    }
  } catch (err) {
    console.error('Webhook email error:', err);
    // Return 200 so Clerk doesn't retry — we'll handle failures via logs
  }

  return res.status(200).json({ received: true });
}
