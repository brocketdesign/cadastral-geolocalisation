import type { Territory } from '@/types';

export const CARIBBEAN_TERRITORIES: Territory[] = [
  {
    code: '971',
    name: 'Guadeloupe',
    region: 'Antilles françaises',
    center: [16.265, -61.551],
    zoom: 10,
    flag: '🇬🇵',
  },
  {
    code: '972',
    name: 'Martinique',
    region: 'Antilles françaises',
    center: [14.641, -61.024],
    zoom: 11,
    flag: '🇲🇶',
  },
  {
    code: '973',
    name: 'Guyane',
    region: 'Amérique du Sud',
    center: [3.934, -53.126],
    zoom: 7,
    flag: '🇬🇫',
  },
  {
    code: '974',
    name: 'La Réunion',
    region: 'Océan Indien',
    center: [-21.115, 55.536],
    zoom: 10,
    flag: '🇷🇪',
  },
  {
    code: '976',
    name: 'Mayotte',
    region: 'Océan Indien',
    center: [-12.827, 45.166],
    zoom: 11,
    flag: '🇾🇹',
  },
  {
    code: '977',
    name: 'Saint-Barthélemy',
    region: 'Antilles françaises',
    center: [17.896, -62.849],
    zoom: 14,
    flag: '🇧🇱',
  },
  {
    code: '978',
    name: 'Saint-Martin',
    region: 'Antilles françaises',
    center: [18.075, -63.06],
    zoom: 13,
    flag: '🇲🇫',
  },
  {
    code: 'metro',
    name: 'France métropolitaine',
    region: 'Métropole',
    center: [46.603, 2.209],
    zoom: 6,
    flag: '🇫🇷',
  },
];

export function getTerritoryByCode(code: string): Territory | undefined {
  return CARIBBEAN_TERRITORIES.find((t) => t.code === code);
}

export function getApiUrlForTerritory(
  commune: string,
  territoryCode: string
): string {
  // L'API adresse.data.gouv.fr couvre la France entière y compris les DOM-TOM
  const territory = getTerritoryByCode(territoryCode);
  const region = territory ? territory.name : '';
  const query = region && territoryCode !== 'metro'
    ? `${commune}, ${region}`
    : `${commune}, France`;
  return `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=5`;
}

/**
 * Resolve a commune name to its INSEE code using api-adresse.data.gouv.fr
 */
export async function resolveCodeInsee(
  commune: string,
  territoryCode: string
): Promise<{ codeInsee: string; cityName: string } | null> {
  const url = getApiUrlForTerritory(commune, territoryCode);
  const response = await fetch(url);
  const data = await response.json();

  if (data.features && data.features.length > 0) {
    const props = data.features[0].properties;
    return {
      codeInsee: props.citycode || props.id,
      cityName: props.city || props.name || commune,
    };
  }
  return null;
}

/**
 * Query the IGN cadastral API to get the actual parcel geometry.
 * Uses apicarto.ign.fr/api/cadastre/parcelle with code_insee, section, and numero.
 */
export async function fetchCadastralParcel(
  codeInsee: string,
  section: string,
  numero: string
): Promise<{ feature: any; centroid: [number, number]; contenance: number | null } | null> {
  // Pad numero to 4 digits (API expects e.g. "0001")
  const paddedNumero = numero.padStart(4, '0');
  // Pad section to 2 characters (API expects e.g. "0W" not "W")
  const upperSection = section.toUpperCase().padStart(2, '0');

  const url = `https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=${encodeURIComponent(codeInsee)}&section=${encodeURIComponent(upperSection)}&numero=${encodeURIComponent(paddedNumero)}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.features && data.features.length > 0) {
    const feature = data.features[0];
    const centroid = computeCentroid(feature.geometry);
    const contenance = feature.properties?.contenance ?? null;
    return { feature, centroid, contenance };
  }
  return null;
}

/**
 * Search for communes matching a query string, optionally filtered by territory/department.
 * Uses the geo.api.gouv.fr API.
 */
export async function searchCommunes(
  query: string,
  territoryCode: string
): Promise<{ nom: string; code: string }[]> {
  if (!query || query.length < 1) return [];

  const params = new URLSearchParams({
    nom: query,
    fields: 'nom,code',
    boost: 'population',
    limit: '10',
  });

  // Filter by department code for DOM-TOM territories
  if (territoryCode && territoryCode !== 'metro') {
    params.set('codeDepartement', territoryCode);
  }

  const url = `https://geo.api.gouv.fr/communes?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data: { nom: string; code: string }[] = await response.json();
  return data;
}

/**
 * Compute the centroid of a GeoJSON geometry (Point, Polygon, or MultiPolygon).
 */
export function computeCentroid(geometry: any): [number, number] {
  if (geometry.type === 'Point') {
    const [lng, lat] = geometry.coordinates;
    return [lat, lng];
  }

  // Collect all coordinate rings
  let allCoords: number[][] = [];
  if (geometry.type === 'Polygon') {
    allCoords = geometry.coordinates[0]; // outer ring
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      allCoords = allCoords.concat(polygon[0]); // outer ring of each polygon
    }
  }

  if (allCoords.length === 0) {
    return [0, 0];
  }

  const sumLng = allCoords.reduce((acc, c) => acc + c[0], 0);
  const sumLat = allCoords.reduce((acc, c) => acc + c[1], 0);
  return [sumLat / allCoords.length, sumLng / allCoords.length];
}
