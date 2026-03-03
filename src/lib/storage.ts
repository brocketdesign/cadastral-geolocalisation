import type { SearchHistoryItem, PlanType } from '@/types';

const API_BASE = '/api';

// ─── User Plan ───────────────────────────────────────────────

export async function getUserPlan(): Promise<PlanType> {
  try {
    const res = await fetch(`${API_BASE}/plan`);
    if (!res.ok) return 'free';
    const data = await res.json();
    if (data.plan === 'pro' || data.plan === 'enterprise') return data.plan;
    return 'free';
  } catch {
    return 'free';
  }
}

export async function setUserPlan(plan: PlanType): Promise<void> {
  await fetch(`${API_BASE}/plan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
}

// ─── Search History ──────────────────────────────────────────

export async function getSearchHistory(): Promise<SearchHistoryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addToHistory(
  item: Omit<SearchHistoryItem, 'id' | 'timestamp' | 'isFavorite'>
): Promise<SearchHistoryItem> {
  const res = await fetch(`${API_BASE}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return await res.json();
}

export async function toggleFavorite(id: string): Promise<void> {
  await fetch(`${API_BASE}/history/${id}/favorite`, {
    method: 'PATCH',
  });
}

export async function removeFromHistory(id: string): Promise<void> {
  await fetch(`${API_BASE}/history/${id}`, {
    method: 'DELETE',
  });
}

export async function clearHistory(): Promise<void> {
  await fetch(`${API_BASE}/history`, {
    method: 'DELETE',
  });
}

export async function getFavorites(): Promise<SearchHistoryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/favorites`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
