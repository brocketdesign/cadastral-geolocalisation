import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

const DEFAULT_ADS = [
  {
    id: 'pro-upgrade', type: 'text', enabled: true, icon: 'Crown',
    title: 'Passez au plan Pro',
    description: 'Recherches illimitées, export PDF, vue satellite et support prioritaire.',
    cta: 'Essai gratuit 14 jours', color: 'emerald', link: '/pricing',
  },
  {
    id: 'batch-search', type: 'text', enabled: true, icon: 'Zap',
    title: 'Recherche par lot',
    description: 'Importez un fichier CSV et géolocalisez des centaines de parcelles en un clic.',
    cta: 'Découvrir le plan Pro', color: 'violet', link: '/pricing',
  },
  {
    id: 'pdf-export', type: 'text', enabled: true, icon: 'Download',
    title: 'Rapports PDF professionnels',
    description: 'Générez des fiches parcellaires complètes pour vos clients en un clic.',
    cta: 'Déblocker les exports', color: 'blue', link: '/pricing',
  },
  {
    id: 'enterprise', type: 'text', enabled: true, icon: 'Users',
    title: 'Solution multi-utilisateurs',
    description: "Jusqu'à 10 collaborateurs, API REST, intégration CRM et marque blanche.",
    cta: "Découvrir l'offre Entreprise", color: 'amber', link: '/pricing',
  },
  {
    id: 'stats', type: 'text', enabled: true, icon: 'TrendingUp',
    title: 'Analyses & statistiques',
    description: "Suivez l'évolution des prix, comparez les zones et optimisez vos prospections.",
    cta: 'Voir les fonctionnalités Pro', color: 'rose', link: '/pricing',
  },
  {
    id: 'img-sidebar-prestige', type: 'image', enabled: true,
    src: '/ads/sidebar-immo-prestige.png',
    alt: 'Prestige Caraïbes Immobilier — Votre partenaire immobilier aux Antilles',
    href: '#', format: 'sidebar',
  },
  {
    id: 'img-sidebar-terrain', type: 'image', enabled: true,
    src: '/ads/sidebar-terrain-expert.png',
    alt: 'Terrain Expert Antilles — Expertise foncière & géomètre',
    href: '#', format: 'sidebar',
  },
  {
    id: 'img-banner-horizon', type: 'image', enabled: true,
    src: '/ads/banner-horizon-immo.png',
    alt: 'Horizon Immobilier DOM-TOM — Plus de 500 biens disponibles en Outre-mer',
    href: '#', format: 'banner',
  },
  {
    id: 'img-banner-invest', type: 'image', enabled: true,
    src: '/ads/banner-invest-caraibes.png',
    alt: "Invest Caraïbes — Investissez dans l'immobilier antillais",
    href: '#', format: 'banner',
  },
  {
    id: 'img-inline-soleil', type: 'image', enabled: true,
    src: '/ads/inline-agence-soleil.png',
    alt: 'Agence Soleil Immobilier — Trouvez votre bien de rêve aux Antilles',
    href: '#', format: 'inline',
  },
  {
    id: 'img-inline-neuf', type: 'image', enabled: true,
    src: '/ads/inline-neuf-outremer.png',
    alt: 'Outre-Mer Neuf — Programmes neufs en Guadeloupe, Martinique, Guyane',
    href: '#', format: 'inline',
  },
];

/**
 * GET  /api/admin/ads?adminUserId=xxx  — list all ads (including disabled)
 * PUT  /api/admin/ads                  — upsert a single ad
 *   Body: { adminUserId, ad: { id, ...fields } }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { db } = await connectToDatabase();

    // ── GET ────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { adminUserId } = req.query;
      if (!adminUserId || typeof adminUserId !== 'string') {
        return res.status(400).json({ error: 'adminUserId requis.' });
      }

      const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
      if (!requester?.isAdmin) {
        return res.status(403).json({ error: 'Accès refusé.' });
      }

      let ads = await db.collection('ads_config').find({}).sort({ type: 1, id: 1 }).toArray();

      // Seed defaults if collection is empty
      if (ads.length === 0) {
        await db.collection('ads_config').insertMany(
          DEFAULT_ADS.map((a) => ({ ...a, updatedAt: new Date() }))
        );
        ads = await db.collection('ads_config').find({}).sort({ type: 1, id: 1 }).toArray();
      }

      return res.status(200).json({ ads });
    }

    // ── PUT ────────────────────────────────────────────────────────────────
    if (req.method === 'PUT') {
      const { adminUserId, ad } = req.body;

      if (!adminUserId || !ad?.id) {
        return res.status(400).json({ error: 'adminUserId et ad.id requis.' });
      }

      const requester = await db.collection('user_plans').findOne({ clerkUserId: adminUserId });
      if (!requester?.isAdmin) {
        return res.status(403).json({ error: 'Accès refusé.' });
      }

      const { id, _id, ...fields } = ad;
      await db.collection('ads_config').updateOne(
        { id },
        { $set: { ...fields, updatedAt: new Date() } },
        { upsert: true }
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin ads error:', error);
    return res.status(500).json({ error: 'Erreur serveur interne.' });
  }
}
