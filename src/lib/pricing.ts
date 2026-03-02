import type { PricingPlan } from '@/types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Découverte',
    price: '0€',
    period: 'Gratuit',
    description: 'Pour découvrir la plateforme et faire quelques recherches.',
    features: [
      '5 recherches par jour',
      'France métropolitaine uniquement',
      'Affichage carte standard',
      'Coordonnées GPS',
    ],
    highlighted: false,
    cta: 'Commencer gratuitement',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29€',
    period: '/ mois',
    description:
      'Pour les agents immobiliers indépendants et petites agences.',
    features: [
      'Recherches illimitées',
      'Tous les territoires Caraïbe & Outre-mer',
      'Vue satellite & cadastrale',
      'Historique de recherche complet',
      'Export PDF de rapports',
      'Recherche par lot (batch)',
      'Support prioritaire',
    ],
    highlighted: true,
    cta: 'Démarrer l\'essai gratuit de 14 jours',
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: '79€',
    period: '/ mois',
    description:
      'Pour les agences et réseaux immobiliers avec plusieurs collaborateurs.',
    features: [
      'Tout le plan Pro',
      'Jusqu\'à 10 utilisateurs',
      'API d\'accès (REST)',
      'Intégration CRM',
      'Analyses & statistiques avancées',
      'Marque blanche (white label)',
      'Account manager dédié',
      'Formation personnalisée',
    ],
    highlighted: false,
    cta: 'Contacter les ventes',
  },
];
