import { useUser, useSessionList, useClerk } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  Building2,
  Crown,
  Shield,
  Bell,
  Globe,
  Download,
  Trash2,
  KeyRound,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Monitor,
  LogOut,
  Copy,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/* ─── helpers ─────────────────────────────────────────────── */

function formatDate(d: Date | null | undefined) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d instanceof Date ? d : new Date(d));
}

/* ─── Notification prefs (persist in localStorage) ───────── */

const NOTIF_KEY = 'cadastra_notif_prefs';
function loadNotifPrefs() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return JSON.parse(raw) as NotifPrefs;
  } catch {}
  return defaultNotifPrefs;
}
function saveNotifPrefs(prefs: NotifPrefs) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
}

interface NotifPrefs {
  email: boolean;
  alerts: boolean;
  newsletter: boolean;
  weeklyReport: boolean;
  marketing: boolean;
  push: boolean;
}

const defaultNotifPrefs: NotifPrefs = {
  email: true,
  alerts: true,
  newsletter: false,
  weeklyReport: true,
  marketing: false,
  push: false,
};

/* ══════════════════════════════════════════════════════════ */

export default function AccountSettings() {
  const { user, isLoaded } = useUser();
  const { plan } = useUserPlan();
  const { sessions, isLoaded: sessionsLoaded } = useSessionList();
  const clerk = useClerk();
  const navigate = useNavigate();

  /* ── Notifications ── */
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs);

  function toggleNotif(key: keyof NotifPrefs) {
    setNotifPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleSaveNotifs() {
    saveNotifPrefs(notifPrefs);
    toast.success('Préférences de notifications enregistrées.');
  }

  /* ── Password change ── */
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  async function handleChangePassword() {
    if (newPwd.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setPwdLoading(true);
    try {
      await user!.updatePassword({ currentPassword: currentPwd, newPassword: newPwd });
      toast.success('Mot de passe modifié avec succès.');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message: string }> })?.errors?.[0]?.message;
      toast.error(msg ?? 'Erreur lors de la modification du mot de passe.');
    } finally {
      setPwdLoading(false);
    }
  }

  /* ── 2FA (TOTP) ── */
  const [totpDialogOpen, setTotpDialogOpen] = useState(false);
  const [totpStep, setTotpStep] = useState<'setup' | 'verify' | 'done'>('setup');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [disable2faDialogOpen, setDisable2faDialogOpen] = useState(false);

  const totpEnabled = user?.totpEnabled ?? false;

  async function handleSetup2FA() {
    setTotpLoading(true);
    try {
      const totp = await user!.createTOTP();
      setTotpSecret(totp.secret ?? '');
      setTotpUri(totp.uri ?? '');
      setTotpStep('setup');
      setTotpDialogOpen(true);
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message: string }> })?.errors?.[0]?.message;
      toast.error(msg ?? 'Erreur lors de l\'initialisation du 2FA.');
    } finally {
      setTotpLoading(false);
    }
  }

  async function handleVerifyTOTP() {
    if (totpCode.length !== 6) {
      toast.error('Le code doit contenir 6 chiffres.');
      return;
    }
    setTotpLoading(true);
    try {
      await user!.verifyTOTP({ code: totpCode });
      setTotpStep('done');
      toast.success('Authentification à deux facteurs activée !');
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message: string }> })?.errors?.[0]?.message;
      toast.error(msg ?? 'Code invalide. Veuillez réessayer.');
    } finally {
      setTotpLoading(false);
    }
  }

  async function handleDisable2FA() {
    setTotpLoading(true);
    try {
      await user!.disableTOTP();
      setDisable2faDialogOpen(false);
      toast.success('Authentification à deux facteurs désactivée.');
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message: string }> })?.errors?.[0]?.message;
      toast.error(msg ?? 'Erreur lors de la désactivation du 2FA.');
    } finally {
      setTotpLoading(false);
    }
  }

  /* ── Sessions ── */
  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);

  async function handleRevokeSession(sessionId: string) {
    setRevokeLoadingId(sessionId);
    try {
      await clerk.signOut({ sessionId });
      toast.success('Session révoquée.');
    } catch {
      toast.error('Impossible de révoquer cette session.');
    } finally {
      setRevokeLoadingId(null);
    }
  }

  /* ── Data export ── */
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = useCallback(async () => {
    if (!user) return;
    setExportLoading(true);
    try {
      const [historyRes, favRes] = await Promise.allSettled([
        fetch(`/api/history?userId=${encodeURIComponent(user.id)}`),
        fetch(`/api/favorites?userId=${encodeURIComponent(user.id)}`),
      ]);

      const history =
        historyRes.status === 'fulfilled' && historyRes.value.ok
          ? await historyRes.value.json()
          : [];
      const favorites =
        favRes.status === 'fulfilled' && favRes.value.ok
          ? await favRes.value.json()
          : [];

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.emailAddresses?.[0]?.emailAddress,
          createdAt: user.createdAt,
        },
        plan,
        history,
        favorites,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cadastra-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé avec succès.');
    } catch {
      toast.error('Erreur lors de l\'export des données.');
    } finally {
      setExportLoading(false);
    }
  }, [user, plan]);

  /* ── Delete account ── */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'SUPPRIMER') return;
    setDeleteLoading(true);
    try {
      await user!.delete();
      await clerk.signOut();
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message: string }> })?.errors?.[0]?.message;
      toast.error(msg ?? 'Erreur lors de la suppression du compte.');
      setDeleteLoading(false);
    }
  }

  /* ── Derived ── */
  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName ?? '';
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const avatarUrl = user?.imageUrl;

  const planLabel =
    plan === 'enterprise' ? 'Entreprise' : plan === 'pro' ? 'Pro' : 'Découverte';

  const planColor =
    plan === 'enterprise'
      ? 'bg-violet-100 text-violet-700'
      : plan === 'pro'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-slate-100 text-slate-600';

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres du compte</h1>
        <p className="text-slate-500 mt-1">
          Gérez votre profil, abonnement, sécurité et confidentialité.
        </p>
      </div>

      <Tabs defaultValue="profil" className="space-y-6">
        {/* ── Tab navigation ── */}
        <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 p-1 w-full justify-start">
          <TabsTrigger value="profil" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <User className="w-3.5 h-3.5" /> Profil
          </TabsTrigger>
          <TabsTrigger value="abonnement" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <CreditCard className="w-3.5 h-3.5" /> Abonnement
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Bell className="w-3.5 h-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="securite" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Shield className="w-3.5 h-3.5" /> Sécurité
          </TabsTrigger>
          <TabsTrigger value="donnees" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Download className="w-3.5 h-3.5" /> Données
          </TabsTrigger>
        </TabsList>

        {/* ════════════════ PROFIL ════════════════ */}
        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Profil
              </CardTitle>
              <CardDescription>
                Vos informations personnelles gérées via votre compte Clerk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar + name */}
              <div className="flex items-center gap-5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full ring-2 ring-emerald-500/30 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-7 h-7 text-emerald-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-lg">{displayName || 'Utilisateur'}</p>
                  <p className="text-sm text-slate-500">{email}</p>
                  <Badge variant="secondary" className={`mt-1 ${planColor}`}>
                    {planLabel}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" defaultValue={user?.firstName ?? ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" defaultValue={user?.lastName ?? ''} disabled />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Adresse e-mail
                  </Label>
                  <Input id="email" defaultValue={email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Téléphone
                  </Label>
                  <Input id="phone" placeholder="+33 6 00 00 00 00" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Société / Agence
                </Label>
                <Input id="company" placeholder="Nom de votre agence" disabled />
              </div>
              <p className="text-xs text-slate-400">
                Pour modifier votre nom ou votre e-mail, utilisez le bouton de profil Clerk en haut à droite.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════ ABONNEMENT ════════════════ */}
        <TabsContent value="abonnement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Abonnement
              </CardTitle>
              <CardDescription>
                Plan actuel, facturation et gestion de votre abonnement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan banner */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">Plan {planLabel}</p>
                      <Badge variant="secondary" className={planColor}>{planLabel}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {plan === 'free'
                        ? '5 recherches / jour — France métropolitaine uniquement'
                        : plan === 'pro'
                        ? 'Recherches illimitées — Tous territoires'
                        : "Recherches illimitées — Équipe jusqu'à 10 utilisateurs"}
                    </p>
                  </div>
                </div>
                {plan === 'free' ? (
                  <Link to="/pricing">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Crown className="w-4 h-4 mr-1.5" />
                      Passer en Pro
                    </Button>
                  </Link>
                ) : (
                  <Link to="/pricing">
                    <Button variant="outline">
                      <CreditCard className="w-4 h-4 mr-1.5" />
                      Gérer l'abonnement
                    </Button>
                  </Link>
                )}
              </div>

              {/* Billing details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Plan</p>
                  <p className="text-lg font-bold text-slate-900">
                    {plan === 'enterprise' ? '79 €/mois' : plan === 'pro' ? '29 €/mois' : 'Gratuit'}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Prochaine facture</p>
                  <p className="text-lg font-bold text-slate-900">
                    {plan === 'free' ? '—' : '1 mai 2026'}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Paiement</p>
                  <p className="text-lg font-bold text-slate-900">
                    {plan === 'free' ? '—' : '**** 4242'}
                  </p>
                </div>
              </div>

              {/* Included features */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Fonctionnalités incluses</p>
                <div className="space-y-2">
                  {[
                    { label: 'Recherche cadastrale', active: true },
                    { label: 'Historique des recherches', active: true },
                    { label: 'Favoris', active: true },
                    { label: 'Analyse de risque foncier', active: plan !== 'free' },
                    { label: 'Comparaison de parcelles', active: plan !== 'free' },
                    { label: 'Alertes foncières', active: plan !== 'free' },
                    { label: 'Gestion d\'équipe', active: plan === 'enterprise' },
                    { label: 'Export PDF avancé', active: plan !== 'free' },
                  ].map(({ label, active }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      {active ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
                      )}
                      <span className={active ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
                      {!active && (
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-200 ml-auto">
                          Non inclus
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {plan !== 'free' && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <FileText className="w-4 h-4" />
                    <button
                      className="hover:underline hover:text-slate-700 transition-colors"
                      onClick={() => toast.info('La fonctionnalité de téléchargement de factures sera disponible prochainement.')}
                    >
                      Télécharger la dernière facture (PDF)
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════ NOTIFICATIONS ════════════════ */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Notifications
              </CardTitle>
              <CardDescription>
                Choisissez les notifications que vous souhaitez recevoir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                {
                  key: 'email' as const,
                  label: 'Notifications par e-mail',
                  desc: 'Recevoir un résumé hebdomadaire de votre activité par e-mail.',
                },
                {
                  key: 'alerts' as const,
                  label: 'Alertes foncières',
                  desc: 'Être notifié des changements sur vos parcelles surveillées.',
                },
                {
                  key: 'weeklyReport' as const,
                  label: 'Rapport hebdomadaire',
                  desc: 'Recevoir chaque lundi un rapport de vos analyses et recherches.',
                },
                {
                  key: 'push' as const,
                  label: 'Notifications push',
                  desc: 'Recevoir des notifications dans votre navigateur en temps réel.',
                },
                {
                  key: 'newsletter' as const,
                  label: 'Newsletter CadaStreMap',
                  desc: "Recevoir les actualités et mises à jour de la plateforme.",
                },
                {
                  key: 'marketing' as const,
                  label: 'Offres et promotions',
                  desc: 'Être informé des offres spéciales et nouvelles fonctionnalités.',
                },
              ].map(({ key, label, desc }, i, arr) => (
                <div key={key}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[key]}
                      onCheckedChange={() => toggleNotif(key)}
                    />
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveNotifs}>
                  Enregistrer les préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════ SÉCURITÉ ════════════════ */}
        <TabsContent value="securite" className="space-y-6">
          {/* Change password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                Modifier le mot de passe
              </CardTitle>
              <CardDescription>
                {user?.passwordEnabled
                  ? 'Choisissez un mot de passe fort d\'au moins 8 caractères.'
                  : 'Votre compte utilise une connexion OAuth (Google, etc.) — aucun mot de passe à gérer.'}
              </CardDescription>
            </CardHeader>
            {user?.passwordEnabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPwd">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPwd"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowCurrent((s) => !s)}
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPwd">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPwd"
                      type={showNew ? 'text' : 'password'}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowNew((s) => !s)}
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPwd.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {[8, 12, 16].map((len) => (
                        <div
                          key={len}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            newPwd.length >= len ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-1">
                        {newPwd.length < 8 ? 'Trop court' : newPwd.length < 12 ? 'Correct' : 'Fort'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPwd">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirmPwd"
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {confirmPwd.length > 0 && newPwd !== confirmPwd && (
                    <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleChangePassword}
                    disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
                  >
                    {pwdLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    Modifier le mot de passe
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 2FA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                Authentification à deux facteurs (2FA)
              </CardTitle>
              <CardDescription>
                Protégez votre compte avec une application d'authentification (Google Authenticator, Authy…).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {totpEnabled ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {totpEnabled ? '2FA activée' : '2FA non activée'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {totpEnabled
                        ? 'Votre compte est protégé par une application d\'authentification.'
                        : 'Ajoutez une couche de sécurité supplémentaire à votre compte.'}
                    </p>
                  </div>
                </div>
                {totpEnabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setDisable2faDialogOpen(true)}
                  >
                    Désactiver
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSetup2FA}
                    disabled={totpLoading}
                  >
                    {totpLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    Activer le 2FA
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-emerald-600" />
                Sessions actives
              </CardTitle>
              <CardDescription>
                Appareils et navigateurs conectés à votre compte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!sessionsLoaded ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                </div>
              ) : sessions && sessions.length > 0 ? (
                sessions
                  .filter((s) => s.status === 'active')
                  .map((session, i) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Session {i + 1}
                            {i === 0 && (
                              <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-xs">
                                Actuelle
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            Dernière activité : {formatDate(session.lastActiveAt)}
                          </p>
                        </div>
                      </div>
                      {i !== 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokeLoadingId === session.id}
                        >
                          {revokeLoadingId === session.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                          <span className="ml-1">Révoquer</span>
                        </Button>
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-slate-500">Aucune session active trouvée.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════ DONNÉES ════════════════ */}
        <TabsContent value="donnees" className="space-y-6">
          {/* Preferences display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Préférences actives
              </CardTitle>
              <CardDescription>
                Aperçu de vos préférences de langue, thème et notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Notifications activées</p>
                  <div className="space-y-1">
                    {Object.entries(notifPrefs)
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <div key={k} className="flex items-center gap-1.5 text-sm text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {{
                            email: 'Notifications e-mail',
                            alerts: 'Alertes foncières',
                            newsletter: 'Newsletter',
                            weeklyReport: 'Rapport hebdomadaire',
                            marketing: 'Offres et promotions',
                            push: 'Notifications push',
                          }[k] ?? k}
                        </div>
                      ))}
                    {Object.values(notifPrefs).every((v) => !v) && (
                      <p className="text-sm text-slate-400">Aucune notification activée.</p>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Notifications désactivées</p>
                  <div className="space-y-1">
                    {Object.entries(notifPrefs)
                      .filter(([, v]) => !v)
                      .map(([k]) => (
                        <div key={k} className="flex items-center gap-1.5 text-sm text-slate-400">
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0" />
                          {{
                            email: 'Notifications e-mail',
                            alerts: 'Alertes foncières',
                            newsletter: 'Newsletter',
                            weeklyReport: 'Rapport hebdomadaire',
                            marketing: 'Offres et promotions',
                            push: 'Notifications push',
                          }[k] ?? k}
                        </div>
                      ))}
                    {Object.values(notifPrefs).every((v) => v) && (
                      <p className="text-sm text-slate-400">Toutes les notifications sont activées.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                Exporter mes données
              </CardTitle>
              <CardDescription>
                Téléchargez une copie de votre profil, historique de recherches et favoris au format JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">Archive de données personnelles</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Profil, historique, favoris — conforme RGPD
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1.5" />
                  )}
                  {exportLoading ? 'Export en cours…' : 'Exporter'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete account */}
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Supprimer mon compte
              </CardTitle>
              <CardDescription>
                Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-100 bg-red-50/50">
                <div>
                  <p className="text-sm font-medium text-red-700">Supprimer définitivement ce compte</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Profil, historique, favoris et abonnement seront supprimés.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ════ 2FA setup dialog ════ */}
      <Dialog open={totpDialogOpen} onOpenChange={setTotpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {totpStep === 'done' ? '2FA activée !' : 'Configurer le 2FA'}
            </DialogTitle>
            <DialogDescription>
              {totpStep === 'setup' &&
                'Ouvrez votre application d\'authentification et ajoutez un compte manuellement.'}
              {totpStep === 'verify' &&
                'Entrez le code à 6 chiffres affiché dans votre application.'}
              {totpStep === 'done' &&
                'L\'authentification à deux facteurs est maintenant active sur votre compte.'}
            </DialogDescription>
          </DialogHeader>

          {totpStep === 'setup' && (
            <div className="space-y-4">
              {totpUri && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1 font-medium">Lien d'authentification</p>
                  <a
                    href={totpUri}
                    className="text-xs text-emerald-600 hover:underline break-all"
                  >
                    {totpUri}
                  </a>
                  <p className="text-xs text-slate-400 mt-1">
                    Sur mobile : appuyez sur ce lien pour l'ouvrir directement dans votre app.
                  </p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1 font-medium">Clé secrète (entrée manuelle)</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-slate-800 flex-1 break-all">{totpSecret}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(totpSecret);
                      toast.success('Clé copiée dans le presse-papiers.');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Dans votre app (Google Authenticator, Authy, etc.) : « + » → « Entrer une clé » → coller la clé ci-dessus.
              </p>
            </div>
          )}

          {totpStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totpCode">Code de vérification</Label>
                <Input
                  id="totpCode"
                  placeholder="123456"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-xl tracking-widest"
                />
              </div>
            </div>
          )}

          {totpStep === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-600 text-center">
                Votre compte est maintenant protégé par un second facteur d'authentification.
              </p>
            </div>
          )}

          <DialogFooter>
            {totpStep === 'setup' && (
              <>
                <Button variant="outline" onClick={() => setTotpDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setTotpStep('verify')}
                >
                  J'ai ajouté le compte →
                </Button>
              </>
            )}
            {totpStep === 'verify' && (
              <>
                <Button variant="outline" onClick={() => setTotpStep('setup')}>
                  Retour
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleVerifyTOTP}
                  disabled={totpLoading || totpCode.length !== 6}
                >
                  {totpLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Vérifier
                </Button>
              </>
            )}
            {totpStep === 'done' && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 w-full"
                onClick={() => { setTotpDialogOpen(false); setTotpStep('setup'); }}
              >
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Disable 2FA dialog ════ */}
      <AlertDialog open={disable2faDialogOpen} onOpenChange={setDisable2faDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver le 2FA ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre compte sera moins sécurisé sans l'authentification à deux facteurs.
              Êtes-vous sûr de vouloir la désactiver ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDisable2FA}
            >
              {totpLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Désactiver quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ════ Delete account dialog ════ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(o) => { setDeleteDialogOpen(o); if (!o) setDeleteConfirmText(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Supprimer définitivement votre compte ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Cette action est <strong>irréversible</strong>. Votre profil, tout votre historique, vos
                favoris et votre abonnement seront supprimés immédiatement.
              </span>
              <span className="block mt-2">
                Tapez <strong>SUPPRIMER</strong> pour confirmer :
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="border-red-200 focus-visible:ring-red-400"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'SUPPRIMER' || deleteLoading}
            >
              {deleteLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

