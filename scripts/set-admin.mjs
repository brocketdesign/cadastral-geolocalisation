/**
 * Usage: node scripts/set-admin.mjs <clerkUserId>
 *
 * Sets isAdmin: true for the given Clerk user ID in both:
 *   - MongoDB (user_plans collection)
 *   - Clerk publicMetadata
 *
 * Reads MONGODB_URI and CLERK_SECRET_KEY from .env
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env manually (no dotenv dependency needed)
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

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node scripts/set-admin.mjs <clerkUserId>');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env');
  process.exit(1);
}

console.log(`Setting isAdmin: true for user: ${userId}`);

// 1. MongoDB
const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db();

const result = await db.collection('user_plans').updateOne(
  { clerkUserId: userId },
  { $set: { clerkUserId: userId, isAdmin: true, updatedAt: new Date() } },
  { upsert: true }
);
console.log(`MongoDB: ${result.upsertedCount ? 'created' : 'updated'} user_plans record`);

await client.close();

// 2. Clerk publicMetadata
if (CLERK_SECRET_KEY) {
  // First fetch existing metadata to preserve other fields
  const getRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  });

  if (!getRes.ok) {
    console.warn(`Clerk GET failed: ${getRes.status} ${await getRes.text()}`);
  } else {
    const userData = await getRes.json();
    const existingMeta = userData.public_metadata ?? {};

    const patchRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: { ...existingMeta, isAdmin: true },
      }),
    });

    if (patchRes.ok) {
      console.log('Clerk: publicMetadata updated with isAdmin: true');
    } else {
      console.warn(`Clerk PATCH failed: ${patchRes.status} ${await patchRes.text()}`);
    }
  }
} else {
  console.warn('CLERK_SECRET_KEY not found – skipping Clerk update');
}

console.log('\nDone! The user is now an administrator.');
console.log('Refresh the app (or sign out and back in) to see the admin section.');
