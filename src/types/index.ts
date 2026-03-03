export interface ParcelleInfo {
  commune: string;
  section: string;
  numero: string;
  territoire: string;
}

export interface GeoResult {
  lat: number;
  lng: number;
  address: string;
  commune: string;
  section: string;
  numero: string;
  territoire: string;
  surface?: string;
  zonage?: string;
  polygon?: GeoJSON.Feature | null;
}

export interface SearchHistoryItem {
  id: string;
  parcelle: ParcelleInfo;
  result: GeoResult;
  timestamp: number;
  isFavorite: boolean;
}

export interface Territory {
  code: string;
  name: string;
  region: string;
  center: [number, number];
  zoom: number;
  flag: string;
}

export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PricingPlan {
  id: PlanType;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export type MapLayer = 'osm' | 'satellite' | 'cadastral';

/* ─── Foncier Risk Score ─── */

export interface RiskCategory {
  score: number;
  commentaire: string;
  [key: string]: unknown;
}

export interface RiskConstructibilite extends RiskCategory {
  zonePLU: string;
  cos: string;
}

export interface RiskInondation extends RiskCategory {
  zonePPRI: string;
}

export interface RiskSismique extends RiskCategory {
  zoneAlea: string;
}

export interface RiskLoiLittoral extends RiskCategory {
  applicable: boolean;
}

export interface RiskServitudes extends RiskCategory {
  types: string[];
}

export interface RiskMarcheFoncier {
  prixMoyenM2: string;
  tendance: 'HAUSSE' | 'STABLE' | 'BAISSE';
  commentaire: string;
}

export interface RiskUrbanisme {
  projetsProches: string[];
  tempsEstimePermis: string;
  commentaire: string;
}

export interface RiskAnalysisResult {
  id: string;
  parcelRef: string;
  commune: string;
  section: string;
  numero: string;
  territoire: string;
  surface: string | null;
  lat: number | null;
  lng: number | null;
  scoreGlobal: number;
  categorie: 'FAIBLE' | 'MODÉRÉ' | 'ÉLEVÉ' | 'CRITIQUE';
  constructibilite: RiskConstructibilite | null;
  risqueInondation: RiskInondation | null;
  risqueSismique: RiskSismique | null;
  risqueVolcanique: RiskCategory | null;
  loiLittoral: RiskLoiLittoral | null;
  servitudes: RiskServitudes | null;
  marcheFoncier: RiskMarcheFoncier | null;
  urbanisme: RiskUrbanisme | null;
  resumeIA: string;
  recommandations: string[];
  createdAt: number;
}

/* ─── Parcel Comparison ─── */

export interface ComparisonParcel {
  id: string;
  ref: string;
  territoire: string;
  commune: string;
  section: string;
  numero: string;
  lat: number;
  lng: number;
  surface: number; // m²
  surfaceConstructible: number; // m²
  prix: number; // €
  zonage: string;
  riskScore: number; // 0-100
  scoreGlobal: number; // 0-100
  cos: string;
  potentielSHON: number; // m² SHON
  prixMoyenM2Marche: number; // €/m² marché
  tendanceMarche: 'HAUSSE' | 'STABLE' | 'BAISSE';
  servitudes: string[];
  addedAt: number;
}

export type ComparisonWinnerKey =
  | 'meilleurPrixM2'
  | 'meilleureConstruction'
  | 'moinsDeRisques'
  | 'scoreGlobal';
