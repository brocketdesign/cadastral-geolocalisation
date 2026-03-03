/* ─── Alertes Foncier Pro – Types ─── */

// ── Territoires ──
export type AlertTerritory =
  | 'guadeloupe'
  | 'martinique'
  | 'guyane'
  | 'reunion';

// ── Types de zones ──
export type ZoneType = 'commune' | 'polygon' | 'radius';

export interface AlertZone {
  id: string;
  userId: string;
  name: string;
  zoneType: ZoneType;
  /** Pour le type commune */
  communes?: string[];
  /** Pour le type polygone (GeoJSON) */
  geometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  /** Pour le type rayon */
  center?: { lat: number; lng: number };
  radiusKm?: number;
  /** Parcelle spécifique à surveiller (optionnel) */
  parcelReference?: string;
  createdAt: string;
  isActive: boolean;
}

// ── Types d'alertes ──
export type AlertTypeKey =
  | 'NEW_LISTING'
  | 'PRICE_DROP'
  | 'PLU_CHANGE'
  | 'NEW_ARRETE'
  | 'INFRASTRUCTURE'
  | 'RISK_PPRI'
  | 'OWNERSHIP_CHANGE'
  | 'PUBLIC_SALE';

export interface AlertTypeConfig {
  key: AlertTypeKey;
  label: string;
  description: string;
  defaultEnabled: boolean;
  urgent: boolean;
}

export const ALERT_TYPES: AlertTypeConfig[] = [
  {
    key: 'NEW_LISTING',
    label: 'Nouvelles annonces',
    description: 'Biens mis en vente dans la zone',
    defaultEnabled: true,
    urgent: false,
  },
  {
    key: 'PRICE_DROP',
    label: 'Baisses de prix',
    description: 'Annonce existante avec réduction de prix >10%',
    defaultEnabled: true,
    urgent: false,
  },
  {
    key: 'PLU_CHANGE',
    label: 'Modifications PLU',
    description: 'Changements de zonage',
    defaultEnabled: true,
    urgent: true,
  },
  {
    key: 'NEW_ARRETE',
    label: 'Nouveaux arrêtés',
    description: "Décisions municipales d'urbanisme",
    defaultEnabled: true,
    urgent: true,
  },
  {
    key: 'INFRASTRUCTURE',
    label: 'Projets infrastructure',
    description: 'Routes, réseaux, travaux publics',
    defaultEnabled: true,
    urgent: false,
  },
  {
    key: 'RISK_PPRI',
    label: 'Alertes risques (PPRI)',
    description: "Zones inondables, risques naturels",
    defaultEnabled: true,
    urgent: true,
  },
  {
    key: 'OWNERSHIP_CHANGE',
    label: 'Changements de propriété',
    description: 'Nouveau propriétaire via succession/vente',
    defaultEnabled: false,
    urgent: false,
  },
  {
    key: 'PUBLIC_SALE',
    label: 'Ventes publiques',
    description: 'Adjudication, ventes communales',
    defaultEnabled: false,
    urgent: false,
  },
];

// ── Préférences de notification ──
export type SmsAlertMode = 'on' | 'urgent_only' | 'off';
export type EmailAlertMode = 'immediate' | 'digest' | 'off';
export type DigestFrequency = 'daily' | 'weekly' | 'never';

export interface NotificationPreferences {
  smsAlerts: SmsAlertMode;
  emailAlerts: EmailAlertMode;
  digestFrequency: DigestFrequency;
  digestTime: string; // "08:00"
  websocketToasts: boolean;
  soundNotifications: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

// ── Filtres avancés ──
export type ParcelType = 'constructible' | 'agricole' | 'mixte';
export type ZonagePLU = 'U' | 'AU' | 'NC' | 'A';

export interface AdvancedFilters {
  minSurface: number | null;
  maxSurface: number | null;
  priceMin: number | null;
  priceMax: number | null;
  parcelTypes: ParcelType[];
  zonagePLU: ZonagePLU[];
  buildableOnly: boolean;
}

// ── Profil utilisateur ──
export interface AlertUserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  fullName: string;
  agencyName?: string;
  territory: AlertTerritory;
  timezone: string;
}

// ── Configuration complète d'alerte (stockée dans MongoDB) ──
export interface AlertConfig {
  id: string;
  userId: string;
  zone: AlertZone;
  enabledAlertTypes: AlertTypeKey[];
  filters: AdvancedFilters;
  notifications: NotificationPreferences;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Événement d'alerte (élément de notification) ──
export type AlertPriority = 'urgent' | 'standard' | 'low';
export type AlertChannel = 'sms' | 'email' | 'websocket';

export interface AlertEvent {
  id: string;
  alertConfigId: string;
  type: AlertTypeKey;
  priority: AlertPriority;
  title: string;
  summary: string;
  details: string;
  zoneName: string;
  commune: string;
  parcelRef?: string;
  channels: AlertChannel[];
  read: boolean;
  createdAt: string;
  /** Pour le suivi de livraison email */
  emailSentAt?: string;
  emailOpenedAt?: string;
  smsSentAt?: string;
}

// ── Statistiques d'activité ──
export interface AlertActivityStats {
  alertsThisMonth: number;
  smsSent: number;
  emailsSent: number;
  lastAlertAt: string | null;
}

// ── Étapes d'intégration ──
export interface OnboardingStep {
  id: number;
  label: string;
  required: boolean;
  completed: boolean;
}
