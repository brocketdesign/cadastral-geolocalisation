import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Crown, Zap, TrendingUp, Download, Users, Sparkles, type LucideIcon } from 'lucide-react';
import { useAdsConfig, type TextAd, type ImageAd as LiveImageAd } from '@/hooks/use-ads-config';
import { useUserPlan } from '@/hooks/use-user-plan';

interface AdBannerProps {
  variant?: 'inline' | 'sidebar' | 'banner';
  className?: string;
}

// Map icon name strings (stored in DB) to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  Zap,
  TrendingUp,
  Download,
  Users,
};

const FALLBACK_TEXT_ADS: TextAd[] = [
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
    cta: 'Débloquer les exports', color: 'blue', link: '/pricing',
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
];

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; button: string; iconBg: string }> = {
  emerald: {
    bg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  violet: {
    bg: 'bg-gradient-to-r from-violet-50 to-purple-50',
    border: 'border-violet-200',
    text: 'text-violet-800',
    badge: 'bg-violet-100 text-violet-700',
    button: 'bg-violet-600 hover:bg-violet-700',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  blue: {
    bg: 'bg-gradient-to-r from-blue-50 to-sky-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  amber: {
    bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-600 hover:bg-amber-700',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  rose: {
    bg: 'bg-gradient-to-r from-rose-50 to-pink-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    badge: 'bg-rose-100 text-rose-700',
    button: 'bg-rose-600 hover:bg-rose-700',
    iconBg: 'bg-rose-100 text-rose-600',
  },
};

function getRandomTextAd(pool: TextAd[]): TextAd {
  const enabled = pool.filter((a) => a.enabled);
  const candidates = enabled.length > 0 ? enabled : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function AdBanner({ variant = 'inline', className = '' }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { plan, isAdmin, isLoaded } = useUserPlan();
  const { config } = useAdsConfig();

  // Use fallback only when config hasn't loaded yet; once loaded, respect what the API returned
  const pool = config === null ? FALLBACK_TEXT_ADS : (config.textAds ?? []);
  const [ad] = useState<TextAd | null>(() => pool.length ? getRandomTextAd(pool) : null);

  // Don't show ads until plan is known, to paying users, admins, or when no ad is available
  if (!isLoaded || plan !== 'free' || isAdmin || dismissed || !ad) return null;

  const colors = colorMap[ad.color] || colorMap.emerald;
  const Icon: LucideIcon = ICON_MAP[ad.icon] ?? Crown;

  if (variant === 'banner') {
    return (
      <div className={`relative ${colors.bg} border ${colors.border} rounded-lg p-4 ${className}`}>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4">
          <div className={`shrink-0 w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className={`font-semibold text-sm ${colors.text}`}>{ad.title}</p>
              <Badge className={`${colors.badge} text-[10px] border-0`}>
                <Sparkles className="w-3 h-3 mr-0.5" />
                PROMO
              </Badge>
            </div>
            <p className="text-xs text-slate-600">{ad.description}</p>
          </div>
          <Link to={ad.link} className="shrink-0">
            <Button size="sm" className={`${colors.button} text-white text-xs`}>
              {ad.cta}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <Card className={`shadow-sm overflow-hidden border ${colors.border} ${className}`}>
        <div className={`${colors.bg} p-1`}>
          <div className="flex items-center justify-between px-3 pt-2">
            <Badge className={`${colors.badge} text-[10px] border-0`}>
              <Sparkles className="w-3 h-3 mr-0.5" />
              SPONSORISÉ
            </Badge>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <CardContent className={`${colors.bg} p-4 pt-2`}>
          <div className="flex items-start gap-3">
            <div className={`shrink-0 w-9 h-9 rounded-lg ${colors.iconBg} flex items-center justify-center mt-0.5`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className={`font-semibold text-sm ${colors.text}`}>{ad.title}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ad.description}</p>
            </div>
          </div>
          <Link to={ad.link} className="block mt-3">
            <Button size="sm" className={`w-full ${colors.button} text-white text-xs`}>
              {ad.cta}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Default: inline
  return (
    <div className={`relative ${colors.bg} border ${colors.border} rounded-lg p-3 ${className}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-3 pr-4">
        <div className={`shrink-0 w-8 h-8 rounded-md ${colors.iconBg} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className={`font-semibold text-xs ${colors.text}`}>{ad.title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{ad.description}</p>
          <Link to={ad.link}>
            <Button size="sm" variant="link" className={`${colors.text} p-0 h-auto text-xs mt-1`}>
              {ad.cta} &rarr;
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AdSidebarCard({ className = '' }: { className?: string }) {
  return <AdBanner variant="sidebar" className={className} />;
}

export function AdTopBanner({ className = '' }: { className?: string }) {
  return <AdBanner variant="banner" className={className} />;
}

export function AdInline({ className = '' }: { className?: string }) {
  return <AdBanner variant="inline" className={className} />;
}

// ─── Image-based real estate agency ads ───────────────────────────

const FALLBACK_IMAGE_ADS: LiveImageAd[] = [
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

function getRandomImageAd(pool: LiveImageAd[], format: LiveImageAd['format']): LiveImageAd | null {
  const candidates = pool.filter((a) => a.format === format && a.enabled);
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function ImageAdWrapper({
  format,
  className = '',
}: {
  format: LiveImageAd['format'];
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const { plan, isAdmin, isLoaded } = useUserPlan();
  const { config } = useAdsConfig();

  // Use fallback only when config hasn't loaded yet; once loaded, respect what the API returned
  const pool = config === null ? FALLBACK_IMAGE_ADS : (config.imageAds ?? []);
  const [ad] = useState<LiveImageAd | null>(() => getRandomImageAd(pool, format));

  if (!isLoaded || plan !== 'free' || isAdmin || dismissed || !ad) return null;

  return (
    <div className={`relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm ${className}`}>
      <div className="absolute top-2 left-2 z-10">
        <Badge className="bg-black/60 text-white text-[10px] border-0 backdrop-blur-sm">
          Sponsorisé
        </Badge>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <a href={ad.href} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={ad.src}
          alt={ad.alt}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </a>
    </div>
  );
}

export function ImageAdSidebar({ className = '' }: { className?: string }) {
  return <ImageAdWrapper format="sidebar" className={className} />;
}

export function ImageAdTopBanner({ className = '' }: { className?: string }) {
  return <ImageAdWrapper format="banner" className={className} />;
}

export function ImageAdInline({ className = '' }: { className?: string }) {
  return <ImageAdWrapper format="inline" className={className} />;
}
