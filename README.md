# Cadastral Geolocalisation

A web application for cadastral geolocalisation built with React, TypeScript, Vite, and Leaflet maps.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 7** — fast dev server and build tool
- **Tailwind CSS v3** — utility-first styling with shadcn theme
- **shadcn/ui** — 40+ accessible UI components (Radix UI)
- **Leaflet** / **react-leaflet** — interactive maps
- **React Hook Form** + **Zod** — form handling and validation
- **Recharts** — data visualisation
- **Axios** — HTTP client

## Getting Started

### Prerequisites

- Node.js 20+
- npm / yarn / pnpm

### Install

```bash
npm install
```

### Develop

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

```
src/
  App.tsx              Root React component
  main.tsx             Entry point
  index.css            Global styles
  App.css              App-specific styles
  components/ui/       40+ shadcn/ui components
  hooks/               Custom React hooks
  lib/                 Shared utilities
index.html             HTML entry point
vite.config.ts         Vite configuration
tailwind.config.js     Tailwind theme configuration
```

## Available UI Components

`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`,
`button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`,
`command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `empty`, `field`, `form`,
`hover-card`, `input`, `input-otp`, `kbd`, `label`, `menubar`, `navigation-menu`,
`pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`,
`select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`,
`spinner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`

Usage:

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
```

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
