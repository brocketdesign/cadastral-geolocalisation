import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Search,
  History,
  Star,
  Settings,
  Crown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Search, label: 'Recherche' },
  { to: '/history', icon: History, label: 'Historique' },
  { to: '/favorites', icon: Star, label: 'Favoris' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:flex lg:flex-col ${
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

        <nav className="flex-1 py-4">
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              Navigation
            </p>
          </div>
          {NAV_ITEMS.map((item) => {
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

          <div className="px-3 mt-6 mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              Compte
            </p>
          </div>
          <Link
            to="/pricing"
            className="flex items-center gap-3 px-6 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Crown className="w-4 h-4" />
            Passer en Pro
          </Link>
          <button className="flex items-center gap-3 px-6 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full">
            <Settings className="w-4 h-4" />
            Paramètres
          </button>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Agent Demo</p>
              <p className="text-xs text-slate-500">Plan Découverte</p>
            </div>
            <button className="text-slate-500 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
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
          <Link to="/pricing">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Crown className="w-4 h-4 mr-1" />
              Upgrade Pro
            </Button>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
