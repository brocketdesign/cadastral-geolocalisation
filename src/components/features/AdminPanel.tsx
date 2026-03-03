import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Settings, Crown, Check, Loader2, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserPlan } from '@/hooks/use-user-plan';
import type { PlanType } from '@/types';
import { toast } from 'sonner';

const ADMIN_EMAILS = ['nahomaho191@gmail.com'];

const PLAN_OPTIONS: { value: PlanType; label: string; icon: string }[] = [
  { value: 'free', label: 'Découverte (Gratuit)', icon: '🆓' },
  { value: 'pro', label: 'Pro', icon: '⭐' },
  { value: 'enterprise', label: 'Entreprise', icon: '🏢' },
];

export default function AdminPanel() {
  const { user } = useUser();
  const { plan } = useUserPlan();
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Only show for admin users
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email || !ADMIN_EMAILS.includes(email)) return null;

  const handlePlanChange = async (newPlan: PlanType) => {
    if (newPlan === plan) {
      toast.info('Vous êtes déjà sur ce plan.');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/admin/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userId: user?.id,
          plan: newPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      toast.success(`Plan mis à jour : ${newPlan.toUpperCase()}`, {
        description: 'Rechargement pour appliquer les changements...',
      });

      // Reload to reflect the Clerk metadata change
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Échec de la mise à jour', { description: message });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* Floating gear button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-700 transition-all duration-200 flex items-center justify-center group hover:scale-110"
        title="Panneau Admin"
      >
        <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : 'group-hover:rotate-45'}`} />
      </button>

      {/* Admin panel overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-sm">Panneau Admin</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User info */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-xs text-slate-500">Connecté en tant que</p>
              <p className="text-sm font-medium text-slate-900 truncate">{email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Crown className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-600">
                  Plan actuel : {plan === 'enterprise' ? 'Entreprise' : plan === 'pro' ? 'Pro' : 'Découverte'}
                </span>
              </div>
            </div>

            {/* Plan changer */}
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Changer de plan
              </h3>
              <div className="space-y-2">
                {PLAN_OPTIONS.map((option) => {
                  const isActive = option.value === plan;
                  return (
                    <Button
                      key={option.value}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      disabled={updating}
                      onClick={() => handlePlanChange(option.value)}
                      className={`w-full justify-between h-10 ${
                        isActive
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </span>
                      {isActive && <Check className="w-4 h-4" />}
                      {updating && !isActive && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
              <p className="text-[10px] text-slate-400 text-center">
                Outils réservés aux administrateurs · Modifications appliquées en base de données
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
