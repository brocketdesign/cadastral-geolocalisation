/**
 * UpgradeGate – wraps any section that requires a paid plan.
 *
 * If the user's current plan doesn't satisfy the `requiredPlan`, a styled
 * overlay with an upgrade CTA is rendered instead of the children.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Lock, ArrowRight } from 'lucide-react';
import { useUserPlan } from '@/hooks/use-user-plan';
import type { PlanType } from '@/types';

const PLAN_RANK: Record<PlanType, number> = { free: 0, pro: 1, enterprise: 2 };

interface UpgradeGateProps {
  /** Minimum plan required to unlock this content */
  requiredPlan?: PlanType;
  /** Label shown before the CTA (default: generic message) */
  featureLabel?: string;
  /** If true → content is rendered but blurred with overlay */
  blurContent?: boolean;
  children: React.ReactNode;
}

export default function UpgradeGate({
  requiredPlan = 'pro',
  featureLabel,
  blurContent = false,
  children,
}: UpgradeGateProps) {
  const { isSignedIn } = useAuth();
  const { plan, isLoaded } = useUserPlan();

  // While Clerk is loading, render children normally to avoid flash
  if (!isLoaded) return <>{children}</>;

  // Unauthenticated users are always gated
  const hasAccess = isSignedIn && PLAN_RANK[plan] >= PLAN_RANK[requiredPlan];

  if (hasAccess) return <>{children}</>;

  const label =
    featureLabel ??
    `Cette fonctionnalité est réservée au plan ${requiredPlan === 'enterprise' ? 'Entreprise' : 'Pro'}.`;

  if (blurContent) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-60">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl">
          <UpgradeCard label={label} />
        </div>
      </div>
    );
  }

  return <UpgradeCard label={label} />;
}

/* ------------------------------------------------------------------ */

function UpgradeCard({ label }: { label: string }) {
  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-lg max-w-md mx-auto">
      <CardContent className="py-8 px-6 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <Lock className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Fonctionnalité verrouillée
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">{label}</p>
        <Link to="/pricing">
          <Button className="bg-emerald-600 hover:bg-emerald-700 mt-2">
            <Crown className="w-4 h-4 mr-2" />
            Voir les plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
