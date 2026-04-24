import { Link, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Search,
  History,
  Star,
  Settings,
  Crown,
  Menu,
  X,
  Shield,
  BellRing,
  TrendingUp,
  Users,
  Megaphone,
  FileText,
  Building2,
  UserRound,
  Mail,
} from 'lucide-react';
import { useState } from 'react';
import { useUserPlan } from '@/hooks/use-user-plan';
import UpgradePromptBanner from '@/components/features/UpgradePromptBanner';
import AdminPanel from '@/components/features/AdminPanel';

/* ─── Nav sections ──────────────────────────────────────────── */

const SEARCH_ITEMS = [
  { to: '/dashboard', icon: Search, label: 'Recherche cadastrale' },
  { to: '/history', icon: History, label: 'Historique' },
  { to: '/favorites', icon: Star, label: 'Favoris' },
];

const ANALYSIS_ITEMS = [
  { to: '/risk-analysis', icon: Shield, label: 'Risk Score IA' },
  { to: '/comparison', icon: TrendingUp, label: 'Comparaison' },
  { to: '/alerts', icon: BellRing, label: 'Alertes Pro' },
];




export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();
  const { plan, isAdmin } = useUserPlan();

  const displayName =
    user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? 'Utilisateur';
  const planLabel =
    plan === 'enterprise'
      ? 'Plan Entreprise'
      : plan === 'pro'
      ? 'Plan Pro'
      : 'Plan Découverte';

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-400" />
            <span className="text-lg font-bold">
              Cada<span className="text-emerald-400">Stre</span>Map
            </span>
          </Link>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">

          {/* ── Recherche ── */}
          <div className="px-3 mb-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              Recherche
            </p>
          </div>
          {SEARCH_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {/* ── Analyse & Veille ── */}
          <div className="px-3 mt-5 mb-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              Analyse & Veille
            </p>
          </div>
          {ANALYSIS_ITEMS.filter((item) => item.to !== '/alerts' || isAdmin).map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {/* ── Rapports ── */}
          <div className="px-3 mt-5 mb-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              Rapports
            </p>
          </div>
          {/* "Générer un rapport" */}
          <Link
            to="/reports"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
              location.pathname === '/reports'
                ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Générer un rapport
          </Link>
          <Link
            to="/settings/agencies"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
              location.pathname === '/settings/agencies'
                ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Mes agences
          </Link>
          <Link
            to="/clients"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
              location.pathname === '/clients'
                ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserRound className="w-4 h-4" />
            Mes clients
          </Link>

          {/* ── Compte ── */}
          <div className="px-3 mt-5 mb-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              Compte
            </p>
          </div>
          {plan === 'free' && (
            <Link
              to="/pricing"
              className="flex items-center gap-3 px-6 py-2.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Passer en Pro
            </Link>
          )}
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors w-full ${
              location.pathname === '/settings'
                ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </Link>

          {/* ── Publicité ── */}
          <div className="px-3 mt-5 mb-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              Publicité
            </p>
          </div>
          <Link
            to="/advertise"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
              location.pathname === '/advertise'
                ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Faire de la publicité
          </Link>

          {isAdmin && (
            <>
              <div className="px-3 mt-6 mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
                  Administrateur
                </p>
              </div>
              <Link
                to="/admin/users"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                  location.pathname === '/admin/users'
                    ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Utilisateurs
              </Link>
              <Link
                to="/admin/ads"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                  location.pathname === '/admin/ads'
                    ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                Publicités
              </Link>
              <Link
                to="/admin/ad-requests"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                  location.pathname === '/admin/ad-requests'
                    ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Demandes pub
              </Link>
              <Link
                to="/admin/emails"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                  location.pathname === '/admin/emails'
                    ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Mail className="w-4 h-4" />
                Emails
              </Link>
            </>
          )}
        </nav>

        {/* User info via Clerk UserButton */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8 ring-2 ring-emerald-500/30',
                  userButtonPopoverCard: 'shadow-xl border border-slate-200 rounded-xl',
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">{planLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-4">
          <button
            className="lg:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {plan === 'free' && (
            <Link to="/pricing">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Crown className="w-4 h-4 mr-1" />
                Upgrade Pro
              </Button>
            </Link>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <UpgradePromptBanner />
          {children}
        </main>
      </div>

      {/* Admin panel – only visible for admin users */}
      <AdminPanel />
    </div>
  );
}
