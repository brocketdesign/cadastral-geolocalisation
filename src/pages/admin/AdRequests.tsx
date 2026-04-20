import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserPlan } from '@/hooks/use-user-plan';
import {
  Megaphone,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  BarChart3,
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ArrowUpRight,
  CircleDollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'active';

interface AdRequest {
  id: string;
  company: string;
  contact: string;
  email: string;
  format: string;
  period: string;
  startDate: string;
  budget: string;
  message: string;
  status: RequestStatus;
  submittedAt: string;
  website?: string;
}

/* ─── Mock data ─────────────────────────────────────────────── */

const INITIAL_REQUESTS: AdRequest[] = [
  {
    id: 'req-001',
    company: 'Horizon Immobilier DOM-TOM',
    contact: 'Jacques Martin',
    email: 'j.martin@horizon-immo.fr',
    format: 'Bannière (2:1)',
    period: '1 mois',
    startDate: 'Juillet 2026',
    budget: '290 €',
    message: 'Nous souhaitons promouvoir notre nouveau programme de vente en Martinique auprès des investisseurs locaux.',
    status: 'active',
    submittedAt: '02 avr. 2026',
    website: 'https://horizon-immo.fr',
  },
  {
    id: 'req-002',
    company: 'Invest Caraïbes',
    contact: 'Sophie Durand',
    email: 's.durand@invest-caraibes.com',
    format: 'Sidebar (3:4)',
    period: '2 semaines',
    startDate: 'Mai 2026',
    budget: '120 €',
    message: 'Campagne de notoriété pour nos nouvelles offres d\'investissement en Guadeloupe.',
    status: 'pending',
    submittedAt: '10 avr. 2026',
    website: 'https://invest-caraibes.com',
  },
  {
    id: 'req-003',
    company: 'Agence Soleil Immobilier',
    contact: 'Marc Leclerc',
    email: 'm.leclerc@soleil-immo.re',
    format: 'Inline (16:9)',
    period: '1 mois',
    startDate: 'Juin 2026',
    budget: '220 €',
    message: 'Annonce pour nos biens à La Réunion — appartements neufs T2/T3.',
    status: 'pending',
    submittedAt: '11 avr. 2026',
  },
  {
    id: 'req-004',
    company: 'Terrain Expert Antilles',
    contact: 'Lucie Boisvert',
    email: 'l.boisvert@terrain-expert.fr',
    format: 'Sidebar (3:4)',
    period: '3 mois',
    startDate: 'Juillet 2026',
    budget: '510 €',
    message: 'Nous sommes géomètres et souhaitons toucher les professionnels de l\'immobilier.',
    status: 'approved',
    submittedAt: '08 avr. 2026',
    website: 'https://terrain-expert.fr',
  },
  {
    id: 'req-005',
    company: 'Outre-Mer Neuf',
    contact: 'Thomas Girard',
    email: 't.girard@outremer-neuf.com',
    format: 'Bannière (2:1)',
    period: '1 semaine',
    startDate: 'Mai 2026',
    budget: '90 €',
    message: 'Promotion d\'un programme neuf en Guyane. Visuel fourni en 2:1 HD.',
    status: 'rejected',
    submittedAt: '05 avr. 2026',
  },
  {
    id: 'req-006',
    company: 'Prestige Caraïbes Immobilier',
    contact: 'Isabelle Moreau',
    email: 'i.moreau@prestige-caraibes.com',
    format: 'Inline (16:9)',
    period: '2 semaines',
    startDate: 'Juin 2026',
    budget: '150 €',
    message: 'Campagne pour notre agence de luxe basée en Martinique.',
    status: 'pending',
    submittedAt: '13 avr. 2026',
    website: 'https://prestige-caraibes.com',
  },
];

/* ─── Status badge ───────────────────────────────────────────── */

function StatusBadge({ status }: { status: RequestStatus }) {
  const config = {
    pending:  { label: 'En attente', className: 'bg-amber-100 text-amber-700',   icon: Clock          },
    approved: { label: 'Approuvé',   className: 'bg-blue-100 text-blue-700',     icon: CheckCircle2   },
    active:   { label: 'Actif',      className: 'bg-emerald-100 text-emerald-700', icon: Zap           },
    rejected: { label: 'Refusé',     className: 'bg-red-100 text-red-700',       icon: XCircle        },
  }[status];

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

/* ─── Stat card ─────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Request detail panel ───────────────────────────────────── */

function RequestDetail({ req, onApprove, onReject, onActivate, onClose }: {
  req: AdRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onActivate: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">{req.company}</p>
            <p className="text-xs text-slate-400 mt-0.5">{req.contact} · {req.email}</p>
          </div>
          <StatusBadge status={req.status} />
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Format', value: req.format },
              { label: 'Période', value: `${req.period} — ${req.startDate}` },
              { label: 'Budget', value: req.budget },
              { label: 'Soumis le', value: req.submittedAt },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {req.website && (
            <a
              href={req.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
            >
              {req.website}
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}

          {req.message && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-[10px] text-slate-400 uppercase mb-1">Message</p>
              <p className="text-sm text-slate-700 leading-relaxed">{req.message}</p>
            </div>
          )}

          {/* Visuel placeholder */}
          <div className="rounded-lg border-2 border-dashed border-slate-200 h-28 flex items-center justify-center text-slate-400 text-sm">
            Aucun visuel fourni — à demander lors de l'approbation
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3 bg-slate-50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <div className="flex gap-2">
            {req.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 gap-1"
                  onClick={() => { onReject(req.id); onClose(); }}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  Refuser
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  onClick={() => { onApprove(req.id); onClose(); }}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Approuver
                </Button>
              </>
            )}
            {req.status === 'approved' && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                onClick={() => { onActivate(req.id); onClose(); }}
              >
                <Zap className="w-3.5 h-3.5" />
                Activer la publicité
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */

export default function AdRequests() {
  const { isAdmin } = useUserPlan();
  const [requests, setRequests] = useState<AdRequest[]>(INITIAL_REQUESTS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'integration'>('overview');
  const [selected, setSelected] = useState<AdRequest | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <ShieldAlert className="w-10 h-10" />
        <p className="text-sm font-medium">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const pending  = requests.filter((r) => r.status === 'pending');
  const approved = requests.filter((r) => r.status === 'approved');
  const active   = requests.filter((r) => r.status === 'active');
  const totalRevenue = requests
    .filter((r) => r.status === 'active' || r.status === 'approved')
    .reduce((sum, r) => sum + parseInt(r.budget.replace(/[^0-9]/g, ''), 10), 0);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.company.toLowerCase().includes(search.toLowerCase()) ||
      r.contact.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r));
    toast.success('Demande approuvée', { description: 'L\'annonceur peut maintenant être activé.' });
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected' } : r));
    toast.error('Demande refusée');
  };

  const handleActivate = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'active' } : r));
    toast.success('Publicité activée !', { description: 'Elle est maintenant visible par les utilisateurs.' });
  };

  const TAB_ITEMS = [
    { key: 'overview',     label: 'Vue d\'ensemble', icon: BarChart3   },
    { key: 'requests',     label: 'Demandes',         icon: Clock       },
    { key: 'integration',  label: 'Intégration',      icon: Zap         },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
            Demandes publicitaires
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez, analysez et approuvez les demandes des annonceurs.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info('Actualisation…')}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-fit overflow-x-auto">
        {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === 'requests' && pending.length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pending.length}
              </span>
            )}
            {key === 'integration' && approved.length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                {approved.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: Overview                                          */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={Clock}
              label="En attente"
              value={String(pending.length)}
              sub="à traiter"
              color="bg-amber-100 text-amber-600"
            />
            <StatCard
              icon={CheckCircle2}
              label="Approuvées"
              value={String(approved.length)}
              sub="prêtes à activer"
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              icon={Zap}
              label="Actives"
              value={String(active.length)}
              sub="en ligne"
              color="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              icon={CircleDollarSign}
              label="Revenus"
              value={`${totalRevenue} €`}
              sub="approuvées + actives"
              color="bg-violet-100 text-violet-600"
            />
          </div>

          {/* Charts placeholder */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Demandes par format', sub: 'Bannière · Inline · Sidebar' },
              { title: 'Statuts des demandes', sub: 'Distribution en temps réel' },
              { title: 'Revenus par mois', sub: 'Projection Avr–Juil 2026' },
            ].map(({ title, sub }) => (
              <Card key={title} className="border-slate-200">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
                  <p className="text-xs text-slate-400">{sub}</p>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="h-28 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-slate-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Format breakdown */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700">Répartition par format</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {(['Bannière (2:1)', 'Inline (16:9)', 'Sidebar (3:4)'] as const).map((fmt) => {
                const count = requests.filter((r) => r.format === fmt).length;
                const pct = Math.round((count / requests.length) * 100);
                return (
                  <div key={fmt} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">{fmt}</span>
                      <span className="text-slate-400">{count} demandes · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700">Activité récente</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="space-y-3">
                {requests.slice(0, 4).map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {r.company[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-800">{r.company}</p>
                        <p className="text-[10px] text-slate-400">{r.format} · {r.submittedAt}</p>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: Requests                                          */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher par entreprise, contact…"
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 text-sm w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="rejected">Refusés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Aucune demande correspondante.
                </div>
              ) : (
                filtered.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(req)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                        {req.company[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{req.company}</p>
                        <p className="text-xs text-slate-400 truncate">{req.contact} · {req.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap justify-end">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-600">{req.format}</p>
                        <p className="text-[10px] text-slate-400">{req.period} — {req.startDate}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">{req.budget}</p>
                      <StatusBadge status={req.status} />
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                          onClick={(e) => { e.stopPropagation(); setSelected(req); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {req.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-blue-500 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-400 hover:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); handleReject(req.id); }}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {req.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-emerald-500 hover:bg-emerald-50"
                            onClick={(e) => { e.stopPropagation(); handleActivate(req.id); }}
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: Integration                                       */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'integration' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Les demandes ci-dessous ont été approuvées. Activez-les pour les intégrer au système publicitaire en production.
          </p>

          {approved.length === 0 ? (
            <Card className="border-dashed border-slate-200">
              <CardContent className="py-12 text-center text-slate-400 text-sm space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-200" />
                <p>Aucune demande approuvée en attente d'activation.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {approved.map((req) => (
                <Card key={req.id} className="border-slate-200 hover:border-blue-200 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{req.company}</p>
                          <StatusBadge status={req.status} />
                        </div>
                        <p className="text-xs text-slate-500">{req.contact} · {req.email}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          {[
                            { label: 'Format', value: req.format },
                            { label: 'Période', value: `${req.period} · ${req.startDate}` },
                            { label: 'Budget', value: req.budget },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-[10px] text-slate-400">{label}</p>
                              <p className="text-xs font-medium text-slate-700">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Visuel placeholder */}
                        <div className="w-24 h-16 rounded-md bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-[10px]">
                          Visuel
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                          onClick={() => handleActivate(req.id)}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Activer
                        </Button>
                      </div>
                    </div>
                    {req.message && (
                      <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-md px-3 py-2 border border-slate-100">
                        {req.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Active ads summary */}
          {active.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-slate-700">Publicités actives ({active.length})</h3>
              </div>
              {active.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-emerald-900">{req.company}</p>
                    <p className="text-xs text-emerald-600">{req.format} · {req.period} — {req.startDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-emerald-700">{req.budget}</p>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Detail modal ──────────────────────────────────────── */}
      {selected && (
        <RequestDetail
          req={selected}
          onApprove={handleApprove}
          onReject={handleReject}
          onActivate={handleActivate}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
