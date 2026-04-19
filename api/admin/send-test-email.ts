/**
 * POST /api/admin/send-test-email
 *
 * Sends a test email to a given address. Admin only.
 * Body: { adminUserId: string, type: EmailType, to: string, name?: string }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';
import { sendEmail } from '../lib/send-email.js';
import type { EmailType } from '../lib/email-templates.js';

const VALID_TYPES: EmailType[] = ['welcome', 'trial-started', 'account-locked'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { adminUserId, type, to, name } = req.body as {
    adminUserId?: string;
    type?: string;
    to?: string;
    name?: string;
  };

  if (!adminUserId || !type || !to) {
    return res.status(400).json({ error: 'adminUserId, type et to sont requis.' });
  }

  if (!VALID_TYPES.includes(type as EmailType)) {
    return res.status(400).json({ error: `Type invalide. Types valides : ${VALID_TYPES.join(', ')}` });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  }

  try {
    const { db } = await connectToDatabase();
    const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
    if (!requester?.isAdmin) {
      return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }

    const result = await sendEmail(
      {
        type: type as EmailType,
        to,
        data: { name: name || 'Admin Test', email: to },
      },
      true, // isTest = true
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Échec de l\'envoi.' });
    }

    return res.status(200).json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Send test email error:', error);
    return res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}
