import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { db } = await connectToDatabase();
  const col = db.collection('agencies');

  try {
    // GET /api/agencies?userId=xxx
    if (req.method === 'GET') {
      const { userId } = req.query;
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId requis.' });
      }
      const agencies = await col
        .find({ user_id: userId })
        .sort({ is_default: -1, name: 1 })
        .toArray();
      return res.status(200).json(agencies);
    }

    // POST /api/agencies — create
    if (req.method === 'POST') {
      const { user_id, name, address, phone, logo_url, is_default } = req.body;
      if (!user_id || !name) {
        return res.status(400).json({ error: 'user_id et name requis.' });
      }
      // If this is set as default, unset others
      if (is_default) {
        await col.updateMany({ user_id }, { $set: { is_default: false } });
      }
      // If no agencies yet, auto-set as default
      const count = await col.countDocuments({ user_id });
      const setDefault = is_default || count === 0;
      if (setDefault && !is_default) {
        // no need to unset since already none
      }
      const doc = {
        user_id,
        name: String(name).trim(),
        address: String(address || '').trim(),
        phone: String(phone || '').trim(),
        logo_url: logo_url ? String(logo_url).trim() : undefined,
        is_default: setDefault,
        created_at: Date.now(),
      };
      const result = await col.insertOne(doc);
      return res.status(201).json({ ...doc, _id: result.insertedId });
    }

    // PUT /api/agencies — update by id
    if (req.method === 'PUT') {
      const { _id, user_id, name, address, phone, logo_url, is_default } = req.body;
      if (!_id || !user_id) {
        return res.status(400).json({ error: '_id et user_id requis.' });
      }
      if (is_default) {
        await col.updateMany({ user_id }, { $set: { is_default: false } });
      }
      const update: Record<string, unknown> = {};
      if (name !== undefined) update.name = String(name).trim();
      if (address !== undefined) update.address = String(address).trim();
      if (phone !== undefined) update.phone = String(phone).trim();
      if (logo_url !== undefined) update.logo_url = String(logo_url).trim();
      if (is_default !== undefined) update.is_default = Boolean(is_default);
      update.updated_at = Date.now();

      await col.updateOne(
        { _id: new ObjectId(String(_id)), user_id },
        { $set: update }
      );
      const updated = await col.findOne({ _id: new ObjectId(String(_id)) });
      return res.status(200).json(updated);
    }

    // DELETE /api/agencies?id=xxx&userId=xxx
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
    console.error('Agencies API error:', err);
    return res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}
