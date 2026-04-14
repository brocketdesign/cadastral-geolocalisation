/**
 * Local dev API server for Vite development.
 * Runs on port 3000 and handles /api/* routes.
 *
 * Usage: node scripts/dev-server.mjs
 * Then run: npm run dev   (Vite proxies /api/* to this server)
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env
const envPath = resolve(__dirname, '../.env');
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const MONGODB_URI = envVars.MONGODB_URI;
const CLERK_SECRET_KEY = envVars.CLERK_SECRET_KEY;
const PORT = 3000;

let _client = null;
async function getDb() {
  if (!_client) {
    _client = new MongoClient(MONGODB_URI);
    await _client.connect();
  }
  return _client.db();
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function parseQuery(url) {
  const u = new URL(url, 'http://localhost');
  return Object.fromEntries(u.searchParams);
}

const DEFAULT_ADS = [
  { id: 'pro-upgrade', type: 'text', enabled: true, icon: 'Crown', title: 'Passez au plan Pro', description: 'Recherches illimitées, export PDF, vue satellite et support prioritaire.', cta: 'Essai gratuit 14 jours', color: 'emerald', link: '/pricing' },
  { id: 'batch-search', type: 'text', enabled: true, icon: 'Zap', title: 'Recherche par lot', description: 'Importez un fichier CSV et géolocalisez des centaines de parcelles en un clic.', cta: 'Découvrir le plan Pro', color: 'violet', link: '/pricing' },
  { id: 'pdf-export', type: 'text', enabled: true, icon: 'Download', title: 'Rapports PDF professionnels', description: 'Générez des fiches parcellaires complètes pour vos clients en un clic.', cta: 'Débloquer les exports', color: 'blue', link: '/pricing' },
  { id: 'enterprise', type: 'text', enabled: true, icon: 'Users', title: 'Solution multi-utilisateurs', description: "Jusqu'à 10 collaborateurs, API REST, intégration CRM et marque blanche.", cta: "Découvrir l'offre Entreprise", color: 'amber', link: '/pricing' },
  { id: 'stats', type: 'text', enabled: true, icon: 'TrendingUp', title: 'Analyses & statistiques', description: "Suivez l'évolution des prix, comparez les zones et optimisez vos prospections.", cta: 'Voir les fonctionnalités Pro', color: 'rose', link: '/pricing' },
  { id: 'img-sidebar-prestige', type: 'image', enabled: true, src: '/ads/sidebar-immo-prestige.png', alt: 'Prestige Caraïbes Immobilier — Votre partenaire immobilier aux Antilles', href: '#', format: 'sidebar' },
  { id: 'img-sidebar-terrain', type: 'image', enabled: true, src: '/ads/sidebar-terrain-expert.png', alt: 'Terrain Expert Antilles — Expertise foncière & géomètre', href: '#', format: 'sidebar' },
  { id: 'img-banner-horizon', type: 'image', enabled: true, src: '/ads/banner-horizon-immo.png', alt: 'Horizon Immobilier DOM-TOM — Plus de 500 biens disponibles en Outre-mer', href: '#', format: 'banner' },
  { id: 'img-banner-invest', type: 'image', enabled: true, src: '/ads/banner-invest-caraibes.png', alt: "Invest Caraïbes — Investissez dans l'immobilier antillais", href: '#', format: 'banner' },
  { id: 'img-inline-soleil', type: 'image', enabled: true, src: '/ads/inline-agence-soleil.png', alt: 'Agence Soleil Immobilier — Trouvez votre bien de rêve aux Antilles', href: '#', format: 'inline' },
  { id: 'img-inline-neuf', type: 'image', enabled: true, src: '/ads/inline-neuf-outremer.png', alt: 'Outre-Mer Neuf — Programmes neufs en Guadeloupe, Martinique, Guyane', href: '#', format: 'inline' },
];

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  try {
    const db = await getDb();
    const query = parseQuery(req.url);

    // ── GET /api/users/me ──────────────────────────────────────────────────
    if (path === '/api/users/me' && method === 'GET') {
      const { userId } = query;
      if (!userId) return json(res, 400, { error: 'userId requis.' });
      const record = await db.collection('user_plans').findOne({ clerkUserId: userId });
      return json(res, 200, { plan: record?.plan ?? 'free', isAdmin: record?.isAdmin === true });
    }

    // ── GET /api/admin/users ───────────────────────────────────────────────
    if (path === '/api/admin/users' && method === 'GET') {
      const { adminUserId } = query;
      if (!adminUserId) return json(res, 400, { error: 'adminUserId requis.' });
      const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
      if (!requester?.isAdmin) return json(res, 403, { error: 'Accès refusé.' });
      const users = await db.collection('user_plans').find({}).sort({ updatedAt: -1 }).toArray();
      return json(res, 200, { users });
    }

    // ── POST /api/admin/update-user-plan ──────────────────────────────────
    if (path === '/api/admin/update-user-plan' && method === 'POST') {
      const body = await parseBody(req);
      const { adminUserId, targetUserId, plan } = body;
      if (!adminUserId || !targetUserId) return json(res, 400, { error: 'adminUserId et targetUserId requis.' });
      const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
      if (!requester?.isAdmin) return json(res, 403, { error: 'Accès refusé.' });
      await db.collection('user_plans').updateOne(
        { clerkUserId: targetUserId },
        { $set: { plan, updatedAt: new Date() } },
        { upsert: true }
      );
      // Update Clerk metadata
      if (CLERK_SECRET_KEY) {
        const getRes = await fetch(`https://api.clerk.com/v1/users/${targetUserId}`, { headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` } });
        if (getRes.ok) {
          const userData = await getRes.json();
          await fetch(`https://api.clerk.com/v1/users/${targetUserId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_metadata: { ...userData.public_metadata, plan } }),
          });
        }
      }
      return json(res, 200, { success: true, plan });
    }

    // ── GET /api/admin/ads ─────────────────────────────────────────────────
    if (path === '/api/admin/ads' && method === 'GET') {
      const { adminUserId } = query;
      if (!adminUserId) return json(res, 400, { error: 'adminUserId requis.' });
      const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
      if (!requester?.isAdmin) return json(res, 403, { error: 'Accès refusé.' });
      let ads = await db.collection('ads_config').find({}).sort({ type: 1, id: 1 }).toArray();
      if (ads.length === 0) {
        await db.collection('ads_config').insertMany(DEFAULT_ADS.map((a) => ({ ...a, updatedAt: new Date() })));
        ads = await db.collection('ads_config').find({}).sort({ type: 1, id: 1 }).toArray();
      }
      return json(res, 200, { ads });
    }

    // ── PUT /api/admin/ads ─────────────────────────────────────────────────
    if (path === '/api/admin/ads' && method === 'PUT') {
      const body = await parseBody(req);
      const { adminUserId, ad } = body;
      if (!adminUserId || !ad?.id) return json(res, 400, { error: 'adminUserId et ad.id requis.' });
      const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
      if (!requester?.isAdmin) return json(res, 403, { error: 'Accès refusé.' });
      const { id, _id, ...fields } = ad;
      await db.collection('ads_config').updateOne({ id }, { $set: { ...fields, updatedAt: new Date() } }, { upsert: true });
      return json(res, 200, { success: true });
    }

    // ── GET /api/ads ───────────────────────────────────────────────────────
    if (path === '/api/ads' && method === 'GET') {
      const ads = await db.collection('ads_config').find({ enabled: true }).toArray();
      return json(res, 200, { ads });
    }

    // ── GET /api/clients ──────────────────────────────────────────────────
    if (path === '/api/clients' && method === 'GET') {
      const { userId, search } = query;
      if (!userId) return json(res, 400, { error: 'userId requis.' });
      const filter = { user_id: userId };
      if (search && search.trim()) filter.name = { $regex: search.trim(), $options: 'i' };
      const clients = await db.collection('clients').find(filter).sort({ name: 1 }).limit(50).toArray();
      return json(res, 200, clients);
    }

    // ── POST /api/clients ─────────────────────────────────────────────────
    if (path === '/api/clients' && method === 'POST') {
      const body = await parseBody(req);
      const { user_id, name, phone, email, notes } = body;
      if (!user_id || !name) return json(res, 400, { error: 'user_id et name requis.' });
      const doc = { user_id, name: String(name).trim(), phone: phone ? String(phone).trim() : undefined, email: email ? String(email).trim() : undefined, notes: notes ? String(notes).trim() : undefined, created_at: Date.now() };
      const result = await db.collection('clients').insertOne(doc);
      return json(res, 201, { ...doc, _id: result.insertedId });
    }

    // ── PUT /api/clients ──────────────────────────────────────────────────
    if (path === '/api/clients' && method === 'PUT') {
      const body = await parseBody(req);
      const { _id, user_id, name, phone, email, notes } = body;
      if (!_id || !user_id) return json(res, 400, { error: '_id et user_id requis.' });
      const { ObjectId } = await import('mongodb');
      const update = { updated_at: Date.now() };
      if (name !== undefined) update.name = String(name).trim();
      if (phone !== undefined) update.phone = String(phone).trim();
      if (email !== undefined) update.email = String(email).trim();
      if (notes !== undefined) update.notes = String(notes).trim();
      await db.collection('clients').updateOne({ _id: new ObjectId(String(_id)), user_id }, { $set: update });
      const updated = await db.collection('clients').findOne({ _id: new ObjectId(String(_id)) });
      return json(res, 200, updated);
    }

    // ── DELETE /api/clients ───────────────────────────────────────────────
    if (path === '/api/clients' && method === 'DELETE') {
      const { id, userId } = query;
      if (!id || !userId) return json(res, 400, { error: 'id et userId requis.' });
      const { ObjectId } = await import('mongodb');
      await db.collection('clients').deleteOne({ _id: new ObjectId(id), user_id: userId });
      return json(res, 200, { success: true });
    }

    // ── GET /api/agencies ─────────────────────────────────────────────────
    if (path === '/api/agencies' && method === 'GET') {
      const { userId } = query;
      if (!userId) return json(res, 400, { error: 'userId requis.' });
      const agencies = await db.collection('agencies').find({ user_id: userId }).sort({ is_default: -1, name: 1 }).toArray();
      return json(res, 200, agencies);
    }

    // ── POST /api/agencies ────────────────────────────────────────────────
    if (path === '/api/agencies' && method === 'POST') {
      const body = await parseBody(req);
      const { user_id, name, address, phone, logo_url, is_default } = body;
      if (!user_id || !name) return json(res, 400, { error: 'user_id et name requis.' });
      if (is_default) await db.collection('agencies').updateMany({ user_id }, { $set: { is_default: false } });
      const count = await db.collection('agencies').countDocuments({ user_id });
      const setDefault = is_default || count === 0;
      const doc = { user_id, name: String(name).trim(), address: String(address || '').trim(), phone: String(phone || '').trim(), logo_url: logo_url ? String(logo_url).trim() : undefined, is_default: setDefault, created_at: Date.now() };
      const result = await db.collection('agencies').insertOne(doc);
      return json(res, 201, { ...doc, _id: result.insertedId });
    }

    // ── PUT /api/agencies ─────────────────────────────────────────────────
    if (path === '/api/agencies' && method === 'PUT') {
      const body = await parseBody(req);
      const { _id, user_id, name, address, phone, logo_url, is_default } = body;
      if (!_id || !user_id) return json(res, 400, { error: '_id et user_id requis.' });
      const { ObjectId } = await import('mongodb');
      if (is_default) await db.collection('agencies').updateMany({ user_id }, { $set: { is_default: false } });
      const update = { updated_at: Date.now() };
      if (name !== undefined) update.name = String(name).trim();
      if (address !== undefined) update.address = String(address).trim();
      if (phone !== undefined) update.phone = String(phone).trim();
      if (logo_url !== undefined) update.logo_url = String(logo_url).trim();
      if (is_default !== undefined) update.is_default = Boolean(is_default);
      await db.collection('agencies').updateOne({ _id: new ObjectId(String(_id)), user_id }, { $set: update });
      const updated = await db.collection('agencies').findOne({ _id: new ObjectId(String(_id)) });
      return json(res, 200, updated);
    }

    // ── DELETE /api/agencies ──────────────────────────────────────────────
    if (path === '/api/agencies' && method === 'DELETE') {
      const { id, userId } = query;
      if (!id || !userId) return json(res, 400, { error: 'id et userId requis.' });
      const { ObjectId } = await import('mongodb');
      await db.collection('agencies').deleteOne({ _id: new ObjectId(id), user_id: userId });
      return json(res, 200, { success: true });
    }

    json(res, 404, { error: 'Route not found' });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: 'Erreur serveur interne.' });
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ API server running on http://localhost:${PORT}`);
  console.log('   Proxied from Vite via /api/* → localhost:3000\n');
});

process.on('SIGINT', async () => {
  if (_client) await _client.close();
  process.exit(0);
});
