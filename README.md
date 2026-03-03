# Géolocalisation Cadastrale

Application web de géolocalisation cadastrale pour les territoires français d'outre-mer : Guadeloupe, Martinique, Guyane, La Réunion et Mayotte.

## À propos

Cette application permet de rechercher et de localiser des **parcelles cadastrales** dans les DOM-TOM français. À partir de la commune, de la section et du numéro de parcelle, l'application affiche la parcelle sur une carte interactive et fournit ses coordonnées géographiques précises.

### Fonctionnalités principales

- **Recherche cadastrale** — saisie du territoire, de la commune, de la section et du numéro de parcelle
- **Carte interactive** — visualisation de la parcelle sur fond de carte (OpenStreetMap / Géoportail IGN)
- **Coordonnées GPS** — affichage et copie des coordonnées de la parcelle
- **Historique** — conservation des recherches précédentes
- **Favoris** — sauvegarde des parcelles fréquemment consultées
- **Export** — téléchargement des données de la parcelle
- **Partage** — génération d'un lien de partage

### Territoires couverts

| Code | Territoire | Région |
|------|-----------|--------|
| 971  | Guadeloupe | Antilles françaises |
| 972  | Martinique | Antilles françaises |
| 973  | Guyane | Amérique du Sud |
| 974  | La Réunion | Océan Indien |
| 976  | Mayotte | Océan Indien |

## Stack technique

- **React 19** + **TypeScript**
- **Vite 7** — serveur de développement et outil de build
- **Tailwind CSS v3** — styles utilitaires avec thème shadcn
- **shadcn/ui** — 40+ composants UI accessibles (Radix UI)
- **Leaflet** / **react-leaflet** — cartes interactives
- **React Hook Form** + **Zod** — gestion et validation des formulaires
- **Recharts** — visualisation de données
- **Axios** — client HTTP

## Démarrage rapide

### Prérequis

- Node.js 20+
- npm / yarn / pnpm

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

### Build de production

```bash
npm run build
```

### Prévisualisation du build

```bash
npm run preview
```

## Structure du projet

```
src/
  App.tsx              Composant React racine
  main.tsx             Point d'entrée
  index.css            Styles globaux
  App.css              Styles spécifiques à l'application
  components/ui/       40+ composants shadcn/ui
  hooks/               Hooks React personnalisés
  lib/                 Utilitaires partagés (territories, storage, pricing…)
  pages/               Pages de l'application (Dashboard, Favorites, History…)
  types/               Définitions TypeScript
index.html             Point d'entrée HTML
vite.config.ts         Configuration Vite
tailwind.config.js     Configuration du thème Tailwind
```

## Composants UI disponibles

`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`,
`button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`,
`command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `empty`, `field`, `form`,
`hover-card`, `input`, `input-otp`, `kbd`, `label`, `menubar`, `navigation-menu`,
`pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`,
`select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`,
`spinner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`

Exemple d'utilisation :

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
```
