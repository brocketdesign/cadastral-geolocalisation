import type { SearchHistoryItem, PlanType } from '@/types';

const HISTORY_KEY = 'cadastral_search_history';
const PLAN_KEY = 'cadastral_user_plan';
const MAX_HISTORY = 100;

export function getUserPlan(): PlanType {
  try {
    const plan = localStorage.getItem(PLAN_KEY);
    if (plan === 'pro' || plan === 'enterprise') return plan;
    return 'free';
  } catch {
    return 'free';
  }
}

export function setUserPlan(plan: PlanType): void {
  localStorage.setItem(PLAN_KEY, plan);
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: Omit<SearchHistoryItem, 'id' | 'timestamp' | 'isFavorite'>): SearchHistoryItem {
  const history = getSearchHistory();
  const newItem: SearchHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    isFavorite: false,
  };
  const updated = [newItem, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return newItem;
}

export function toggleFavorite(id: string): void {
  const history = getSearchHistory();
  const updated = history.map((item) =>
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function removeFromHistory(id: string): void {
  const history = getSearchHistory();
  const updated = history.filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function getFavorites(): SearchHistoryItem[] {
  return getSearchHistory().filter((item) => item.isFavorite);
}
