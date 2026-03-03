import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { db } = await connectToDatabase();
  const collection = db.collection('settings');

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const setting = await collection.findOne({ key: 'user_plan' });
      const plan = setting?.value || 'free';
      return res.status(200).json({ plan });
    }

    if (req.method === 'PUT') {
      const { plan } = req.body;
      if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan. Must be free, pro, or enterprise.' });
      }

      await collection.updateOne(
        { key: 'user_plan' },
        { $set: { key: 'user_plan', value: plan } },
        { upsert: true }
      );

      return res.status(200).json({ plan });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Plan API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
