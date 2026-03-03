/**
 * UpgradePromptBanner – A persistent, dismissible banner shown to free-plan
 * users nudging them to upgrade. Use inside the dashboard layout.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Crown, X, Sparkles } from 'lucide-react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { getRemainingSearches } from '@/lib/usage-limits';

export default function UpgradePromptBanner() {
  const { isSignedIn } = useAuth();
  const { plan, isLoaded } = useUserPlan();
  const [dismissed, setDismissed] = useState(false);

  if (!isLoaded || dismissed) return null;
  if (!isSignedIn) return null;
  if (plan !== 'free') return null;

  const remaining = getRemainingSearches('free');

  return (
    <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl px-4 py-3 flex items-center gap-4 shadow-md">
      <Sparkles className="w-5 h-5 shrink-0 text-emerald-200" />
      <div className="flex-1 min-w-0 text-sm">
        <span className="font-semibold">Plan Découverte</span>
        {' — '}
        {remaining > 0 ? (
          <>
            Il vous reste{' '}
            <span className="font-bold">{remaining} recherche{remaining > 1 ? 's' : ''}</span>{' '}
            aujourd'hui.
          </>
        ) : (
          <span className="font-bold">Vous avez atteint la limite quotidienne.</span>
        )}{' '}
        Passez au Pro pour des recherches illimitées !
      </div>
      <Link to="/pricing" className="shrink-0">
        <Button
          size="sm"
          className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-sm"
        >
          <Crown className="w-4 h-4 mr-1" />
          Upgrade
        </Button>
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded hover:bg-emerald-700 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
