import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  FlaskConical,
  Clock,
  BarChart2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailType = 'welcome' | 'trial-started' | 'account-locked';

interface EmailLog {
  _id: string;
  type: EmailType;
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  sentAt: string;
  isTest?: boolean;
}

interface StatEntry {
  _id: { type: string; status: string };
  count: number;
}

// ─── Template metadata ────────────────────────────────────────────────────────

const TEMPLATES: {
  type: EmailType;
  label: string;
  description: string;
  trigger: string;
  color: string;
  previewSubject: string;
}[] = [
  {
    type: 'welcome',
    label: 'Bienvenue',
    description: 'Accueille le nouvel utilisateur et présente les fonctionnalités clés de la plateforme.',
    trigger: 'Déclenché automatiquement à la création du compte (Clerk → webhook user.created)',
    color: 'emerald',
    previewSubject: 'Bienvenue sur CadaStreMap 🗺️',
  },
  {
    type: 'trial-started',
    label: 'Essai gratuit',
    description: 'Informe l\'utilisateur que son essai gratuit de 3 jours est activé et liste les fonctionnalités incluses.',
    trigger: 'Envoyé en même temps que le mail de bienvenue, lors de la création du compte.',
    color: 'blue',
    previewSubject: 'Votre essai gratuit commence — 3 jours pour tout explorer 🚀',
  },
  {
    type: 'account-locked',
    label: 'Compte verrouillé',
    description: 'Alerte l\'utilisateur que son compte a été temporairement suspendu et guide la réactivation.',
    trigger: 'Déclenché par Clerk webhook user.updated quand locked = true.',
    color: 'red',
    previewSubject: '⚠️ Votre compte CadaStreMap a été temporairement suspendu',
  },
];

const COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  red: 'bg-red-100 text-red-700 border-red-200',
};

// ─── Preview HTML generators (simplified inline previews) ──────────────────

function WelcomePreview({ name }: { name: string }) {
  return (
    <div className="font-sans text-sm">
      <div className="bg-slate-900 text-white px-6 py-4 rounded-t-lg">
        <span className="text-base font-bold">📍 Cada<span className="text-emerald-400">Stre</span>Map</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-b-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Bienvenue sur CadaStreMap, {name} ! 🎉</h2>
        <p className="text-slate-500 leading-relaxed">
          Votre compte est créé et prêt à l'emploi. CadaStreMap vous permet de localiser n'importe quelle parcelle cadastrale en France, d'analyser les risques fonciers et de générer des rapports professionnels.
        </p>
        <div className="space-y-2">
          {[
            ['🔍', 'Recherche cadastrale', 'Localisez une parcelle par adresse ou numéro.'],
            ['📊', 'Risk Score IA', 'Évaluez le risque foncier d\'une parcelle.'],
            ['📄', 'Rapports PDF', 'Générez des fiches parcellaires professionnelles.'],
            ['🔔', 'Alertes foncières', 'Soyez notifié des changements en temps réel.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex gap-3">
              <span className="text-lg mt-0.5">{icon}</span>
              <div>
                <p className="font-semibold text-slate-800 text-xs">{title}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <span className="inline-block bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-default">
            Accéder à mon tableau de bord →
          </span>
        </div>
      </div>
    </div>
  );
}

function TrialPreview({ name }: { name: string }) {
  return (
    <div className="font-sans text-sm">
      <div className="bg-slate-900 text-white px-6 py-4 rounded-t-lg">
        <span className="text-base font-bold">📍 Cada<span className="text-emerald-400">Stre</span>Map</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-b-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Votre essai gratuit est activé, {name} !</h2>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-emerald-700">3 jours d'accès complet</p>
          <p className="text-emerald-600 text-xs mt-1">Toutes les fonctionnalités Pro — sans engagement, sans carte bancaire.</p>
        </div>
        <div className="space-y-1.5">
          {[
            'Recherches cadastrales illimitées',
            'Export PDF des fiches parcellaires',
            'Risk Score IA sur toutes les parcelles',
            'Comparaison multi-parcelles',
            'Alertes foncières en temps réel',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-slate-700 text-xs">
              <span className="text-emerald-500 font-bold">✓</span> {item}
            </div>
          ))}
        </div>
        <div>
          <span className="inline-block bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-default">
            Explorer CadaStreMap maintenant →
          </span>
        </div>
      </div>
    </div>
  );
}

function LockedPreview({ name }: { name: string }) {
  return (
    <div className="font-sans text-sm">
      <div className="bg-slate-900 text-white px-6 py-4 rounded-t-lg">
        <span className="text-base font-bold">📍 Cada<span className="text-emerald-400">Stre</span>Map</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-b-lg p-6 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="font-semibold text-red-600 text-sm">⚠️ Compte temporairement suspendu</p>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Bonjour {name},</h2>
        <p className="text-slate-600 leading-relaxed">
          Votre compte CadaStreMap a été temporairement suspendu suite à plusieurs tentatives de connexion incorrectes ou à une activité inhabituelle.
        </p>
        <p className="text-slate-600 leading-relaxed">
          <strong>Vous n'avez aucune action à entreprendre si vous êtes à l'origine de ces tentatives</strong> — votre compte sera automatiquement réactivé après un délai.
        </p>
        <div>
          <span className="inline-block bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-default">
            Réinitialiser mon mot de passe
          </span>
        </div>
      </div>
    </div>
  );
}

function EmailPreviewPanel({ type, name }: { type: EmailType; name: string }) {
  if (type === 'welcome') return <WelcomePreview name={name} />;
  if (type === 'trial-started') return <TrialPreview name={name} />;
  return <LockedPreview name={name} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmailDashboard() {
  const { user } = useUser();
  const { isAdmin } = useUserPlan();

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<StatEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const [previewType, setPreviewType] = useState<EmailType>('welcome');
  const [previewName, setPreviewName] = useState('Jean Dupont');

  const [testType, setTestType] = useState<EmailType>('welcome');
  const [testTo, setTestTo] = useState('');
  const [testName, setTestName] = useState('');
  const [sending, setSending] = useState(false);

  const adminUserId = user?.id;

  const fetchLogs = useCallback(async () => {
    if (!adminUserId) return;
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({ adminUserId, limit: '100' });
      if (filterType !== 'all') params.set('type', filterType);
      const res = await fetch(`/api/admin/email-logs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogs(data.logs ?? []);
      setStats(data.stats ?? []);
    } catch (err: unknown) {
      toast.error('Erreur lors du chargement des logs', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    } finally {
      setLoadingLogs(false);
    }
  }, [adminUserId, filterType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSendTest = async () => {
    if (!adminUserId || !testTo) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          type: testType,
          to: testTo,
          name: testName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('E-mail de test envoyé !', {
        description: `Type : ${testType} → ${testTo}`,
      });
      fetchLogs();
    } catch (err: unknown) {
      toast.error('Échec de l\'envoi', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    } finally {
      setSending(false);
    }
  };

  // Stat helpers
  const getCount = (type: string, status: string) =>
    stats.find((s) => s._id.type === type && s._id.status === status)?.count ?? 0;

  const totalSent = stats.filter((s) => s._id.status === 'sent').reduce((a, b) => a + b.count, 0);
  const totalFailed = stats.filter((s) => s._id.status === 'failed').reduce((a, b) => a + b.count, 0);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-500" />
            Emails transactionnels
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gérez les messages automatiques envoyés aux utilisateurs via Resend.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loadingLogs}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingLogs ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Total envoyés</p>
            <p className="text-3xl font-bold text-emerald-600">{totalSent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Échecs</p>
            <p className="text-3xl font-bold text-red-500">{totalFailed}</p>
          </CardContent>
        </Card>
        {TEMPLATES.map((t) => (
          <Card key={t.type}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">{t.label}</p>
              <p className="text-2xl font-bold text-slate-800">
                {getCount(t.type, 'sent')}
                <span className="text-sm font-normal text-slate-400 ml-1">envoyés</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="mb-4">
          <TabsTrigger value="templates">
            <Eye className="w-4 h-4 mr-1.5" />
            Templates & Aperçu
          </TabsTrigger>
          <TabsTrigger value="test">
            <FlaskConical className="w-4 h-4 mr-1.5" />
            Envoyer un test
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Clock className="w-4 h-4 mr-1.5" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart2 className="w-4 h-4 mr-1.5" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* ── Templates & Preview ─────────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Template list */}
            <div className="space-y-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => setPreviewType(t.type)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    previewType === t.type
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{t.label}</span>
                        <Badge variant="outline" className={`text-xs ${COLOR_MAP[t.color]}`}>
                          {t.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{t.description}</p>
                    </div>
                    {previewType === t.type && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div className="mt-2 flex items-start gap-1.5">
                    <span className="text-xs bg-slate-100 text-slate-500 rounded px-2 py-0.5 leading-relaxed">
                      {t.trigger}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Live preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">Aperçu de l'e-mail</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Nom affiché :</span>
                  <Input
                    value={previewName}
                    onChange={(e) => setPreviewName(e.target.value)}
                    className="h-7 text-xs w-36"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50 p-4">
                <EmailPreviewPanel type={previewType} name={previewName || 'Jean Dupont'} />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Objet : <em>{TEMPLATES.find((t) => t.type === previewType)?.previewSubject}</em>
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ── Send test ───────────────────────────────────────────────────── */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-500" />
                Envoyer un e-mail de test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Type d'e-mail</label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.type}
                      onClick={() => setTestType(t.type)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                        testType === t.type
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Adresse e-mail destinataire <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="admin@exemple.fr"
                  className="max-w-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Nom affiché <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <Input
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="max-w-sm"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-700">Sujet :</strong>{' '}
                {TEMPLATES.find((t) => t.type === testType)?.previewSubject}
                <br />
                <strong className="text-slate-700">Trigger :</strong>{' '}
                {TEMPLATES.find((t) => t.type === testType)?.trigger}
              </div>

              <Button
                onClick={handleSendTest}
                disabled={!testTo || sending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {sending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {sending ? 'Envoi en cours…' : 'Envoyer le test'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Logs ────────────────────────────────────────────────────────── */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {['all', ...TEMPLATES.map((t) => t.type)].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  filterType === f
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {f === 'all' ? 'Tous' : TEMPLATES.find((t) => t.type === f)?.label ?? f}
              </button>
            ))}
          </div>

          {loadingLogs ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Aucun e-mail envoyé pour le moment.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Destinataire</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Message ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {log.status === 'sent' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              log.status === 'sent' ? 'text-emerald-600' : 'text-red-500'
                            }`}
                          >
                            {log.status === 'sent' ? 'Envoyé' : 'Échec'}
                          </span>
                          {log.isTest && (
                            <Badge variant="outline" className="text-xs px-1 py-0 border-amber-300 text-amber-600 bg-amber-50">
                              test
                            </Badge>
                          )}
                        </div>
                        {log.error && (
                          <p className="text-xs text-red-400 mt-0.5 truncate max-w-[160px]">{log.error}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            log.type === 'welcome'
                              ? COLOR_MAP.emerald
                              : log.type === 'trial-started'
                              ? COLOR_MAP.blue
                              : COLOR_MAP.red
                          }`}
                        >
                          {TEMPLATES.find((t) => t.type === log.type)?.label ?? log.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-mono text-xs">{log.to}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                        {format(new Date(log.sentAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden lg:table-cell">
                        {log.messageId ? (
                          <span className="truncate block max-w-[160px]">{log.messageId}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <TabsContent value="stats">
          <div className="grid md:grid-cols-3 gap-4">
            {TEMPLATES.map((t) => {
              const sent = getCount(t.type, 'sent');
              const failed = getCount(t.type, 'failed');
              const total = sent + failed;
              const rate = total > 0 ? Math.round((sent / total) * 100) : 0;
              return (
                <Card key={t.type}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${COLOR_MAP[t.color]}`}>
                        {t.type}
                      </Badge>
                      {t.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Envoyés</span>
                      <span className="font-semibold text-emerald-600">{sent}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Échecs</span>
                      <span className="font-semibold text-red-500">{failed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Taux de succès</span>
                      <span className="font-bold text-slate-800">{rate}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{t.trigger}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
