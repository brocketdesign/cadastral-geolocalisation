import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

const DEFAULT_TEXT_ADS = [
  {
    id: 'pro-upgrade',
    type: 'text',
    enabled: true,
    icon: 'Crown',
    title: 'Passez au plan Pro',
    description: 'Recherches illimitées, export PDF, vue satellite et support prioritaire.',
    cta: 'Essai gratuit 14 jours',
    color: 'emerald',
    link: '/pricing',
  },
  {
    id: 'batch-search',
    type: 'text',
    enabled: true,
    icon: 'Zap',
    title: 'Recherche par lot',
    description: 'Importez un fichier CSV et géolocalisez des centaines de parcelles en un clic.',
    cta: 'Découvrir le plan Pro',
    color: 'violet',
    link: '/pricing',
  },
  {
    id: 'pdf-export',
    type: 'text',
    enabled: true,
    icon: 'Download',
    title: 'Rapports PDF professionnels',
    description: 'Générez des fiches parcellaires complètes pour vos clients en un clic.',
    cta: 'Débloquer les exports',
    color: 'blue',
    link: '/pricing',
  },
  {
    id: 'enterprise',
    type: 'text',
    enabled: true,
    icon: 'Users',
    title: 'Solution multi-utilisateurs',
    description: "Jusqu'à 10 collaborateurs, API REST, intégration CRM et marque blanche.",
    cta: "Découvrir l'offre Entreprise",
    color: 'amber',
    link: '/pricing',
  },
  {
    id: 'stats',
    type: 'text',
    enabled: true,
    icon: 'TrendingUp',
    title: 'Analyses & statistiques',
    description: 'Suivez l\'évolution des prix, comparez les zones et optimisez vos prospections.',
    cta: 'Voir les fonctionnalités Pro',
    color: 'rose',
    link: '/pricing',
  },
];

const DEFAULT_IMAGE_ADS = [
  {
    id: 'img-sidebar-prestige',
    type: 'image',
    enabled: true,
    src: '/ads/sidebar-immo-prestige.png',
    alt: 'Prestige Caraïbes Immobilier — Votre partenaire immobilier aux Antilles',
    href: '#',
    format: 'sidebar',
  },
  {
    id: 'img-sidebar-terrain',
    type: 'image',
    enabled: true,
    src: '/ads/sidebar-terrain-expert.png',
    alt: 'Terrain Expert Antilles — Expertise foncière & géomètre',
    href: '#',
    format: 'sidebar',
  },
  {
    id: 'img-banner-horizon',
    type: 'image',
    enabled: true,
    src: '/ads/banner-horizon-immo.png',
    alt: 'Horizon Immobilier DOM-TOM — Plus de 500 biens disponibles en Outre-mer',
    href: '#',
    format: 'banner',
  },
  {
    id: 'img-banner-invest',
    type: 'image',
    enabled: true,
    src: '/ads/banner-invest-caraibes.png',
    alt: "Invest Caraïbes — Investissez dans l'immobilier antillais",
    href: '#',
    format: 'banner',
  },
  {
    id: 'img-inline-soleil',
    type: 'image',
    enabled: true,
    src: '/ads/inline-agence-soleil.png',
    alt: 'Agence Soleil Immobilier — Trouvez votre bien de rêve aux Antilles',
    href: '#',
    format: 'inline',
  },
  {
    id: 'img-inline-neuf',
    type: 'image',
    enabled: true,
    src: '/ads/inline-neuf-outremer.png',
    alt: 'Outre-Mer Neuf — Programmes neufs en Guadeloupe, Martinique, Guyane',
    href: '#',
    format: 'inline',
  },
];

/**
 * GET /api/ads
 * Returns enabled ads config. Falls back to hardcoded defaults if no config in DB.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { db } = await connectToDatabase();
    const configs = await db.collection('ads_config').find({}).toArray();

    if (!configs || configs.length === 0) {
      return res.status(200).json({ textAds: DEFAULT_TEXT_ADS, imageAds: DEFAULT_IMAGE_ADS });
    }

    const textAds = configs.filter((a) => a.type === 'text');
    const imageAds = configs.filter((a) => a.type === 'image');

    return res.status(200).json({ textAds, imageAds });
  } catch {
    return res.status(200).json({ textAds: DEFAULT_TEXT_ADS, imageAds: DEFAULT_IMAGE_ADS });
  }
}
