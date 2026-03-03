# Foncier Risk Score — Documentation Technique

> u

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture générale](#2-architecture-générale)
3. [Structure des fichiers](#3-structure-des-fichiers)
4. [Flux de données](#4-flux-de-données)
5. [API Backend](#5-api-backend)
6. [Frontend](#6-frontend)
7. [Modèle de données](#7-modèle-de-données)
8. [Limites d'utilisation par plan](#8-limites-dutilisation-par-plan)
9. [Intégration IA (xAI / Grok)](#9-intégration-ia-xai--grok)
10. [Coûts estimés](#10-coûts-estimés)
11. [Variables d'environnement](#11-variables-denvironnement)
12. [Évolutions futures](#12-évolutions-futures)

---

## 1. Vue d'ensemble

Le **Foncier Risk Score** est un outil d'analyse automatisée qui génère un score de risque foncier (0–100) pour chaque parcelle cadastrale, en se basant sur les spécificités des territoires caribéens français : Guadeloupe, Martinique, Guyane, Saint-Martin, Saint-Barthélemy.

### Catégories de score

| Score   | Catégorie  | Couleur  |
|---------|------------|----------|
| 75–100  | FAIBLE     | Vert     |
| 50–74   | MODÉRÉ     | Ambre    |
| 25–49   | ÉLEVÉ      | Orange   |
| 0–24    | CRITIQUE   | Rouge    |

> Un score élevé = risque faible. Un score bas = risque critique.

### Facteurs analysés

| Facteur                  | Source de référence           | Spécificité Caraïbe                           |
|--------------------------|-------------------------------|-----------------------------------------------|
| Constructibilité         | PLU / PLUi                    | Zones naturelles protégées, COS/CEP           |
| Risque inondation        | PPRI                          | Cyclones, crues tropicales                    |
| Risque sismique          | Plan de prévention sismique   | Zone 5 (très fort) Guadeloupe/Martinique      |
| Risque volcanique        | Plan ORSEC                    | Soufrière (Guadeloupe), Montagne Pelée (Mq.)  |
| Loi Littoral             | Loi n°86-2 du 3/01/1986       | Bande des 100m, espaces proches du rivage     |
| Servitudes               | Atlas des servitudes          | Lignes HTA, conduites d'eau, chemins ruraux   |
| Marché foncier           | DVF / DGFIP                   | Prix/m² par quartier, tendance                |
| Urbanisme                | Géoportail Urbanisme          | Délai préfecture, projets routiers            |

---

## 2. Architecture générale

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          UTILISATEUR                                     │
│                  (Dashboard ou page Risk Analysis)                       │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │  1. Saisie référence cadastrale
                             │     (commune, section, numéro, territoire)
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND — React / Vite                              │
│                                                                          │
│  src/pages/RiskAnalysis.tsx                                              │
│  ├── Formulaire cadastral (pré-rempli si venant du Dashboard)            │
│  ├── Vérification limite usage côté client (localStorage)               │
│  └── Appel POST /api/risk-analysis                                       │
│                                                                          │
│  src/components/features/RiskScoreComponents.tsx                         │
│  ├── RiskScoreGauge    — Jauge circulaire SVG animée                    │
│  ├── RiskBadge         — Badge coloré FAIBLE/MODÉRÉ/ÉLEVÉ/CRITIQUE      │
│  ├── MiniScoreBar      — Barre de progression par catégorie              │
│  └── RiskDetailCard    — Carte de détail par facteur de risque          │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │  POST /api/risk-analysis
                             │  { commune, section, numero, territoire,
                             │    surface?, lat?, lng?, plan }
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     BACKEND — Vercel Serverless Functions                │
│                                                                          │
│  api/risk-analysis/index.ts                                              │
│  │                                                                       │
│  ├── 1. VALIDATION                                                       │
│  │      └── Champs requis : commune, section, numero, territoire         │
│  │                                                                       │
│  ├── 2. CONTRÔLE DE QUOTA (MongoDB)                                      │
│  │      └── Plan gratuit : max 1 analyse/jour                           │
│  │          (compte les documents créés aujourd'hui dans risk_analyses)  │
│  │                                                                       │
│  ├── 3. CONSTRUCTION DU PROMPT                                           │
│  │      └── Prompt structuré en français, spécifique au territoire       │
│  │          (Guadeloupe / Martinique / Guyane / DOM-TOM)                │
│  │                                                                       │
│  ├── 4. APPEL xAI API (Grok-3-mini)                                      │
│  │      └── POST https://api.x.ai/v1/chat/completions                   │
│  │          model: grok-3-mini, temperature: 0.3                        │
│  │                                                                       │
│  ├── 5. PARSING DE LA RÉPONSE JSON                                       │
│  │      └── Extraction des scores, catégories, recommandations           │
│  │          (gestion des blocs markdown dans la réponse)                 │
│  │                                                                       │
│  └── 6. PERSISTANCE (MongoDB)                                            │
│         └── Sauvegarde dans collection risk_analyses                    │
│             + retour du document complet au client                       │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     PERSISTANCE — MongoDB Atlas                          │
│                                                                          │
│  Collection : risk_analyses                                              │
│  ├── id, parcelRef, commune, section, numero, territoire                 │
│  ├── scoreGlobal (0-100), categorie (FAIBLE/MODÉRÉ/ÉLEVÉ/CRITIQUE)      │
│  ├── constructibilite, risqueInondation, risqueSismique, ...             │
│  ├── marcheFoncier, urbanisme                                            │
│  ├── resumeIA, recommandations[]                                         │
│  ├── plan (free/pro/enterprise)                                          │
│  ├── rawResponse (réponse brute de l'IA)                                 │
│  └── createdAt (timestamp Unix)                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Structure des fichiers

```
cadastral-geolocalisation/
│
├── api/
│   └── risk-analysis/
│       └── index.ts              ← Endpoint Vercel (POST/GET)
│
├── src/
│   ├── pages/
│   │   └── RiskAnalysis.tsx      ← Page principale (dashboard premium)
│   │
│   ├── components/
│   │   └── features/
│   │       └── RiskScoreComponents.tsx  ← Composants visuels réutilisables
│   │
│   ├── types/
│   │   └── index.ts              ← Types TypeScript (RiskAnalysisResult, etc.)
│   │
│   └── lib/
│       └── usage-limits.ts       ← Gestion des quotas (canAnalyze, etc.)
│
└── docs/
    └── foncier-risk-score.md     ← Ce document
```

---

## 4. Flux de données

### Scénario 1 — Depuis le Dashboard

```
Dashboard.tsx
    │
    │  Recherche cadastrale réussie → result: GeoResult
    │
    └── Bouton "Analyser le risque IA"
            │
            └── navigate('/risk-analysis?commune=XX&section=A&numero=123
                                         &territoire=971&lat=...&lng=...')
                    │
                    └── RiskAnalysis.tsx monte avec URLSearchParams pré-remplis
```

### Scénario 2 — Saisie directe

```
RiskAnalysis.tsx
    │
    ├── canAnalyze(plan)  ← Vérifie localStorage (quota client)
    │       └── false → Affiche bandeau d'avertissement + CTA upgrade
    │
    └── POST /api/risk-analysis
            │
            ├── 429 (quota serveur atteint)
            │       └── Affiche erreur + CTA upgrade
            │
            └── 201 (succès)
                    ├── incrementDailyAnalysis()  ← Incrémente localStorage
                    └── setResult(data)           ← Affiche le rapport complet
```

---

## 5. API Backend

### `POST /api/risk-analysis`

**Corps de la requête :**

```json
{
  "commune": "Pointe-à-Pitre",
  "section": "A",
  "numero": "123",
  "territoire": "971",
  "surface": "500 m²",
  "lat": 16.2350,
  "lng": -61.5440,
  "plan": "free"
}
```

**Réponse succès (201) :**

```json
{
  "id": "uuid-v4",
  "parcelRef": "971/Pointe-à-Pitre/A/123",
  "scoreGlobal": 62,
  "categorie": "MODÉRÉ",
  "constructibilite": {
    "score": 70,
    "zonePLU": "UA - Zone urbaine dense",
    "cos": "0.5",
    "commentaire": "Parcelle en zone urbaine constructible..."
  },
  "risqueInondation": {
    "score": 55,
    "zonePPRI": "Zone bleue - risque modéré",
    "commentaire": "Proximité du littoral, exposition aux houles cycloniques..."
  },
  "risqueSismique": {
    "score": 40,
    "zoneAlea": "Zone 5 - Très fort",
    "commentaire": "La Guadeloupe est en zone de sismicité maximale..."
  },
  "risqueVolcanique": {
    "score": 65,
    "commentaire": "Distance suffisante de la Soufrière..."
  },
  "loiLittoral": {
    "score": 60,
    "applicable": true,
    "commentaire": "Territoire insulaire soumis à la loi Littoral..."
  },
  "servitudes": {
    "score": 80,
    "types": ["Ligne électrique HTA", "Canalisation d'eau"],
    "commentaire": "Quelques servitudes de passage identifiées..."
  },
  "marcheFoncier": {
    "prixMoyenM2": "350–450 €",
    "tendance": "HAUSSE",
    "commentaire": "Demande soutenue dans le centre urbain..."
  },
  "urbanisme": {
    "projetsProches": ["Extension zone commerciale", "Aménagement voirie"],
    "tempsEstimePermis": "6–12 mois",
    "commentaire": "Préfecture de Guadeloupe : délais moyens..."
  },
  "resumeIA": "Cette parcelle présente un profil de risque modéré...",
  "recommandations": [
    "Faire réaliser une étude de sol sismique (PS92/EC8)",
    "Vérifier le PLU en mairie avant dépôt de permis",
    "Consulter le CAUE Guadeloupe pour les règles parasismiques"
  ],
  "createdAt": 1740995200000
}
```

**Réponse erreur quota (429) :**

```json
{
  "error": "Limite atteinte. Les utilisateurs gratuits ont droit à 1 analyse par jour."
}
```

### `GET /api/risk-analysis`

Retourne les 50 dernières analyses, triées par date décroissante.

---

## 6. Frontend

### `src/pages/RiskAnalysis.tsx`

| Section               | Description                                                    |
|-----------------------|----------------------------------------------------------------|
| Formulaire            | Territoire, commune, section, numéro, surface, lat/lng (opt.) |
| Bandeau quota         | Avertissement + CTA si limite gratuite atteinte                |
| État de chargement    | Animation + badges des étapes d'analyse                        |
| Score global          | Header sombre avec jauge circulaire + badge catégorie          |
| Barres de score       | 6 mini-barres colorées (une par facteur)                       |
| Synthèse IA           | Paragraphe narratif généré par Grok                            |
| Cartes détaillées     | 2 colonnes, une carte par facteur de risque                    |
| Marché & Urbanisme    | Prix/m², tendance, délai permis, projets proches               |
| Recommandations       | Liste numérotée des actions conseillées                        |
| Disclaimer            | Mention légale obligatoire                                     |
| Historique            | 5 dernières analyses (chargées depuis l'API)                   |

### `src/components/features/RiskScoreComponents.tsx`

| Composant         | Props                              | Usage                               |
|-------------------|------------------------------------|-------------------------------------|
| `RiskScoreGauge`  | `score`, `size?`, `label?`         | Jauge circulaire SVG animée         |
| `RiskBadge`       | `categorie`                        | Badge coloré inline                 |
| `MiniScoreBar`    | `score`, `label`, `icon`           | Barre dans la grille de scores      |
| `RiskDetailCard`  | `title`, `icon`, `score`, `children` | Carte de détail avec fond coloré  |

### Navigation

Le lien **"Risk Score IA"** est ajouté dans la sidebar de `DashboardLayout.tsx` avec l'icône `Shield`, entre "Recherche" et "Historique".

Le bouton **"Analyser le risque IA"** est injecté dans la fiche parcelle du Dashboard, après les boutons de navigation externe et avant l'export PDF.

---

## 7. Modèle de données

### TypeScript — `src/types/index.ts`

```typescript
interface RiskAnalysisResult {
  id: string;
  parcelRef: string;
  commune: string;
  section: string;
  numero: string;
  territoire: string;
  surface: string | null;
  lat: number | null;
  lng: number | null;

  scoreGlobal: number;                          // 0–100
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
  createdAt: number;                            // timestamp Unix ms
}
```

### MongoDB — Collection `risk_analyses`

```
Index recommandé : { createdAt: -1 }
Index quota      : { createdAt: 1, plan: 1 }
TTL optionnel    : expireAfterSeconds: 7776000 (90 jours, plan gratuit)
```

---

## 8. Limites d'utilisation par plan

| Plan        | Analyses / jour | Recherches / jour |
|-------------|-----------------|-------------------|
| Découverte  | **1**           | 5                 |
| Pro         | Illimitées      | Illimitées        |
| Entreprise  | Illimitées      | Illimitées        |

Le quota est contrôlé à **deux niveaux** :

1. **Client** (`localStorage`) — `canAnalyze('free')` dans `src/lib/usage-limits.ts`  
   Évite les appels réseau inutiles. Se réinitialise à minuit (date ISO `YYYY-MM-DD`).

2. **Serveur** (MongoDB) — compte des documents `{ createdAt >= debut_journee, plan: 'free' }`  
   Constitue la vérification autoritaire, non contournable côté client.

---

## 9. Intégration IA (xAI / Grok)

### Modèle utilisé

```
grok-3-mini
temperature : 0.3   (réponses déterministes et factuelles)
max_tokens  : 2000
```

### Stratégie du prompt

- **Rôle système** : Expert foncier & urbanisme DOM-TOM, réponse JSON uniquement.
- **Contextualisation territoire** : Le prompt mentionne explicitement la région (`Guadeloupe`, `Martinique`, `Guyane`) pour orienter les risques spécifiques (volcanisme, sismicité forte, cyclones).
- **Format de sortie** : Schéma JSON complet demandé verbatim dans le prompt → facilite le parsing.
- **Parsing robuste** : Gestion des blocs markdown (` ```json ``` `) que certains modèles insèrent malgré les instructions.

### Endpoint xAI

```
POST https://api.x.ai/v1/chat/completions
Authorization: Bearer XAI_API_KEY
```

---

## 10. Coûts estimés

| Composant             | Service               | Coût par analyse |
|-----------------------|-----------------------|------------------|
| Analyse IA principale | xAI Grok-3-mini       | ~€0.01–0.05      |
| Stockage résultat     | MongoDB Atlas (free)  | €0               |
| Infrastructure        | Vercel (serverless)   | €0 (free tier)   |
| **Total**             |                       | **~€0.01–0.05**  |

Avec un abonnement Pro à **29€/mois**, le seuil de rentabilité est atteint à partir de **~600 analyses/mois** par utilisateur.

---

## 11. Variables d'environnement

| Variable      | Description                     | Obligatoire |
|---------------|---------------------------------|-------------|
| `XAI_API_KEY` | Clé API xAI (Grok)              | ✅ Oui      |
| `MONGODB_URI` | URI de connexion MongoDB Atlas  | ✅ Oui      |

Ces variables doivent être définies dans `.env` (local) et dans les **Environment Variables** du projet Vercel.

---

## 12. Évolutions futures

### Court terme
- [ ] **Export PDF** du rapport de risque (via `@react-pdf/renderer`)
- [ ] **Carte des risques** : overlay visuel sur la carte Leaflet (zones PPRI, sismique)
- [ ] **Comparaison de parcelles** : analyser 2 parcelles côte-à-côte

### Moyen terme
- [ ] **Données réelles PPRI** : intégration API Géorisques (`georisques.gouv.fr`)
- [ ] **DVF réel** : connexion à l'API Demandes de Valeurs Foncières pour les prix/m²
- [ ] **Géoportail Urbanisme** : extract automatique de la zone PLU réelle
- [ ] **Analyse satellite** : comparaison d'imagerie Sentinel Hub (détection de construction)

### Long terme
- [ ] **Score d'investissement** : au-delà du risque, un score d'opportunité (rendement locatif estimé, potentiel de valorisation)
- [ ] **Alertes automatiques** : notification si la zone d'une parcelle suivie change de classification
- [ ] **Rapport multi-parcelles** : analyse de portefeuille foncier pour les entreprises
