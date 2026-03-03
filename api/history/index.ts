import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { db } = await connectToDatabase();
  const collection = db.collection('history');

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const items = await collection.find({}).sort({ timestamp: -1 }).limit(100).toArray();
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const { parcelle, result } = req.body;
      if (!parcelle || !result) {
        return res.status(400).json({ error: 'parcelle and result are required' });
      }

      const newItem = {
        id: crypto.randomUUID(),
        parcelle,
        result,
        timestamp: Date.now(),
        isFavorite: false,
      };

      await collection.insertOne(newItem);
      return res.status(201).json(newItem);
    }

    if (req.method === 'DELETE') {
      // Clear all history
      await collection.deleteMany({});
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('History API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
