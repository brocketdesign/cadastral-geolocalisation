# Alertes Foncier Pro — Documentation Technique

> **Dernière mise à jour :** 2026-03-03  
> **Statut :** Maquette UI complète — Backend non implémenté

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture générale](#2-architecture-générale)
3. [État d'avancement](#3-état-davancement)
4. [Modèles de données](#4-modèles-de-données)
5. [Types d'alertes](#5-types-dalertes)
6. [Canaux de notification](#6-canaux-de-notification)
7. [Structure des fichiers](#7-structure-des-fichiers)
8. [Prochaines étapes](#8-prochaines-étapes)
9. [Variables d'environnement](#9-variables-denvironnement)

---

## 1. Vue d'ensemble

Système d'alertes en temps réel destiné aux professionnels immobiliers des territoires caribéens français. Surveille les zones cibles pour les mises en vente de parcelles, les modifications de zonage, les projets d'urbanisme et les mises à jour de risques. Livraison des notifications par SMS (Twilio), Email (Resend) et WebSocket (interface temps réel).

---

## 2. Architecture générale

```
Sources de données → Traitement IA → Moteur de décision → Livraison notifications
(Perplexity,          (Claude 3.5,    (Correspondance       (Twilio SMS,
 Firecrawl,            GPT-4o)         zones utilisateur,     Resend email,
 Géoportail)                           calcul pertinence,     WebSocket)
                                       détermination priorité)
```

---

## 3. État d'avancement

### ✅ IMPLÉMENTÉ (Interface utilisateur — Données fictives)

| Composant | Fichier | Statut |
|-----------|---------|--------|
| **Types TypeScript** | `src/types/alerts.ts` | ✅ Terminé |
| **Données fictives** | `src/lib/mock-alerts.ts` | ✅ Terminé |
| **Page AlertSettings** | `src/pages/AlertSettings.tsx` | ✅ Terminé |
| **Section Profil & Contact** | `src/components/features/alerts/ProfileContactSection.tsx` | ✅ Terminé |
| **Vérification téléphone (OTP)** | (intégré dans ProfileContactSection) | ✅ UI uniquement |
| **Section Zones d'alerte** | `src/components/features/alerts/AlertZonesSection.tsx` | ✅ Terminé |
| **Dialogue création de zone** | (intégré dans AlertZonesSection) | ✅ Terminé |
| **Section Types d'alertes** | `src/components/features/alerts/AlertTypesSection.tsx` | ✅ Terminé |
| **Section Notifications** | `src/components/features/alerts/NotificationSettingsSection.tsx` | ✅ Terminé |
| **Section Filtres avancés** | `src/components/features/alerts/AdvancedFiltersSection.tsx` | ✅ Terminé |
| **Section Activité & Usage** | `src/components/features/alerts/ActivityUsageSection.tsx` | ✅ Terminé |
| **Boîte de réception alertes** | `src/components/features/alerts/AlertInbox.tsx` | ✅ Terminé |
| **Routage** | `src/App.tsx` — route `/alerts` | ✅ Terminé |
| **Navigation sidebar** | `src/components/layout/DashboardLayout.tsx` | ✅ Terminé |
| **Onglets (Réception / Config)** | Intégré dans la page AlertSettings | ✅ Terminé |

### ❌ NON IMPLÉMENTÉ (Backend / Intégrations)

| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| **Intégration Resend** | Envoi d'emails via l'API Resend | 🔴 Haute |
| **Templates email Resend** | Templates HTML riches pour alertes et résumés | 🔴 Haute |
| **Intégration SMS Twilio** | Envoi de SMS pour alertes urgentes | 🔴 Haute |
| **Vérification OTP Twilio** | Vérification de numéro de téléphone par code SMS | 🔴 Haute |
| **Collections MongoDB** | `users`, `alertConfigs`, `alertEvents` | 🔴 Haute |
| **Endpoints API – Config CRUD** | `/api/alerts/config` | 🔴 Haute |
| **Endpoints API – Événements** | `/api/alerts/events` | 🔴 Haute |
| **Endpoints API – Vérif. tél.** | `/api/verify/send`, `/api/verify/check` | 🔴 Haute |
| **Perplexity Sonar Pro** | Recherche d'actualités, arrêtés, modifications PLU, projets | 🟡 Moyenne |
| **Scraping Firecrawl** | Scraping profond d'annonces et de sites de communes | 🟡 Moyenne |
| **API Géoportail** | Limites parcellaires, données cadastrales | 🟡 Moyenne |
| **Claude 3.5 Sonnet** | Extraction documentaire, texte juridique français | 🟡 Moyenne |
| **GPT-4o** | Sortie JSON structurée, formatage des alertes | 🟡 Moyenne |
| **File d'événements Redis** | Dédoublonnage, priorisation, routage des événements | 🟡 Moyenne |
| **Moteur de décision alertes** | Correspondance événements / zones utilisateur | 🟡 Moyenne |
| **WebSocket / Socket.io** | Envoi en temps réel vers le tableau de bord | 🟡 Moyenne |
| **Planificateur résumé email** | Tâche cron pour résumé quotidien/hebdomadaire | 🟡 Moyenne |
| **Outils de dessin Leaflet** | Dessin de polygone pour création de zone personnalisée | 🟢 Basse |
| **Sélecteur zone rayon sur carte** | Cliquer pour placer le point central sur la carte | 🟢 Basse |
| **Analytique PostHog** | Taux d'ouverture, conversions, suivi du chiffre d'affaires | 🟢 Basse |
| **Pièces jointes PDF** | Génération de PDF pour les alertes email | 🟢 Basse |
| **Fallback WhatsApp** | WhatsApp Twilio si le SMS échoue | 🟢 Basse |

---

## 4. Modèles de données

### Profil utilisateur
```typescript
{
  id: string;
  email: string;          // Cible de livraison Resend
  emailVerified: boolean;
  phone: string;          // Cible de livraison Twilio (format +596/+590)
  phoneVerified: boolean; // Vérifié par OTP Twilio
  fullName: string;
  agencyName?: string;
  territory: 'guadeloupe' | 'martinique' | 'guyane' | 'reunion';
  timezone: string;       // Détecté automatiquement (ex: 'America/Guadeloupe')
}
```

### Zone d'alerte
```typescript
{
  id: string;
  userId: string;
  name: string;
  zoneType: 'commune' | 'polygon' | 'radius';
  communes?: string[];           // Pour le type commune
  geometry?: GeoJSON.Polygon;    // Pour le type polygone
  center?: { lat: number; lng: number };  // Pour le type rayon
  radiusKm?: number;             // Pour le type rayon
  parcelReference?: string;      // Parcelle spécifique à surveiller (optionnel)
  isActive: boolean;
}
```

### Événement d'alerte
```typescript
{
  id: string;
  alertConfigId: string;
  type: AlertTypeKey;     // NEW_LISTING, PLU_CHANGE, etc.
  priority: 'urgent' | 'standard' | 'low';
  title: string;
  summary: string;
  details: string;
  zoneName: string;
  commune: string;
  parcelRef?: string;
  channels: ('sms' | 'email' | 'websocket')[];
  read: boolean;
  emailSentAt?: string;   // Suivi de livraison Resend
  smsSentAt?: string;      // Suivi de livraison Twilio
}
```

---

## 5. Types d'alertes

| Clé | Libellé | Défaut | Urgent |
|-----|---------|--------|--------|
| `NEW_LISTING` | Nouvelles annonces | Activé | Non |
| `PRICE_DROP` | Baisses de prix | Activé | Non |
| `PLU_CHANGE` | Modifications PLU | Activé | **Oui** |
| `NEW_ARRETE` | Nouveaux arrêtés | Activé | **Oui** |
| `INFRASTRUCTURE` | Projets infrastructure | Activé | Non |
| `RISK_PPRI` | Alertes risques (PPRI) | Activé | **Oui** |
| `OWNERSHIP_CHANGE` | Changements de propriété | Désactivé | Non |
| `PUBLIC_SALE` | Ventes publiques | Désactivé | Non |

---

## 6. Canaux de notification

| Canal | Fournisseur | Cas d'usage |
|-------|-------------|-------------|
| **SMS** | Twilio | Alertes urgentes (changements de zonage, risques) |
| **Email** | Resend | Alertes standard, résumés quotidiens, rapports détaillés |
| **WebSocket** | Socket.io | Alertes toast temps réel, compteurs badges, notifications sonores |

### Stratégie email Resend
- **Alertes immédiates** : Template HTML riche avec détails de l'alerte + lien profond vers l'application
- **Résumé quotidien** : Récapitulatif de toutes les alertes des dernières 24h, envoyé à l'heure configurée
- **Résumé hebdomadaire** : Récapitulatif de la semaine avec graphiques et recommandations
- **Gestion désinscription** : Gestion intégrée de la désinscription via Resend
- **Pièces jointes PDF** : Rapports détaillés de risque/analyse attachés aux emails

### Stratégie SMS Twilio
- **Numéros locaux** : +596 (Martinique), +590 (Guadeloupe) pour une meilleure livraison
- **Accusés de réception** : Suivi du statut de livraison des SMS
- **Heures silencieuses** : Pas de SMS entre 22h et 7h (configurable par l'utilisateur)
- **Fallback WhatsApp** : Si la livraison SMS échoue

---

## 7. Structure des fichiers

```
src/
├── types/
│   └── alerts.ts                      # Tous les types TypeScript pour les alertes
├── lib/
│   └── mock-alerts.ts                 # Données fictives pour le développement UI
├── pages/
│   └── AlertSettings.tsx              # Page principale (onglets : Réception / Configuration)
└── components/features/alerts/
    ├── ProfileContactSection.tsx       # Section 1 : Profil & vérification téléphone
    ├── AlertZonesSection.tsx           # Section 2 : Gestion des zones + dialogue de création
    ├── AlertTypesSection.tsx           # Section 3 : Activation/désactivation types d'alertes
    ├── NotificationSettingsSection.tsx  # Section 4 : Préférences SMS/Email/Son
    ├── AdvancedFiltersSection.tsx      # Section 5 : Filtres surface/prix/PLU
    ├── ActivityUsageSection.tsx        # Section 6 : Statistiques & export
    └── AlertInbox.tsx                  # Boîte de réception avec recherche/filtre/vue détail
```

---

## 8. Prochaines étapes (ordre d'implémentation recommandé)

1. **Configurer Resend** — Ajouter `RESEND_API_KEY` dans `.env`, créer l'endpoint `/api/alerts/send-email`
2. **Configurer Twilio** — Ajouter les variables `TWILIO_*`, créer `/api/verify/send` et `/api/verify/check`
3. **Collections MongoDB** — Créer les collections `alertConfigs` et `alertEvents`
4. **Endpoints API CRUD** — `/api/alerts/config` (GET/POST/PUT/DELETE)
5. **Intégration Perplexity** — Recherche planifiée d'actualités et modifications PLU
6. **Moteur de décision alertes** — Correspondance événements / zones utilisateur
7. **Intégration WebSocket** — Envoi temps réel vers les clients connectés
8. **Planificateur résumé** — Tâche cron pour les résumés quotidiens/hebdomadaires

---

## 9. Variables d'environnement nécessaires

```env
# Resend (Email)
RESEND_API_KEY=re_xxxxx

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+596xxxxxxxxx

# Perplexity (Recherche IA)
PERPLEXITY_API_KEY=pplx-xxxxx

# Redis (File d'événements)
REDIS_URL=redis://localhost:6379

# Optionnel
FIRECRAWL_API_KEY=fc-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```
