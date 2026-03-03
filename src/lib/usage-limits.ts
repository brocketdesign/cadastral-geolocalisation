/**
 * Free-plan usage limits & gate helpers.
 *
 * Daily search count is tracked in localStorage and resets at midnight.
 * Plan type is derived from Clerk user metadata when available, falling
 * back to localStorage for unauthenticated visitors.
 */

import type { PlanType } from '@/types';

const DAILY_SEARCH_KEY = 'cadastral_daily_searches';
const DAILY_ANALYSIS_KEY = 'cadastral_daily_analyses';
const PLAN_META_KEY = 'cadastral_user_plan';

/* ------------------------------------------------------------------ */
/*  Plan limits                                                        */
/* ------------------------------------------------------------------ */

interface PlanLimits {
  maxDailySearches: number;
  maxDailyAnalyses: number;
  canAccessHistory: boolean;
  canAccessFavorites: boolean;
  canExportPDF: boolean;
  canBatchSearch: boolean;
  canUseSatelliteView: boolean;
  canAccessAllTerritories: boolean;
  showAds: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxDailySearches: 5,
    maxDailyAnalyses: 1,
    canAccessHistory: false,
    canAccessFavorites: false,
    canExportPDF: false,
    canBatchSearch: false,
    canUseSatelliteView: false,
    canAccessAllTerritories: false,
    showAds: true,
  },
  pro: {
    maxDailySearches: Infinity,
    maxDailyAnalyses: Infinity,
    canAccessHistory: true,
    canAccessFavorites: true,
    canExportPDF: true,
    canBatchSearch: true,
    canUseSatelliteView: true,
    canAccessAllTerritories: true,
    showAds: false,
  },
  enterprise: {
    maxDailySearches: Infinity,
    maxDailyAnalyses: Infinity,
    canAccessHistory: true,
    canAccessFavorites: true,
    canExportPDF: true,
    canBatchSearch: true,
    canUseSatelliteView: true,
    canAccessAllTerritories: true,
    showAds: false,
  },
};

/* ------------------------------------------------------------------ */
/*  Daily search tracker                                               */
/* ------------------------------------------------------------------ */

interface DailyTracker {
  date: string;   // YYYY-MM-DD
  count: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTracker(): DailyTracker {
  try {
    const raw = localStorage.getItem(DAILY_SEARCH_KEY);
    if (raw) {
      const data: DailyTracker = JSON.parse(raw);
      if (data.date === todayKey()) return data;
    }
  } catch {
    // corrupted – ignore
  }
  return { date: todayKey(), count: 0 };
}

function saveTracker(tracker: DailyTracker) {
  localStorage.setItem(DAILY_SEARCH_KEY, JSON.stringify(tracker));
}

export function getDailySearchCount(): number {
  return getTracker().count;
}

export function incrementDailySearch(): number {
  const tracker = getTracker();
  tracker.count += 1;
  saveTracker(tracker);
  return tracker.count;
}

export function getRemainingSearches(plan: PlanType): number {
  const limits = PLAN_LIMITS[plan];
  if (limits.maxDailySearches === Infinity) return Infinity;
  return Math.max(0, limits.maxDailySearches - getDailySearchCount());
}

export function canSearch(plan: PlanType): boolean {
  return getRemainingSearches(plan) > 0;
}

/* ------------------------------------------------------------------ */
/*  Daily analysis tracker                                             */
/* ------------------------------------------------------------------ */

function getAnalysisTracker(): DailyTracker {
  try {
    const raw = localStorage.getItem(DAILY_ANALYSIS_KEY);
    if (raw) {
      const data: DailyTracker = JSON.parse(raw);
      if (data.date === todayKey()) return data;
    }
  } catch {
    // corrupted – ignore
  }
  return { date: todayKey(), count: 0 };
}

function saveAnalysisTracker(tracker: DailyTracker) {
  localStorage.setItem(DAILY_ANALYSIS_KEY, JSON.stringify(tracker));
}

export function getDailyAnalysisCount(): number {
  return getAnalysisTracker().count;
}

export function incrementDailyAnalysis(): number {
  const tracker = getAnalysisTracker();
  tracker.count += 1;
  saveAnalysisTracker(tracker);
  return tracker.count;
}

export function getRemainingAnalyses(plan: PlanType): number {
  const limits = PLAN_LIMITS[plan];
  if (limits.maxDailyAnalyses === Infinity) return Infinity;
  return Math.max(0, limits.maxDailyAnalyses - getDailyAnalysisCount());
}

export function canAnalyze(plan: PlanType): boolean {
  return getRemainingAnalyses(plan) > 0;
}

/* ------------------------------------------------------------------ */
/*  Plan helpers (localStorage fallback)                               */
/* ------------------------------------------------------------------ */

export function getStoredPlan(): PlanType {
  try {
    const p = localStorage.getItem(PLAN_META_KEY);
    if (p === 'pro' || p === 'enterprise') return p;
  } catch {
    // ignore
  }
  return 'free';
}

export function setStoredPlan(plan: PlanType): void {
  localStorage.setItem(PLAN_META_KEY, plan);
}
