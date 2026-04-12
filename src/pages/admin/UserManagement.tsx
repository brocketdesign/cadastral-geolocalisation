import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Users, ShieldAlert, RefreshCw, Crown } from 'lucide-react';
import { toast } from 'sonner';
import type { PlanType } from '@/types';

interface UserRecord {
  clerkUserId: string;
  email: string;
  plan: PlanType;
  isAdmin?: boolean;
  updatedAt?: string;
}

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Découverte',
  pro: 'Pro',
  enterprise: 'Entreprise',
};

const PLAN_COLORS: Record<PlanType, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-emerald-100 text-emerald-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export default function UserManagement() {
  const { user } = useUser();
  const { isAdmin } = useUserPlan();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pendingPlans, setPendingPlans] = useState<Record<string, PlanType>>({});

  const adminUserId = user?.id;

  const fetchUsers = useCallback(async () => {
    if (!adminUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?adminUserId=${adminUserId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (err: unknown) {
      toast.error('Erreur lors du chargement des utilisateurs', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSavePlan = async (targetUserId: string) => {
    const newPlan = pendingPlans[targetUserId];
    if (!newPlan || !adminUserId) return;

    setSaving(targetUserId);
    try {
      const res = await fetch('/api/admin/update-user-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, targetUserId, plan: newPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers((prev) =>
        prev.map((u) => (u.clerkUserId === targetUserId ? { ...u, plan: newPlan } : u))
      );
      setPendingPlans((prev) => {
        const next = { ...prev };
        delete next[targetUserId];
        return next;
      });
      toast.success('Plan mis à jour avec succès');
    } catch (err: unknown) {
      toast.error('Erreur lors de la mise à jour', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    } finally {
      setSaving(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <ShieldAlert className="w-10 h-10" />
        <p className="text-sm font-medium">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Liste des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">
              Aucun utilisateur enregistré
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((u) => {
                const pendingPlan = pendingPlans[u.clerkUserId];
                const effectivePlan = pendingPlan ?? u.plan ?? 'free';
                const isDirty = !!pendingPlan;

                return (
                  <div
                    key={u.clerkUserId}
                    className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-slate-600">
                          {(u.email?.[0] ?? '?').toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{u.email ?? u.clerkUserId}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`text-[10px] border-0 ${PLAN_COLORS[u.plan ?? 'free']}`}>
                            {PLAN_LABELS[u.plan ?? 'free']}
                          </Badge>
                          {u.isAdmin && (
                            <Badge className="text-[10px] border-0 bg-violet-100 text-violet-700">
                              <Crown className="w-2.5 h-2.5 mr-0.5" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={effectivePlan}
                        onValueChange={(val) =>
                          setPendingPlans((prev) => ({
                            ...prev,
                            [u.clerkUserId]: val as PlanType,
                          }))
                        }
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">🆓 Découverte</SelectItem>
                          <SelectItem value="pro">⭐ Pro</SelectItem>
                          <SelectItem value="enterprise">🏢 Entreprise</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant={isDirty ? 'default' : 'outline'}
                        disabled={!isDirty || saving === u.clerkUserId}
                        onClick={() => handleSavePlan(u.clerkUserId)}
                        className={`h-8 text-xs ${isDirty ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      >
                        {saving === u.clerkUserId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Sauvegarder'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
