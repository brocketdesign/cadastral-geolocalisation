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
  return `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`;
}
