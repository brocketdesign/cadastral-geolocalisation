import type { ComparisonParcel, SearchHistoryItem } from '@/types';

const STORAGE_KEY = 'comparison_parcels';

// ─── Typical market price per m² by territory (rough estimates) ────────────
const PRICE_PER_M2: Record<string, number> = {
  '971': 85,
  '972': 90,
  '973': 60,
  '974': 95,
  '976': 50,
  '977': 280,
  '978': 180,
  metro: 200,
};

// ─── Persistence helpers ───────────────────────────────────────────────────

export function getStoredParcels(): ComparisonParcel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ComparisonParcel[]) : [];
  } catch {
    return [];
  }
}

export function storeParcels(parcels: ComparisonParcel[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parcels));
}

/** Returns false if the limit of 5 is reached or parcel already present. */
export function addParcelToStore(parcel: ComparisonParcel): boolean {
  const current = getStoredParcels();
  if (current.length >= 5) return false;
  if (current.some((p) => p.id === parcel.id)) return false;
  storeParcels([...current, parcel]);
  return true;
}

export function removeParcelFromStore(id: string): void {
  storeParcels(getStoredParcels().filter((p) => p.id !== id));
}

export function getStoredParcelCount(): number {
  return getStoredParcels().length;
}

// ─── SearchHistoryItem → ComparisonParcel conversion ──────────────────────

function parseSurface(surfaceStr?: string | null): number {
  if (!surfaceStr) return 800;
  const n = parseFloat(surfaceStr.replace(/[^0-9.]/g, ''));
  return isNaN(n) || n <= 0 ? 800 : n;
}

export function historyItemToComparisonParcel(item: SearchHistoryItem): ComparisonParcel {
  const surface = parseSurface(item.result.surface);
  const surfaceConstructible = Math.round(surface * 0.7);
  const basePrice = PRICE_PER_M2[item.result.territoire] ?? 100;
  const prix = Math.round(surface * basePrice * (0.85 + Math.random() * 0.3));
  const code = item.result.territoire;

  return {
    id: item.id,
    ref: `${code}-${item.result.commune.slice(0, 4).toUpperCase()}-${item.result.section}-${item.result.numero}`,
    territoire: code,
    commune: item.result.commune,
    section: item.result.section,
    numero: item.result.numero,
    lat: item.result.lat,
    lng: item.result.lng,
    surface,
    surfaceConstructible,
    prix,
    zonage: (item.result.zonage as string) || (['U', 'AU', 'A', 'N'][Math.floor(Math.random() * 4)] as string),
    riskScore: Math.floor(Math.random() * 55) + 5,
    scoreGlobal: Math.floor(Math.random() * 35) + 60,
    cos: (Math.random() * 0.25 + 0.2).toFixed(2),
    potentielSHON: Math.round(surfaceConstructible * (Math.random() * 0.2 + 0.25)),
    prixMoyenM2Marche: Math.round(basePrice * (0.95 + Math.random() * 0.2)),
    tendanceMarche: (['HAUSSE', 'STABLE', 'BAISSE'] as const)[Math.floor(Math.random() * 3)],
    servitudes: [],
    addedAt: Date.now(),
  };
}
