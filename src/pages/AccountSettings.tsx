import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Mail,
  Phone,
  Building2,
  Crown,
  Shield,
  Bell,
  Globe,
  Palette,
  Download,
  Trash2,
  KeyRound,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function AccountSettings() {
  const { user } = useUser();
  const { plan } = useUserPlan();

  // Local UI state (mock — no backend calls)
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifNewsletter, setNotifNewsletter] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState('fr');

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName ?? '';
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const avatarUrl = user?.imageUrl;

  const planLabel =
    plan === 'enterprise'
      ? 'Entreprise'
      : plan === 'pro'
      ? 'Pro'
      : 'Découverte';

  const planColor =
    plan === 'enterprise'
      ? 'bg-violet-100 text-violet-700'
      : plan === 'pro'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-slate-100 text-slate-600';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres du compte</h1>
        <p className="text-slate-500 mt-1">
          Gérez vos informations personnelles, votre abonnement et vos préférences.
        </p>
      </div>

      {/* ─── Profil ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            Profil
          </CardTitle>
          <CardDescription>
            Vos informations personnelles visibles sur la plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + name row */}
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
            </div>
            <Button variant="outline" size="sm" disabled>
              Modifier la photo
            </Button>
          </div>

          <Separator />

          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                placeholder="Prénom"
                defaultValue={user?.firstName ?? ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                placeholder="Nom"
                defaultValue={user?.lastName ?? ''}
                disabled
              />
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
              <Input id="phone" placeholder="+590 6 00 00 00 00" disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Société / Agence
            </Label>
            <Input id="company" placeholder="Nom de votre agence immobilière" disabled />
          </div>

          <div className="flex justify-end">
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled>
              Enregistrer les modifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Abonnement ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Abonnement
          </CardTitle>
          <CardDescription>
            Votre plan actuel et les options de facturation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Crown className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">Plan {planLabel}</p>
                  <Badge variant="secondary" className={planColor}>
                    {planLabel}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {plan === 'free'
                    ? '5 recherches / jour — France métropolitaine uniquement'
                    : plan === 'pro'
                    ? 'Recherches illimitées — Tous territoires'
                    : 'Recherches illimitées — Équipe jusqu\'à 10 utilisateurs'}
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
              <Button variant="outline" disabled>
                Gérer l'abonnement
              </Button>
            )}
          </div>

          {/* Billing info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Plan</p>
              <p className="text-lg font-bold text-slate-900">
                {plan === 'enterprise' ? '79€/mois' : plan === 'pro' ? '29€/mois' : 'Gratuit'}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Prochaine facture</p>
              <p className="text-lg font-bold text-slate-900">
                {plan === 'free' ? '—' : '1 avril 2026'}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Moyen de paiement</p>
              <p className="text-lg font-bold text-slate-900">
                {plan === 'free' ? '—' : '**** 4242'}
              </p>
            </div>
          </div>

          {plan !== 'free' && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              <button className="hover:underline" disabled>
                Télécharger la dernière facture (PDF)
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Notifications ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choisissez quelles notifications vous souhaitez recevoir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-900">Notifications par e-mail</p>
              <p className="text-xs text-slate-500">Recevoir un résumé de votre activité par e-mail.</p>
            </div>
            <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-900">Alertes foncières</p>
              <p className="text-xs text-slate-500">
                Être notifié lors de changements sur vos parcelles surveillées.
              </p>
            </div>
            <Switch checked={notifAlerts} onCheckedChange={setNotifAlerts} />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-900">Newsletter</p>
              <p className="text-xs text-slate-500">
                Recevoir les dernières actualités et mises à jour de CadaStreMap.
              </p>
            </div>
            <Switch checked={notifNewsletter} onCheckedChange={setNotifNewsletter} />
          </div>
        </CardContent>
      </Card>

      {/* ─── Préférences ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-600" />
            Préférences
          </CardTitle>
          <CardDescription>
            Personnalisez l'apparence et le comportement de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Langue
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Thème
              </Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
                <SelectTrigger>
                  <SelectValue placeholder="Thème" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Sécurité ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Gérez l'accès à votre compte et vos options de sécurité.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900">Mot de passe</p>
                <p className="text-xs text-slate-500">Dernière modification : inconnue</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Modifier
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Authentification à deux facteurs (2FA)
                </p>
                <p className="text-xs text-slate-500">
                  Ajoutez une couche de sécurité supplémentaire.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Non activée
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">Sessions actives</p>
                <p className="text-xs text-slate-500">1 session active — cet appareil</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Voir les sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Données & confidentialité ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            Données & confidentialité
          </CardTitle>
          <CardDescription>
            Exportez ou supprimez vos données personnelles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-900">Exporter mes données</p>
              <p className="text-xs text-slate-500">
                Téléchargez une copie de toutes vos données (historique, favoris, analyses).
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Download className="w-4 h-4 mr-1.5" />
              Exporter
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-red-600">Supprimer mon compte</p>
              <p className="text-xs text-slate-500">
                Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
