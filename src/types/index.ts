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
