import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { db } = await connectToDatabase();
  const col = db.collection('clients');

  try {
    // GET /api/clients?userId=xxx&search=xxx
    if (req.method === 'GET') {
      const { userId, search } = req.query;
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId requis.' });
      }
      const filter: Record<string, unknown> = { user_id: userId };
      if (search && typeof search === 'string' && search.trim()) {
        filter.name = { $regex: search.trim(), $options: 'i' };
      }
      const clients = await col
        .find(filter)
        .sort({ name: 1 })
        .limit(50)
        .toArray();
      return res.status(200).json(clients);
    }

    // POST /api/clients — create
    if (req.method === 'POST') {
      const { user_id, name, phone, email, notes } = req.body;
      if (!user_id || !name) {
        return res.status(400).json({ error: 'user_id et name requis.' });
      }
      const doc = {
        user_id,
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : undefined,
        email: email ? String(email).trim() : undefined,
        notes: notes ? String(notes).trim() : undefined,
        created_at: Date.now(),
      };
      const result = await col.insertOne(doc);
      return res.status(201).json({ ...doc, _id: result.insertedId });
    }

    // PUT /api/clients — update by id
    if (req.method === 'PUT') {
      const { _id, user_id, name, phone, email, notes } = req.body;
      if (!_id || !user_id) {
        return res.status(400).json({ error: '_id et user_id requis.' });
      }
      const update: Record<string, unknown> = { updated_at: Date.now() };
      if (name !== undefined) update.name = String(name).trim();
      if (phone !== undefined) update.phone = String(phone).trim();
      if (email !== undefined) update.email = String(email).trim();
      if (notes !== undefined) update.notes = String(notes).trim();

      await col.updateOne(
        { _id: new ObjectId(String(_id)), user_id },
        { $set: update }
      );
      const updated = await col.findOne({ _id: new ObjectId(String(_id)) });
      return res.status(200).json(updated);
    }

    // DELETE /api/clients?id=xxx&userId=xxx
    if (req.method === 'DELETE') {
      const { id, userId } = req.query;
      if (!id || !userId || typeof id !== 'string' || typeof userId !== 'string') {
        return res.status(400).json({ error: 'id et userId requis.' });
      }
      await col.deleteOne({ _id: new ObjectId(id), user_id: userId });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Méthode non autorisée.' });
  } catch (err) {
    console.error('Clients API error:', err);
    return res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}
