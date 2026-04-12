/**
 * Reseeds the ads_config collection with correct data.
 * Usage: node scripts/reseed-ads.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '../.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

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

const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db();

const deleted = await db.collection('ads_config').deleteMany({});
console.log(`Deleted ${deleted.deletedCount} old ads`);

await db.collection('ads_config').insertMany(DEFAULT_ADS.map((a) => ({ ...a, updatedAt: new Date() })));
const count = await db.collection('ads_config').countDocuments();
console.log(`Seeded ${count} ads (5 text + 6 image)`);

await client.close();
