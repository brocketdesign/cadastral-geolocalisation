/**
 * Seed test clients and agencies for the admin user.
 * Usage: node scripts/seed-data.mjs
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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
const client = new MongoClient(MONGODB_URI);

await client.connect();
const db = client.db('cadastral');

// Find admin user
const admin = await db.collection('user_plans').findOne({ isAdmin: true });
if (!admin) {
  console.error('No admin user found in user_plans collection.');
  await client.close();
  process.exit(1);
}

const userId = admin.clerkUserId;
console.log(`Seeding data for admin: ${userId}`);

// ── Agencies ────────────────────────────────────────────────────────────────
const agenciesCol = db.collection('agencies');

// Remove existing seeded agencies to avoid duplicates
await agenciesCol.deleteMany({ user_id: userId, _seeded: true });

const agencies = [
  {
    user_id: userId,
    name: 'Immo Paris Prestige',
    address: '12 Avenue des Champs-Élysées, 75008 Paris',
    phone: '01 42 65 10 10',
    is_default: true,
    _seeded: true,
    created_at: Date.now(),
  },
  {
    user_id: userId,
    name: 'Sud Immo Transactions',
    address: '3 Rue de la République, 13001 Marseille',
    phone: '04 91 55 22 33',
    is_default: false,
    _seeded: true,
    created_at: Date.now() - 86400000,
  },
  {
    user_id: userId,
    name: 'Lyon Centre Foncier',
    address: '27 Rue de la Part-Dieu, 69003 Lyon',
    phone: '04 72 33 11 20',
    is_default: false,
    _seeded: true,
    created_at: Date.now() - 172800000,
  },
];

const agencyResult = await agenciesCol.insertMany(agencies);
console.log(`Inserted ${agencyResult.insertedCount} agencies.`);

// ── Clients ──────────────────────────────────────────────────────────────────
const clientsCol = db.collection('clients');

// Remove existing seeded clients to avoid duplicates
await clientsCol.deleteMany({ user_id: userId, _seeded: true });

const clients = [
  {
    user_id: userId,
    name: 'Sophie Martin',
    email: 'sophie.martin@gmail.com',
    phone: '06 12 34 56 78',
    notes: 'Recherche terrain constructible en banlieue parisienne, budget 250k€.',
    _seeded: true,
    created_at: Date.now() - 3600000,
  },
  {
    user_id: userId,
    name: 'Jean-Luc Dupont',
    email: 'jl.dupont@orange.fr',
    phone: '07 65 43 21 09',
    notes: 'Investisseur — intéressé par plusieurs parcelles en zone agricole.',
    _seeded: true,
    created_at: Date.now() - 7200000,
  },
  {
    user_id: userId,
    name: 'Cabinet Foncier Aubert',
    email: 'contact@aubert-foncier.fr',
    phone: '01 44 77 88 99',
    notes: 'Notaire partenaire, gestion de dossiers de division parcellaire.',
    _seeded: true,
    created_at: Date.now() - 86400000,
  },
  {
    user_id: userId,
    name: 'Marie-Claire Rousseau',
    email: 'mclaire.rousseau@sfr.fr',
    phone: '06 98 76 54 32',
    notes: 'Primo-accédante, cherche parcelle avec accès viabilisé.',
    _seeded: true,
    created_at: Date.now() - 172800000,
  },
  {
    user_id: userId,
    name: 'Thomas Bernard',
    email: 'thomas.bernard@laposte.net',
    phone: '06 11 22 33 44',
    notes: 'Promoteur local — projet de lotissement 8 lots sur Île-de-France.',
    _seeded: true,
    created_at: Date.now() - 259200000,
  },
];

const clientResult = await clientsCol.insertMany(clients);
console.log(`Inserted ${clientResult.insertedCount} clients.`);

await client.close();
console.log('Done.');
