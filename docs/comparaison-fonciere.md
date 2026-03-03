# Comparaison Foncière

> **Route :** `/comparison` — accès protégé (authentification Clerk requise)  
> **Fichier source :** `src/pages/ParcelComparison.tsx`  
> **Entrée de navigation :** Sidebar → _Comparaison_ (icône `TrendingUp`)

---

## Vue d'ensemble

Le tableau de bord **Comparaison Foncière** permet d'analyser jusqu'à **5 parcelles cadastrales côte à côte**. Pour chaque parcelle, l'interface calcule automatiquement un ensemble de métriques foncières (prix au m², potentiel constructible, ROI estimé, score de risque…) et met en évidence la meilleure parcelle sur chaque critère. L'ensemble peut être exporté en PDF, partagé par lien ou envoyé par e-mail.

---

## Structure de la page

```
┌─────────────────────────────────────────────┐
│  Barre de titre + actions (top bar)          │
├─────────────────────────────────────────────┤
│  Bandeau « Meilleurs résultats »             │
├─────────────────────────────────────────────┤
│  Vue côte à côte — cartes parcelles         │
├─────────────────────────────────────────────┤
│  Tableau comparatif détaillé (extensible)   │
└─────────────────────────────────────────────┘
```

---

## Barre de titre

| Élément | Description |
|---|---|
| **Ajouter une parcelle** | Ouvre la boîte de dialogue de saisie. Désactivé lorsque 5 parcelles sont déjà chargées. |
| **X/5 parcelles** | Badge indiquant le nombre de parcelles actuellement comparées. |
| **Vider** | Supprime toutes les parcelles de la comparaison (avec toast de confirmation). |
| **Exporter ▼** | Menu déroulant : _Télécharger PDF_, _Copier le lien_, _Envoyer par e-mail_. |

---

## Bandeau « Meilleurs résultats »

Affiché dès que **≥ 2 parcelles** sont présentes. Il récapitule sur une ligne la commune gagnante pour chacun des cinq critères automatiques :

| Icône | Critère | Logique de sélection |
|---|---|---|
| 💰 | Meilleur prix/m² | Prix d'achat ÷ surface totale — valeur la plus **basse** |
| 🏗️ | Meilleur potentiel construction | Potentiel SHON (m²) — valeur la plus **haute** |
| ⚡ | Moins de risques | Score de risque (0-100) — valeur la plus **basse** |
| 🏆 | Meilleur score global | Score global (0-100) — valeur la plus **haute** |
| 📈 | Meilleur ROI estimé | ROI calculé (%) — valeur la plus **haute** |

---

## Vue côte à côte — cartes parcelles

Chaque parcelle est représentée par une carte verticale défilable horizontalement. Une carte **« Ajouter + »** est toujours visible à droite tant que la limite de 5 n'est pas atteinte.

### Contenu d'une carte

#### En-tête
- **Mini-carte Leaflet** (OpenStreetMap, zoom 15, non interactive) centrée sur les coordonnées GPS de la parcelle.
- **Référence cadastrale** au format `{territoire}-{commune}-{section}-{numéro}`.
- **Commune** d'appartenance.

#### Corps — métriques affichées

| Champ | Calcul / source |
|---|---|
| Zonage | Zone PLU (U, AU, A, N) |
| Surface totale | m² — saisie utilisateur |
| dont constructible | m² — saisie ou 70 % de la surface totale par défaut |
| Prix d'achat | € — saisie utilisateur |
| €/m² | `prix ÷ surface totale` |
| €/m² constructible | `prix ÷ surface constructible` |
| Potentiel SHON | m² SHON estimés |
| ROI estimé | `((prix_vente - prix_achat - frais_notaire) / (prix_achat + frais_notaire)) × 100` avec frais de notaire = 8 % du prix d'achat et prix de vente = `surface × prix_moyen_marché` |
| Prix marché (€/m²) | Prix moyen au m² du marché local + icône de tendance (↗ HAUSSE / → STABLE / ↘ BAISSE) |
| Score de risque | 0-100 · 🟢 ≤ 20 · 🟡 ≤ 40 · 🟠 ≤ 60 · 🔴 > 60 |
| Score global | 0-100, barre de progression colorée |
| Servitudes | Liste textuelle ; absente si aucune servitude |

#### Mise en évidence des gagnants
- La carte ayant le **meilleur score global** est encadrée d'une bordure verte (`ring-2 ring-emerald-500`).
- Un badge **🏆 Meilleur** (ou **N× Meilleur** si la parcelle gagne plusieurs critères) apparaît en haut de la carte.
- Chaque métrique gagnante affiche une coche verte ✓ avec une infobulle précisant le critère remporté.

#### Actions par carte
| Bouton | Action |
|---|---|
| **Détail** (📄) | Ouvre la modale de détail complet |
| **Supprimer** (🗑️) | Retire la parcelle de la comparaison |

---

## Boîte de dialogue — Ajouter une parcelle

Accessible via le bouton « Ajouter une parcelle » de la barre de titre ou la carte « + ».

### Champs du formulaire

| Champ | Obligatoire | Remarque |
|---|---|---|
| Territoire | ✅ | Sélecteur parmi les territoires caribéens définis dans `CARIBBEAN_TERRITORIES` |
| Commune | ✅ | Texte libre |
| Section | ✅ | 1 ou 2 caractères (converti en majuscules) |
| Numéro | ✅ | Référence numérique de la parcelle |
| Surface totale (m²) | ✅ | Valeur positive |
| Surface constructible (m²) | ❌ | Si vide, calculée automatiquement à **70 % de la surface totale** |
| Prix d'achat (€) | ✅ | Valeur positive |

### Traitement à la soumission

1. **Validation** — des messages d'erreur inline s'affichent sous les champs invalides.
2. **Simulation d'enrichissement** — un indicateur de chargement tourne pendant ~900 ms (remplaçable par un appel API réel).
3. **Génération de la référence** — `{territoire}-{4 premières lettres commune}-{section}-{numéro}`.
4. **Coordonnées GPS** — centre du territoire ± décalage aléatoire (à remplacer par l'API Géoportail).
5. **Métriques simulées** — zonage, COS, potentiel SHON, prix marché et tendance sont générés aléatoirement (à remplacer par les sources de données réelles).
6. Un **toast de confirmation** confirme l'ajout.

> **Limite :** maximum 5 parcelles simultanées. Le bouton « Ajouter » est désactivé au-delà.

---

## Modale de détail

Ouverte depuis le bouton **Détail** d'une carte. Affiche :

- Mini-carte Leaflet centrée sur la parcelle.
- Grille 2 colonnes avec l'ensemble des métriques (zonage, COS, surfaces, prix, SHON, ROI, scores, marché, tendance).
- Section **Servitudes & contraintes** en orange si des servitudes existent.

---

## Tableau comparatif détaillé

Section extensible (cliquable) affichée dès que **≥ 2 parcelles** sont present.

### Colonnes
Une colonne par parcelle, avec en en-tête la référence cadastrale et la commune.

### Lignes disponibles

| Ligne | Gagnant mis en avant |
|---|---|
| Territoire | — |
| Commune | — |
| Référence cadastrale | — |
| Zonage PLU | — |
| Surface totale | — |
| Surface constructible | — |
| COS ⓘ | — |
| Prix d'achat | — |
| €/m² ⓘ | ✅ Meilleur prix/m² |
| €/m² constructible ⓘ | — |
| Potentiel SHON | ✅ Meilleur potentiel |
| ROI estimé | ✅ Meilleur ROI |
| Prix marché (€/m²) | — |
| Score de risque | ✅ Moins de risques |
| Score global | ✅ Meilleur score |
| Servitudes | — |

Les cellules correspondant à un gagnant sont colorées en vert clair (`bg-emerald-50`) avec un badge **✓ Meilleur**. Les colonnes ⓘ affichent une infobulle au survol.

---

## Export et partage

### Télécharger PDF
Déclenche une simulation de génération PDF (900 ms) avec un toast de progression. À connecter à `react-pdf` ou Puppeteer en production.

### Copier le lien
Génère l'URL `{origin}/comparison?ids={id1},{id2},...` et la copie dans le presse-papiers via l'API `navigator.clipboard`. Valable 30 jours (à implémenter côté backend).

### Envoyer par e-mail
Ouvre le client de messagerie par défaut via `mailto:` avec un objet et un corps pré-remplis. À intégrer avec **Resend** pour un envoi depuis le serveur avec PDF en pièce jointe.

---

## Types TypeScript

Définis dans `src/types/index.ts`.

### `ComparisonParcel`

```typescript
interface ComparisonParcel {
  id: string;
  ref: string;                     // Référence formatée
  territoire: string;              // Code territoire (ex. '971')
  commune: string;
  section: string;
  numero: string;
  lat: number;
  lng: number;
  surface: number;                 // m² — surface totale
  surfaceConstructible: number;    // m²
  prix: number;                    // € — prix d'achat
  zonage: string;                  // ex. 'U', 'AU', 'A', 'N'
  riskScore: number;               // 0-100
  scoreGlobal: number;             // 0-100
  cos: string;                     // Coefficient d'Occupation du Sol
  potentielSHON: number;           // m² SHON estimés
  prixMoyenM2Marche: number;       // €/m² — prix moyen du marché local
  tendanceMarche: 'HAUSSE' | 'STABLE' | 'BAISSE';
  servitudes: string[];            // Liste des servitudes
  addedAt: number;                 // timestamp Unix
}
```

### `ComparisonWinnerKey`

```typescript
type ComparisonWinnerKey =
  | 'meilleurPrixM2'
  | 'meilleureConstruction'
  | 'moinsDeRisques'
  | 'scoreGlobal';
```

---

## Formules de calcul

$$\text{Prix/m}^2 = \frac{\text{Prix d'achat}}{\text{Surface totale}}$$

$$\text{Prix/m}^2_{\text{constr.}} = \frac{\text{Prix d'achat}}{\text{Surface constructible}}$$

$$\text{ROI estimé} = \frac{\text{Prix vente} - \text{Prix achat} - \text{Frais notaire}}{\text{Prix achat} + \text{Frais notaire}} \times 100$$

où :
- $\text{Prix vente} = \text{Surface totale} \times \text{Prix moyen marché (€/m}^2\text{)}$
- $\text{Frais notaire} = \text{Prix achat} \times 8\,\%$

---

## Données de démonstration

Trois parcelles pré-chargées permettent de tester l'interface sans configuration backend :

| Référence | Commune | Surface | Prix | Zonage | Score |
|---|---|---|---|---|---|
| `971-0100-A-0023` | Basse-Terre | 1 200 m² | 102 000 € | U | 92 |
| `971-0234-B-0108` | Pointe-à-Pitre | 800 m² | 96 000 € | AU | 78 |
| `972-0056-C-0045` | Le Lamentin | 1 500 m² | 105 000 € | U | 88 |

---

## Évolutions prévues

- **Connexion aux APIs réelles** : Géoportail (contours, surface officielle), DGFIP (valeur foncière), PLU/cadastre (zonage), Risk Score (existant).
- **Cache Redis 24 h** : éviter les appels répétés pour une même référence cadastrale.
- **Enrichissement IA (Claude)** : extraction du COS/CEP depuis le texte brut du PLU et identification des contraintes.
- **Sélection depuis la carte** : clic sur une parcelle dans le Dashboard → ajout direct à la comparaison.
- **Sélection depuis l'historique** : bouton « Ajouter à la comparaison » sur chaque entrée de l'historique ou des favoris.
- **Partage sécurisé** : URL temporaire (30 jours) avec vue client simplifiée (sans les outils pro).
- **Export PDF complet** : template brandé avec cartes côte à côte, tableau et logo.
- **Envoi Resend** : e-mail avec PDF en pièce jointe et modèle personnalisable.
