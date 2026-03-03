# Recherche Cadastrale — État d'implémentation

> Documentation technique de la page **Dashboard** (`src/pages/Dashboard.tsx`).  
> Date de rédaction : Mars 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Formulaire de recherche](#2-formulaire-de-recherche)
3. [Résolution cadastrale (APIs)](#3-résolution-cadastrale-apis)
4. [Carte interactive](#4-carte-interactive)
5. [Fiche parcelle](#5-fiche-parcelle)
6. [Historique & Favoris](#6-historique--favoris)
7. [Limites d'usage par plan](#7-limites-dusage-par-plan)
8. [Publicités](#8-publicités)
9. [Ce qui N'est PAS implémenté](#9-ce-qui-nest-pas-implémenté)
10. [Récapitulatif rapide](#10-récapitulatif-rapide)

---

## 1. Vue d'ensemble

La page **Dashboard** est le point d'entrée principal de l'application. Elle permet à l'utilisateur de localiser une parcelle cadastrale à partir de sa référence (territoire, commune, section, numéro) et d'obtenir ses coordonnées GPS, sa géométrie et une fiche descriptive.

**Flux principal :**

```
Saisie formulaire
   → Résolution code INSEE (api-adresse.data.gouv.fr)
   → Récupération géométrie parcelle (apicarto.ign.fr)
   → Affichage carte + Fiche parcelle
   → Sauvegarde dans l'historique (MongoDB)
```

---

## 2. Formulaire de recherche

### ✅ Implémenté

| Champ | Comportement |
|-------|-------------|
| **Territoire** | `<Select>` avec 8 territoires français : Guadeloupe (971), Martinique (972), Guyane (973), La Réunion (974), Mayotte (976), Saint-Barthélemy (977), Saint-Martin (978), France métropolitaine (metro). La région est affichée sous le sélecteur. |
| **Commune** | `<Input>` avec autocomplétion en temps réel via `geo.api.gouv.fr/communes`. Debounce de 250 ms. Filtre par département pour les DOM-TOM. Affiche 10 suggestions avec code INSEE en sous-texte. |
| **Section** | `<Input>` limité à 2 caractères. Converti en majuscules et paddé à 2 chars (`0W`) avant l'appel API. |
| **N° parcelle** | `<Input>` libre. Paddé à 4 chiffres (`0001`) avant l'appel API. |
| **Affichage d'erreur** | Bloc rouge sous le formulaire avec messages spécifiques (commune introuvable, parcelle non trouvée, erreur réseau). |
| **Bouton recherche** | État de chargement avec spinner. Désactivé pendant la requête. |
| **Compteur plan Gratuit** | Affiché sous le bouton : « X recherche(s) restante(s) aujourd'hui ». |

### ❌ Non implémenté

- Champ **adresse postale** (recherche inverse : adresse → parcelle)
- Champ **coordonnées GPS** (recherche inverse : lat/lng → parcelle)
- Recherche **par lot** (multi-parcelles)
- Validation de format section/numéro côté client

---

## 3. Résolution cadastrale (APIs)

### ✅ Implémenté

**Étape 1 — Résolution commune → INSEE** (`src/lib/territories.ts`)

- API : `https://api-adresse.data.gouv.fr/search/?q=...&type=municipality`
- Fonction : `resolveCodeInsee(commune, territoryCode)`
- Pour les DOM-TOM : la région est ajoutée à la requête (ex: `Pointe-à-Pitre, Guadeloupe`)
- Retourne `{ codeInsee, cityName }` ou `null`

**Étape 2 — Récupération géométrie IGN** (`src/lib/territories.ts`)

- API : `https://apicarto.ign.fr/api/cadastre/parcelle`
- Paramètres : `code_insee`, `section` (paddé 2 chars), `numero` (paddé 4 chiffres)
- Retourne : `{ feature: GeoJSON, centroid: [lat, lng], contenance: number | null }`
- Fonction de calcul de centroïde maison (`computeCentroid`) supportant `Point`, `Polygon` et `MultiPolygon`

**Autocomplétion commune** (`src/lib/territories.ts`)

- API : `https://geo.api.gouv.fr/communes?nom=...`
- Filtre par `codeDepartement` pour les DOM-TOM
- Tri par population (`boost=population`)

### ❌ Non implémenté

- Appel à une API **PLU/zonage** pour remplir le champ `zonage` du résultat (voir §9)
- Gestion des sections avec **préfixe de commune** (certaines communes utilisent des sections à 4 chars)
- Cache local des résultats IGN

---

## 4. Carte interactive

### ✅ Implémenté

Rendu via `react-leaflet` avec `LayersControl` :

| Couche | Source | Type |
|--------|--------|------|
| **Standard** (défaut) | OpenStreetMap | Fond de carte |
| **Satellite** | ESRI World Imagery | Fond de carte |
| **Cadastre** | IGN WMTS `inspire.cadastre.gouv.fr` (opacité 0.5) | Overlay |

- **Polygone parcelle** : rendu en `<GeoJSON>` (contour vert `#059669`, remplissage `#10b981` à 20%), affiché uniquement si l'API IGN retourne une géométrie.
- **Marqueur** : icône Leaflet par défaut, centré sur le centroïde de la parcelle. Popup avec adresse, territoire et coordonnées.
- **Zoom initial** : niveau 16 centré sur la parcelle.
- **`mapKey`** : incrémenté à chaque nouvelle recherche pour forcer le re-mount de `MapContainer` et recentrer la vue.
- État vide : placeholder avec icône `MapPin` et message d'invitation.

### ❌ Non implémenté

- **Restriction couche Satellite** pour le plan Gratuit (`canUseSatelliteView` est défini dans les limites mais non appliqué dans l'UI — tous les utilisateurs peuvent changer de couche)
- **Plein écran** / export de la carte en image
- **Dessin de zone** (sélection de parcelle par clic sur la carte)
- **Affichage des parcelles voisines**

---

## 5. Fiche parcelle

### ✅ Implémenté

Affichée dans la card **"Fiche parcelle"** après une recherche réussie.

**Informations affichées :**

| Champ | Source | État |
|-------|--------|------|
| Adresse formatée | `{Commune} - Section {X} - Parcelle {N}` | ✅ |
| Territoire | Depuis `parcelle.territoire` | ✅ |
| Latitude | Centroïde calculé | ✅ |
| Longitude | Centroïde calculé | ✅ |
| Surface est. | `contenance` depuis IGN (en m²) | ✅ si disponible |
| Zonage | `result.zonage` | ⚠️ Affiché mais toujours `undefined` (voir §9) |
| Référence cadastrale | `territoire / commune / section / numero` | ✅ |

**Actions disponibles :**

| Action | Comportement | État |
|--------|-------------|------|
| Copier les coordonnées | `navigator.clipboard.writeText(lat, lng)` | ✅ |
| Partager la fiche | `navigator.share()` ou fallback clipboard | ✅ |
| Ouvrir dans Google Maps | `https://www.google.com/maps?q={lat},{lng}` | ✅ |
| Géoportail Urbanisme | `https://www.geoportail-urbanisme.gouv.fr/map/#...` avec lat/lng/zoom | ✅ |
| Analyser le risque IA | Navigation vers `/risk-analysis` avec params pré-remplis | ✅ |
| Exporter en PDF | Affiche un `alert()` (non fonctionnel) | ⚠️ Badge PRO — voir §9 |

---

## 6. Historique & Favoris

### ✅ Implémenté

**Historique récent (sidebar)** :

- Chargé depuis `/api/history` au montage du composant
- Affiche les 5 dernières recherches
- Clic sur une entrée : restaure le formulaire + le résultat dans la carte
- Icône étoile pour toggler le favori (via `PATCH /api/history/:id/favorite`)
- Mis à jour après chaque nouvelle recherche (nouvelle entrée insérée en tête)

**Persistance backend** (MongoDB via `/api/history`) :

- `GET /api/history` — liste
- `POST /api/history` — ajout
- `PATCH /api/history/:id/favorite` — toggle favori
- `DELETE /api/history/:id` — suppression individuelle
- `DELETE /api/history` — vider l'historique

### ❌ Non implémenté

- **Restriction plan Gratuit** : `canAccessHistory: false` est défini dans `PLAN_LIMITS` mais la section "Recherches récentes" du Dashboard n'est pas masquée ni verrouillée pour les utilisateurs gratuits
- **Restriction plan Gratuit** pour les favoris : identique — l'étoile est disponible pour tous
- Pagination de l'historique dans la sidebar (limité à 5 hardcodé)

---

## 7. Limites d'usage par plan

Défini dans `src/lib/usage-limits.ts` :

| Limite | Gratuit | Pro | Entreprise |
|--------|---------|-----|-----------|
| Recherches/jour | 5 | ∞ | ∞ |
| Analyses IA/jour | 1 | ∞ | ∞ |
| Historique | — | ✅ | ✅ |
| Favoris | — | ✅ | ✅ |
| Export PDF | — | ✅ | ✅ |
| Recherche par lot | — | ✅ | ✅ |
| Vue Satellite | — | ✅ | ✅ |
| Tous territoires | — | ✅ | ✅ |
| Publicités | ✅ | — | — |

### ✅ Correctement appliqué dans le Dashboard

- **Limite de 5 recherches/jour** (plan Gratuit) : vérifiée via `canSearch('free')` avant chaque recherche, incrémentée après succès, reset à minuit via localStorage. Modal `<SearchLimitModal>` affiché si dépassé.

### ❌ Défini mais NON appliqué dans le Dashboard

- `canUseSatelliteView` : couche satellite accessible pour tous
- `canAccessAllTerritories` : tous les 8 territoires accessibles pour tous
- `canAccessHistory` : historique affiché pour tous
- `canAccessFavorites` : favoris accessibles pour tous
- `canExportPDF` : bouton affiché pour tous (mais `alert()` au clic pour tous)
- `canBatchSearch` : fonctionnalité absente de l'UI

---

## 8. Publicités

Intégrées via `src/components/features/AdBanner.tsx`, affichées conditionnellement pour les utilisateurs du plan Gratuit.

| Composant | Position |
|-----------|---------|
| `<AdTopBanner />` | Bannière text en haut de page |
| `<ImageAdTopBanner />` | Bannière image en haut |
| `<AdSidebarCard />` | Card dans la colonne de gauche |
| `<ImageAdSidebar />` | Image dans la sidebar |
| `<AdInline />` | Entre la carte et la fiche résultat |
| `<ImageAdInline />` | Image inline entre carte et résultat |

---

## 9. Ce qui N'est PAS implémenté

### 🔴 Bugs / données manquantes

#### Champ `zonage` toujours vide
- **Problème** : La card "Fiche parcelle" affiche un champ "Zonage" mais `result.zonage` n'est jamais peuplé. La fonction `searchParcelle()` ne consulte aucune API PLU/urbanisme.
- **Impact** : Le champ affiche `undefined` dans l'UI.
- **Solution attendue** : Appel à l'API Géoportail Urbanisme ou à `apicarto.ign.fr/api/gpu` pour récupérer la zone PLU associée aux coordonnées.

#### Export PDF depuis le Dashboard (non fonctionnel)
- **Problème** : Le bouton "Exporter en PDF" exécute `alert('Export PDF disponible avec le plan Pro...')` — c'est un stub.
- **Note** : La fonction `exportRiskAnalysisPDF()` existe dans `src/lib/export-risk-pdf.ts` et est utilisée dans `RiskAnalysis.tsx`, mais n'est pas importée ni appelée dans `Dashboard.tsx`.
- **Solution attendue** : Créer une fonction `exportParcellePDF(result: GeoResult)` ou adapter l'existante, puis la câbler au bouton (protégé par `canExportPDF` vérifié depuis le plan utilisateur).

### 🟡 Fonctionnalités définies mais non implémentées

#### Gating couche Satellite (`canUseSatelliteView`)
- La couche Satellite est accessible à tous les utilisateurs dans le `LayersControl`.
- Attendu : masquer ou désactiver l'option Satellite pour le plan Gratuit.

#### Gating territoires (`canAccessAllTerritories`)
- Tous les 8 territoires sont sélectionnables pour tous les plans.
- Attendu : restreindre le plan Gratuit à 1 ou 2 territoires (ex: Guadeloupe + Martinique).

#### Gating historique (`canAccessHistory`)
- La section "Recherches récentes" est visible pour tous.
- Attendu : masquer ou afficher un `<UpgradeGate>` pour les utilisateurs Gratuits.

#### Gating favoris (`canAccessFavorites`)
- L'étoile de favori est cliquable pour tous.
- Attendu : bloquer le clic ou rediriger vers la page de pricing pour les Gratuits.

#### Recherche par lot (`canBatchSearch`)
- Aucune UI n'existe pour uploader un fichier CSV ou saisir plusieurs parcelles.
- Attendu : formulaire multi-entrées ou import CSV dans une section dédiée.

### 🔵 Améliorations non développées

| Fonctionnalité | Description |
|----------------|-------------|
| Recherche par adresse postale | Reverse geocoding adresse → parcelle IGN |
| Recherche par coordonnées GPS | lat/lng → parcelle IGN (`/api/cadastre/parcelle?lon=...&lat=...`) |
| Export coordonnées multi-format | WKT, GeoJSON, KML en plus du lat/lng brut |
| Affichage parcelles voisines | Render des parcelles adjacentes sur la carte |
| Plein écran carte | Bouton d'expansion de la carte |
| Sélection par clic sur la carte | Clic sur la carte → interrogation IGN aux coordonnées cliquées |
| Adresse postale reverse | Affichage de l'adresse postale réelle (via BAN) dans la fiche |

---

## 10. Récapitulatif rapide

```
Dashboard — Recherche Cadastrale
│
├── ✅ Formulaire (territoire, commune autocomplete, section, numéro)
├── ✅ Résolution INSEE via api-adresse.data.gouv.fr
├── ✅ Récupération parcelle + géométrie via IGN apicarto
├── ✅ Carte (OSM + Satellite + overlay Cadastre + polygone GeoJSON)
├── ✅ Fiche parcelle (lat, lng, surface, référence)
├── ⚠️  Champ Zonage — affiché mais jamais peuplé
├── ✅ Copier coordonnées / Partager / Google Maps / Géoportail
├── ✅ Lien vers Analyse de Risque IA (pré-rempli)
├── ⚠️  Export PDF — bouton stub (alert), non fonctionnel
├── ✅ Historique récent (5 entrées, toggle favori)
├── ✅ Limite 5 recherches/jour pour plan Gratuit
├── ❌ Vue Satellite non restreinte au Pro
├── ❌ Territoires non restreints au Pro
├── ❌ Historique non restreint au Pro
├── ❌ Favoris non restreints au Pro
└── ❌ Recherche par lot absente
```

---

*Fichiers clés :*  
- [src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx) — composant principal  
- [src/lib/territories.ts](../src/lib/territories.ts) — APIs IGN + geo.api.gouv.fr  
- [src/lib/storage.ts](../src/lib/storage.ts) — persistance historique (MongoDB)  
- [src/lib/usage-limits.ts](../src/lib/usage-limits.ts) — limites par plan  
- [src/lib/export-risk-pdf.ts](../src/lib/export-risk-pdf.ts) — export PDF (utilisé dans RiskAnalysis, pas dans Dashboard)  
- [src/types/index.ts](../src/types/index.ts) — types `ParcelleInfo`, `GeoResult`, `SearchHistoryItem`
