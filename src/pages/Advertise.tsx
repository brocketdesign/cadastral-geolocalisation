import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Megaphone,
  LayoutTemplate,
  Sidebar,
  MonitorPlay,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Users,
  MousePointerClick,
  TrendingUp,
  ChevronRight,
  Hourglass,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserPlan } from '@/hooks/use-user-plan';

/* ─── Types ─────────────────────────────────────────────────── */

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'active';

interface AdRequest {
  id: string;
  format: string;
  period: string;
  company: string;
  budget: string;
  status: RequestStatus;
  submittedAt: string;
  note?: string;
}

/* ─── Mock data ─────────────────────────────────────────────── */

const MOCK_MY_REQUESTS: AdRequest[] = [
  {
    id: 'req-001',
    format: 'Bannière (2:1)',
    period: '1 mois — Juillet 2026',
    company: 'Mon Agence Immo',
    budget: '290 €',
    status: 'active',
    submittedAt: '2 avr. 2026',
    note: 'Approuvé et publié automatiquement.',
  },
  {
    id: 'req-002',
    format: 'Sidebar (3:4)',
    period: '2 semaines — Août 2026',
    company: 'Mon Agence Immo',
    budget: '120 €',
    status: 'pending',
    submittedAt: '10 avr. 2026',
  },
  {
    id: 'req-003',
    format: 'Inline (16:9)',
    period: '1 semaine — Mars 2026',
    company: 'Mon Agence Immo',
    budget: '75 €',
    status: 'rejected',
    submittedAt: '1 mar. 2026',
    note: "Visuel non conforme à notre charte graphique.",
  },
];

/* ─── Format cards ───────────────────────────────────────────── */

const FORMATS = [
  {
    key: 'banner',
    label: 'Bannière',
    ratio: '2:1',
    icon: LayoutTemplate,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    placement: 'Haut de page — résultats de recherche',
    description: 'Format grand angle, idéal pour la notoriété de marque.',
    prices: { week: 90, month: 290 },
    impressions: '~4 000 / mois',
    ctr: '~1,8 %',
  },
  {
    key: 'inline',
    label: 'Inline',
    ratio: '16:9',
    icon: MonitorPlay,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    placement: 'Intégré dans les résultats de parcelles',
    description: "Discret et contextuel, fort taux d'engagement.",
    prices: { week: 75, month: 220 },
    impressions: '~6 000 / mois',
    ctr: '~2,4 %',
  },
  {
    key: 'sidebar',
    label: 'Sidebar',
    ratio: '3:4',
    icon: Sidebar,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    placement: 'Panneau latéral — visible sur toutes les pages',
    description: 'Présence permanente à côté du contenu principal.',
    prices: { week: 60, month: 170 },
    impressions: '~8 000 / mois',
    ctr: '~1,2 %',
  },
];

/* ─── Status badge ───────────────────────────────────────────── */

function StatusBadge({ status }: { status: RequestStatus }) {
  const config = {
    pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700', icon: Clock },
    approved: { label: 'Approuvé', className: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    active: { label: 'Actif', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    rejected: { label: 'Refusé', className: 'bg-red-100 text-red-700', icon: XCircle },
  }[status];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

/* ─── Shared sections ───────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="text-center space-y-3">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
        <Megaphone className="w-3.5 h-3.5" />
        Espace publicitaire
      </div>
      <h1 className="text-3xl font-bold text-slate-900">
        Touchez des professionnels de l'immobilier
      </h1>
      <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
        CadastreMaps réunit des notaires, agents immobiliers, géomètres et investisseurs.
        Diffusez votre message auprès d'une audience qualifiée dans les DOM-TOM.
      </p>
    </div>
  );
}

function StatsBar() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        { icon: Users, label: 'Utilisateurs actifs', value: '1 200+' },
        { icon: MousePointerClick, label: 'Impressions / mois', value: '18 000+' },
        { icon: TrendingUp, label: "Taux d'engagement moyen", value: '1,8 %' },
      ].map(({ icon: Icon, label, value }) => (
        <Card key={label} className="text-center border-slate-200">
          <CardContent className="pt-4 pb-3">
            <Icon className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Comment ça marche ?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            step: '01',
            title: 'Soumettez votre demande',
            desc: 'Choisissez votre format, la période et envoyez votre dossier. Aucun paiement à cette étape.',
          },
          {
            step: '02',
            title: 'Validation sous 48h',
            desc: "Notre équipe analyse votre annonce, vérifie la conformité et vous revient par email.",
          },
          {
            step: '03',
            title: 'Publication & suivi',
            desc: 'Une fois approuvé, votre publicité est mise en ligne. Suivez ses performances depuis ce tableau de bord.',
          },
        ].map(({ step, title, desc }) => (
          <div key={step} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
            <span className="text-2xl font-black text-emerald-100">{step}</span>
            <p className="font-semibold text-slate-800 text-sm">{title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Coming-soon view (non-admin) ───────────────────────────── */

function AdvertiseComingSoon() {
  const [selectedFormat, setSelectedFormat] = useState<string>('banner');
  const format = FORMATS.find((f) => f.key === selectedFormat)!;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <PageHeader />

      {/* Coming-soon banner */}
      <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-6 py-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white border border-emerald-200 shadow-sm">
          <Hourglass className="w-7 h-7 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-emerald-900">Bientôt disponible</h2>
          <p className="text-sm text-emerald-700 mt-2 max-w-md mx-auto leading-relaxed">
            L'espace publicitaire est en cours de mise en place. Vous pourrez très prochainement
            réserver des emplacements directement depuis cette page et suivre vos campagnes en temps réel.
          </p>
        </div>
        <button
          onClick={() => toast.success('Vous serez notifié dès l\'ouverture !', { description: 'Merci pour votre intérêt.' })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
        >
          <Bell className="w-4 h-4" />
          Me notifier à l'ouverture
        </button>
      </div>

      <StatsBar />

      {/* Format cards — read-only preview */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Les formats disponibles</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Aperçu</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFormat === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setSelectedFormat(f.key)}
                className={`text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                  isSelected
                    ? `${f.border} ${f.bg} shadow-sm`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.bg}`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="font-semibold text-slate-900 text-sm">{f.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.ratio} — {f.placement}</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{f.description}</p>
                <div className="mt-3 flex gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400">/ semaine</p>
                    <p className="text-sm font-bold text-slate-800">{f.prices.week} €</p>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <p className="text-[10px] text-slate-400">/ mois</p>
                    <p className="text-sm font-bold text-slate-800">{f.prices.month} €</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-4 flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-xs text-slate-400">Format</p>
              <p className="text-sm font-semibold text-slate-800">{format.label} ({format.ratio})</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Impressions estimées</p>
              <p className="text-sm font-semibold text-slate-800">{format.impressions}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">CTR moyen</p>
              <p className="text-sm font-semibold text-slate-800">{format.ctr}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Placement</p>
              <p className="text-sm font-semibold text-slate-800">{format.placement}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <HowItWorks />
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */

export default function Advertise() {
  const { isAdmin } = useUserPlan();

  if (!isAdmin) return <AdvertiseComingSoon />;

  return <AdvertiseDashboard />;
}

function AdvertiseDashboard() {
  const [selectedFormat, setSelectedFormat] = useState<string>('banner');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const format = FORMATS.find((f) => f.key === selectedFormat)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !selectedPeriod) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Demande envoyée !', {
        description: "Nous analyserons votre demande et vous contacterons sous 48h.",
      });
      setCompany('');
      setWebsite('');
      setMessage('');
      setSelectedPeriod('');
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

      <PageHeader />

      <StatsBar />

      {/* ── Format selection ──────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Choisissez un format</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFormat === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setSelectedFormat(f.key)}
                className={`text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                  isSelected
                    ? `${f.border} ${f.bg} shadow-sm`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.bg}`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <p className="font-semibold text-slate-900 text-sm">{f.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.ratio} — {f.placement}</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{f.description}</p>
                <div className="mt-3 flex gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400">/ semaine</p>
                    <p className="text-sm font-bold text-slate-800">{f.prices.week} €</p>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <p className="text-[10px] text-slate-400">/ mois</p>
                    <p className="text-sm font-bold text-slate-800">{f.prices.month} €</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected format details */}
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-4 flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-xs text-slate-400">Format sélectionné</p>
              <p className="text-sm font-semibold text-slate-800">{format.label} ({format.ratio})</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Impressions estimées</p>
              <p className="text-sm font-semibold text-slate-800">{format.impressions}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">CTR moyen</p>
              <p className="text-sm font-semibold text-slate-800">{format.ctr}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Placement</p>
              <p className="text-sm font-semibold text-slate-800">{format.placement}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Request form ──────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Soumettre une demande</h2>
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nom de l'entreprise <span className="text-red-400">*</span></Label>
                  <Input
                    placeholder="Mon Agence Immobilière"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Site web</Label>
                  <Input
                    placeholder="https://mon-agence.fr"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Format publicitaire</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label} ({f.ratio})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Période souhaitée <span className="text-red-400">*</span></Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1w-may">1 semaine — Mai 2026 ({format.prices.week} €)</SelectItem>
                      <SelectItem value="1w-jun">1 semaine — Juin 2026 ({format.prices.week} €)</SelectItem>
                      <SelectItem value="1w-jul">1 semaine — Juillet 2026 ({format.prices.week} €)</SelectItem>
                      <SelectItem value="2w-may">2 semaines — Mai 2026 ({format.prices.week * 2} €)</SelectItem>
                      <SelectItem value="2w-jun">2 semaines — Juin 2026 ({format.prices.week * 2} €)</SelectItem>
                      <SelectItem value="1m-may">1 mois — Mai 2026 ({format.prices.month} €)</SelectItem>
                      <SelectItem value="1m-jun">1 mois — Juin 2026 ({format.prices.month} €)</SelectItem>
                      <SelectItem value="1m-jul">1 mois — Juillet 2026 ({format.prices.month} €)</SelectItem>
                      <SelectItem value="3m-q3">3 mois — Juillet–Sept. 2026 ({format.prices.month * 3} €)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Message / informations complémentaires</Label>
                <textarea
                  rows={3}
                  placeholder="Décrivez votre annonce, votre cible, ou posez vos questions…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Price summary */}
              {selectedPeriod && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Estimation indicative</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      {format.label} · {selectedPeriod.startsWith('1w') ? '1 semaine' : selectedPeriod.startsWith('2w') ? '2 semaines' : selectedPeriod.startsWith('1m') ? '1 mois' : '3 mois'}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-700">
                    {selectedPeriod.startsWith('1w') ? `${format.prices.week} €`
                      : selectedPeriod.startsWith('2w') ? `${format.prices.week * 2} €`
                      : selectedPeriod.startsWith('1m') ? `${format.prices.month} €`
                      : `${format.prices.month * 3} €`}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-400">
                  Votre demande sera examinée sous 48h. Aucun paiement maintenant.
                </p>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-2"
                >
                  {submitting ? (
                    <span className="animate-pulse">Envoi…</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer la demande
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* ── My requests ───────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Mes demandes</h2>
        {MOCK_MY_REQUESTS.length === 0 ? (
          <Card className="border-dashed border-slate-200">
            <CardContent className="py-10 text-center text-slate-400 text-sm">
              Aucune demande pour l'instant.
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {MOCK_MY_REQUESTS.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {req.format}
                        <span className="text-slate-400 font-normal"> · {req.period}</span>
                      </p>
                      {req.note && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{req.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <p className="text-sm font-semibold text-slate-700">{req.budget}</p>
                    <StatusBadge status={req.status} />
                    <p className="text-xs text-slate-400 hidden sm:block">{req.submittedAt}</p>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      <HowItWorks />

    </div>
  );
}
