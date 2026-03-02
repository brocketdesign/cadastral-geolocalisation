import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  MapPin,
  Search,
  Globe,
  FileText,
  Shield,
  Zap,
  Users,
  Star,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Globe,
    title: 'Couverture Caraïbe complète',
    description:
      'Guadeloupe, Martinique, Guyane, Saint-Martin, Saint-Barthélemy, La Réunion et Mayotte.',
  },
  {
    icon: Search,
    title: 'Recherche cadastrale instantanée',
    description:
      'Trouvez n\'importe quelle parcelle en quelques secondes avec notre moteur de recherche avancé.',
  },
  {
    icon: MapPin,
    title: 'Géolocalisation précise',
    description:
      'Coordonnées GPS exactes avec affichage sur carte interactive (satellite, cadastrale, standard).',
  },
  {
    icon: FileText,
    title: 'Rapports professionnels',
    description:
      'Générez des fiches parcelles PDF prêtes à être partagées avec vos clients.',
  },
  {
    icon: Shield,
    title: 'Données officielles',
    description:
      'Sources de données gouvernementales fiables et à jour (api-adresse.data.gouv.fr).',
  },
  {
    icon: Zap,
    title: 'Recherche par lot',
    description:
      'Importez une liste de références cadastrales et géolocalisez-les toutes en un seul clic.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Marie-Claire D.',
    role: 'Agent immobilier, Guadeloupe',
    text: 'CadaStreMap a révolutionné ma façon de travailler. Je peux localiser n\'importe quelle parcelle en Guadeloupe en quelques secondes. Mes clients sont impressionnés !',
    rating: 5,
  },
  {
    name: 'Jean-Philippe R.',
    role: 'Directeur d\'agence, Martinique',
    text: 'L\'outil indispensable pour tout professionnel de l\'immobilier aux Antilles. Les rapports PDF sont parfaits pour nos dossiers clients.',
    rating: 5,
  },
  {
    name: 'Sophie L.',
    role: 'Notaire, Guyane',
    text: 'Enfin un outil simple et efficace pour géolocaliser les parcelles cadastrales en Outre-mer. Le gain de temps est considérable.',
    rating: 5,
  },
];

const STATS = [
  { value: '2 500+', label: 'Agents immobiliers' },
  { value: '150 000+', label: 'Recherches effectuées' },
  { value: '7', label: 'Territoires couverts' },
  { value: '99.9%', label: 'Disponibilité' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <MapPin className="w-7 h-7 text-emerald-600" />
              <span className="text-xl font-bold text-slate-900">
                Cada<span className="text-emerald-600">Stre</span>Map
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Fonctionnalités
              </a>
              <a href="#testimonials" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Témoignages
              </a>
              <Link to="/pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Tarifs
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Essai gratuit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              La plateforme cadastrale #1 pour la Caraïbe
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
              Géolocalisez toute parcelle <br />
              <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                aux Antilles & Outre-mer
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              L'outil professionnel des agents immobiliers caribéens.
              Recherche cadastrale, géolocalisation GPS, rapports clients — tout en un.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/dashboard">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6 h-auto">
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              Essai gratuit 14 jours — Aucune carte bancaire requise
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Des outils puissants conçus spécifiquement pour les professionnels de l'immobilier
              en Outre-mer et dans la Caraïbe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Caribbean territories highlight */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 to-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              7 territoires couverts
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              La couverture la plus complète pour les DOM-TOM et collectivités d'Outre-mer.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { flag: '🇬🇵', name: 'Guadeloupe', parcels: '180 000+' },
              { flag: '🇲🇶', name: 'Martinique', parcels: '160 000+' },
              { flag: '🇬🇫', name: 'Guyane', parcels: '95 000+' },
              { flag: '🇷🇪', name: 'La Réunion', parcels: '350 000+' },
              { flag: '🇾🇹', name: 'Mayotte', parcels: '75 000+' },
              { flag: '🇧🇱', name: 'Saint-Barthélemy', parcels: '8 000+' },
              { flag: '🇲🇫', name: 'Saint-Martin', parcels: '12 000+' },
              { flag: '🇫🇷', name: 'France métro.', parcels: '100M+' },
            ].map((territory) => (
              <div key={territory.name} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow text-center">
                <div className="text-4xl mb-2">{territory.flag}</div>
                <div className="font-semibold text-slate-900">{territory.name}</div>
                <div className="text-sm text-slate-500">{territory.parcels} parcelles</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Des milliers de professionnels utilisent CadaStreMap au quotidien.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.name} className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="w-12 h-12 text-emerald-200 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Rejoignez 2 500+ agents immobiliers
          </h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            Commencez votre essai gratuit de 14 jours et découvrez pourquoi les meilleurs
            professionnels de l'immobilier caribéen nous font confiance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6 h-auto">
                Démarrer l'essai gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-emerald-200 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              14 jours gratuits
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Sans carte bancaire
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Annulation à tout moment
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span className="text-lg font-bold text-white">
                  Cada<span className="text-emerald-500">Stre</span>Map
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                La plateforme de géolocalisation cadastrale pour les professionnels
                de l'immobilier aux Antilles et en Outre-mer.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Territoires</h4>
              <ul className="space-y-2 text-sm">
                <li>Guadeloupe</li>
                <li>Martinique</li>
                <li>Guyane</li>
                <li>Saint-Martin / Saint-Barthélemy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>contact@cadastremap.com</li>
                <li>+590 690 XX XX XX</li>
                <li>Pointe-à-Pitre, Guadeloupe</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            © {new Date().getFullYear()} CadaStreMap. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
