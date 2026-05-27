# Car TCO Simulator

[![CI](https://github.com/WizzAyAy/car-tco-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/WizzAyAy/car-tco-simulator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#licence)

Web app pour simuler et comparer le **coût total d'usage (TCO)** de 2 voitures sur une durée configurable. Carburant, entretien, assurance, dépréciation, malus, financement (cash / crédit / **LOA**), coût social du carbone — tout est inclus.

> **Insight clé** : un break essence à 10 k€ peut coûter plus cher à l'usage qu'un SUV électrique à 30 k€, selon le profil conducteur. Le simulateur rend cette contre-intuition lisible.

## Fonctionnalités

- **Moteur TCO pur** — calcul année-par-année, poste-par-poste, testé en isolation.
- **Catalogue large + recherche** — ~100 modèles réels (marché France) dans un sélecteur recherchable (filtres catégorie/énergie), plus des **archétypes de segment** ("SUV électrique", "Citadine hybride"…) aux specs/prix médians pour comparer des usages sans dépendre d'un modèle.
- **3 modes d'acquisition** — achat cash, crédit auto, ou **LOA/LLD** (loyers, apport, forfait km, option d'achat).
- **Point de bascule** — le seuil de km/an à partir duquel la voiture gagnante s'inverse.
- **Analyse de sensibilité (tornado)** — quelle hypothèse pèse le plus sur l'écart (km, prix énergie, dépréciation, durée, taux).
- **Prix en temps réel** — carburants et électricité via les open data, avec fallback statique snapshoté.
- **Partage social** — image Open Graph générée dynamiquement (`/api/og`) + meta injectées par comparaison (côté serveur pour les crawlers, côté client pour le SEO).
- **Pages SEO** `/compare/:a-vs-:b`, **recommandation inversée** `/recommend`, et **widget `<iframe>`** `/embed`.

## Stack

- **Frontend** : Vue 3 + TypeScript + Vite + Pinia + Vue Router + VueUse + Tailwind CSS v4
- **Charts** : ECharts via vue-echarts
- **Backend** : Hono + TS (sert le bundle web + proxy open APIs avec cache LRU + génération d'image OG)
- **Domaine partagé** : `@cts/shared` — moteur TCO en TS pur, testé en isolation
- **Package manager** : pnpm 10 (workspaces)
- **Tests** : Vitest · **Lint** : ESLint flat config (style Antfu) · **Type-check** : vue-tsc + tsc strict (`noUncheckedIndexedAccess`)
- **CI** : GitHub Actions (typecheck + lint + test + build)

## Arborescence

```
car-tco-simulator/
├── apps/
│   ├── web/                Vue 3 SPA
│   └── api/                Hono backend (proxy + OG image + statique)
├── packages/
│   └── shared/             Types + moteur TCO + presets véhicules
├── .github/workflows/      CI
├── PLAN.md                 Plan d'exécution détaillé
├── CLAUDE.md               Conventions projet
└── README.md
```

## Démarrer

Prérequis : Node ≥ 22, pnpm 10.

```bash
pnpm install

# Lancer web + api en parallèle (recommandé)
pnpm dev
# → web sur http://localhost:5173
# → api sur http://localhost:5174

# Ou séparément
pnpm dev:web
pnpm dev:api
```

## Qualité

```bash
pnpm typecheck   # tous les packages (vue-tsc + tsc)
pnpm lint        # eslint (style Antfu)
pnpm test        # vitest — moteur TCO (41 tests)
pnpm build       # build web + api
```

## Architecture

### Moteur TCO (`packages/shared/src/tco`)

Fonctions pures, aucune dépendance Vue ou réseau. Entrée : un `TCOInput` (véhicule + profil + paramètres). Sortie : un `TCOResult` avec breakdown année-par-année et par poste de coût.

Postes couverts :

- Carburant / électricité (mix charge maison + borne rapide pour VE)
- Entretien périodique (modulé par âge du véhicule)
- Pneus (proratisé sur durée de vie + km)
- Consommables (essuie-glaces, lave-glace…)
- Assurance (tier × catégorie × bonus-malus × âge conducteur)
- Contrôle technique (à partir de l'année 4)
- Stationnement résidentiel
- Carte grise (année 1)
- Bonus / Malus écologique (année 1, peut être négatif)
- Réparations (provision croissante avec l'âge, VE = -45 %)
- Intérêts du crédit (mode `credit`)
- **Loyers LOA/LLD** (mode `leasing` : apport + loyers + dépassement de forfait km)
- Dépréciation (courbe par catégorie × énergie ; nulle en leasing sans option d'achat)
- Coût social du carbone (optionnel, base ADEME)

> **Modes d'acquisition** : `TCOInput.acquisitionMode` ∈ `'cash' | 'credit' | 'leasing'`. Voir `CLAUDE.md` pour le détail du modèle LOA (option d'achat, valeur résiduelle, hypothèses).

L'analyse de sensibilité (point de bascule km + tornado) vit dans `tco/sensitivity.ts`, également pure et testée.

### Backend (`apps/api`)

- `GET /api/health`
- `GET /api/fuel-prices` — proxy data.gouv.fr (prix carburants instantané), TTL 1 h
- `GET /api/electricity-tariffs` — tarifs réglementés + bornes publiques, TTL 24 h
- `GET /api/vehicle-presets` — catalogue de presets
- `GET /api/og?winner=&loser=&savings=&duration=` — image Open Graph 1200×630 (satori + resvg), cache 24 h

Chaque provider de données a un **fallback statique** snapshoté pour résilience si l'API publique est down. En production, Hono sert le build statique du web depuis `apps/web/dist/` et **injecte les meta sociales par comparaison** sur les routes `/compare/:a-vs-:b`.

### Frontend (`apps/web`)

- **Pinia store** `useSimulationStore` : véhicule A, véhicule B, profil, durée, mode d'acquisition, paramètres → résultats calculés en `computed`.
- **URL state sync** : l'état est encodé en query param `?s=…` à chaque modification → partageable.
- **Live prices** : au chargement, fetch des prix carburants + élec et écrasement des valeurs par défaut.

### Routes

- `/` — comparateur interactif (page reine), état partageable via `?s=…`.
- `/compare` — index SEO listant les comparatifs populaires (maillage interne).
- `/compare/:slugA-vs-:slugB` — comparatif pré-rempli par slug (le slug est l'`id` du preset, ex. `clio-essence-vs-e208-electric`). `<title>`, `<meta name="description">` et meta sociales par comparaison.
- `/recommend` — recommandation inversée : un profil léger (km/an, type de trajet, budget, charge maison) classe **tous** les presets par TCO et met en avant le moins cher.
- `/embed` — version compacte sans chrome (verdict + courbe cumulée), à intégrer en `<iframe>`.

## Embed

La route `/embed` rend une version compacte et sans habillage (pas de header ni footer) du verdict et du graphique de coût cumulé, prévue pour une intégration `<iframe>` sur un site tiers.

Les deux véhicules se choisissent par slug via les query params `a` et `b` (le slug est l'`id` du preset, ex. `clio-essence`, `e208-electric`, `model3-electric`).

```html
<iframe
  src="https://car-tco-simulator.fly.dev/embed?a=clio-essence&b=e208-electric"
  width="100%"
  height="560"
  style="border: 0; border-radius: 12px; overflow: hidden"
  loading="lazy"
  title="Comparatif coût total : Clio essence vs e-208 électrique"
></iframe>
```

Sans query params, l'`iframe` retombe sur le couple de véhicules par défaut du store. Le widget inclut un lien vers le comparatif détaillé (`/compare/:slugA-vs-:slugB`).

## Open Data

- **data.economie.gouv.fr** — prix carburants instantanés par station
- **ADEME** — émissions CO₂ et consommations homologuées
- Mix électrique France ~56 g CO₂/kWh (RTE / ADEME)

## Limites connues / Roadmap

- Pas de catalogue exhaustif de modèles — ~100 presets réels, des archétypes de segment, et la duplication/édition d'un preset pour le reste.
- Tempo / heures creuses simplifié (un seul tarif moyen) — version avancée en v2.
- Pas de géocodage des prix locaux par adresse — moyenne nationale.
- Lecture par plaque (SIV) — envisagée, en attente (API tierce + donnée personnelle).

## Licence

MIT.
