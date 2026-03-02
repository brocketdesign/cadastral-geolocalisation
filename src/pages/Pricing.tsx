import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle2, ArrowLeft } from 'lucide-react';
import { PRICING_PLANS } from '@/lib/pricing';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <MapPin className="w-7 h-7 text-emerald-600" />
              <span className="text-xl font-bold text-slate-900">
                Cada<span className="text-emerald-600">Stre</span>Map
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Accueil
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Un plan adapté à chaque besoin
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Que vous soyez agent indépendant ou réseau d'agences, nous avons le plan qu'il vous faut.
            Essai gratuit de 14 jours sur tous les plans payants.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.highlighted
                    ? 'border-2 border-emerald-500 shadow-lg scale-105'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-emerald-600 text-white px-3 py-1">
                      Le plus populaire
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-slate-900">{plan.name}</CardTitle>
                  <div className="mt-3">
                    <span className="text-5xl font-extrabold text-slate-900">{plan.price}</span>
                    {plan.period !== 'Gratuit' && (
                      <span className="text-slate-500 ml-1">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/dashboard" className="block">
                    <Button
                      className={`w-full mt-4 ${
                        plan.highlighted
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : ''
                      }`}
                      variant={plan.highlighted ? 'default' : 'outline'}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Puis-je tester gratuitement avant de m\'abonner ?',
                a: 'Oui ! Tous les plans payants incluent un essai gratuit de 14 jours, sans carte bancaire requise. Le plan Découverte est gratuit à vie avec des fonctionnalités limitées.',
              },
              {
                q: 'Quels territoires sont couverts ?',
                a: 'Nous couvrons la Guadeloupe, la Martinique, la Guyane, Saint-Martin, Saint-Barthélemy, La Réunion, Mayotte et la France métropolitaine. Le plan Découverte est limité à la métropole.',
              },
              {
                q: 'Puis-je changer de plan à tout moment ?',
                a: 'Absolument. Vous pouvez upgrader ou downgrader votre plan à tout moment. Le prorata sera calculé automatiquement.',
              },
              {
                q: 'Comment fonctionne l\'API pour le plan Entreprise ?',
                a: 'Le plan Entreprise inclut un accès API REST complet pour intégrer nos données cadastrales dans votre CRM ou vos outils internes. Documentation Swagger fournie.',
              },
              {
                q: 'Y a-t-il un engagement de durée ?',
                a: 'Non, nos abonnements sont sans engagement. Vous pouvez annuler à tout moment, sans frais.',
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-white">CadaStreMap</span>
          </div>
          © {new Date().getFullYear()} CadaStreMap. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
