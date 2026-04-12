/**
 * React hook that provides the current user's plan type and admin status.
 *
 * The plan and isAdmin flag are fetched from MongoDB via /api/users/me
 * so they are always in sync with the server-side source of truth.
 */

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import type { PlanType } from '@/types';

export function useUserPlan(): { plan: PlanType; isAdmin: boolean; isLoaded: boolean } {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [plan, setPlan] = useState<PlanType>('free');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!clerkLoaded) return;

    if (!user) {
      setPlan('free');
      setIsAdmin(false);
      setIsLoaded(true);
      return;
    }

    fetch(`/api/users/me?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const p = data.plan;
        setPlan(p === 'pro' || p === 'enterprise' ? p : 'free');
        setIsAdmin(data.isAdmin === true);
      })
      .catch(() => {
        // Fallback to Clerk publicMetadata if the API is unreachable
        const meta = user.publicMetadata as { plan?: string; isAdmin?: boolean } | undefined;
        const p = meta?.plan;
        setPlan(p === 'pro' || p === 'enterprise' ? p : 'free');
        setIsAdmin(meta?.isAdmin === true);
      })
      .finally(() => setIsLoaded(true));
  }, [clerkLoaded, user]);

  return { plan, isAdmin, isLoaded };
}
