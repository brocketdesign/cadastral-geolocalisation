/**
 * React hook that provides the current user's plan type.
 *
 * When logged in via Clerk the plan is read from user public metadata
 * (`plan` field). For anonymous visitors the plan always falls back to "free".
 */

import { useUser } from '@clerk/clerk-react';
import type { PlanType } from '@/types';

export function useUserPlan(): { plan: PlanType; isAdmin: boolean; isLoaded: boolean } {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return { plan: 'free', isAdmin: false, isLoaded: false };

  if (!user) return { plan: 'free', isAdmin: false, isLoaded: true };

  // Clerk publicMetadata is set server-side (e.g. via webhook after payment).
  const meta = user.publicMetadata as { plan?: string; isAdmin?: boolean } | undefined;
  const plan = meta?.plan;
  const isAdmin = meta?.isAdmin === true;

  if (plan === 'pro' || plan === 'enterprise') {
    return { plan, isAdmin, isLoaded: true };
  }

  return { plan: 'free', isAdmin, isLoaded: true };
}
