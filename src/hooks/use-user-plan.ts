/**
 * React hook that provides the current user's plan type.
 *
 * When logged in via Clerk the plan is read from user public metadata
 * (`plan` field). For anonymous visitors the plan always falls back to "free".
 */

import { useUser } from '@clerk/clerk-react';
import type { PlanType } from '@/types';

export function useUserPlan(): { plan: PlanType; isLoaded: boolean } {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return { plan: 'free', isLoaded: false };

  if (!user) return { plan: 'free', isLoaded: true };

  // Clerk publicMetadata is set server-side (e.g. via webhook after payment).
  const meta = user.publicMetadata as { plan?: string } | undefined;
  const plan = meta?.plan;

  if (plan === 'pro' || plan === 'enterprise') {
    return { plan, isLoaded: true };
  }

  return { plan: 'free', isLoaded: true };
}
