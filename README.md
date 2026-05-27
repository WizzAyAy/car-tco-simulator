# Car TCO Simulator

Web app pour simuler et comparer le **coût total d'usage (TCO)** de 2 voitures sur une durée configurable. Carburant, entretien, assurance, dépréciation, malus, financement, coût social du carbone — tout est inclus.

> **Insight clé** : un break essence à 10 k€ peut coûter plus cher à l'usage qu'un SUV électrique à 30 k€, selon le profil conducteur. Le simulateur rend cette contre-intuition lisible.

## Stack

- **Frontend** : Vue 3 + TypeScript + Vite + Pinia + Vue Router + VueUse + Tailwind CSS v4
- **Charts** : ECharts via vue-echarts
- **Backend** : Hono + TS (sert le bundle web + proxy open APIs avec cache LRU)
- **Domaine partagé** : `@cts/shared` — moteur TCO en TS pur, testé en isolation
- **Package manager** : pnpm 10 (workspaces)
- **Tests** : Vitest
- **Lint** : ESLint flat config (style Antfu)
- **Type-check** : vue-tsc + tsc strict (`noUncheckedIndexedAccess` activé)

## Arborescence

```
car-tco-simulator/
├── apps/
│   ├── web/                Vue 3 SPA
│   └── api/                Hono backend (proxy + statique)
├── packages/
│   └── shared/             Types + moteur TCO + presets véhicules
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
pnpm typecheck   # tous les packages
pnpm lint
pnpm test        # 10 tests sur le moteur TCO
pnpm build
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
- Intérêts du crédit (si financement activé)
- Dépréciation (courbe par catégorie × énergie)
- Coût social du carbone (optionnel, base ADEME)

### Backend (`apps/api`)

Routes minimales :

- `GET /api/health`
- `GET /api/fuel-prices` — proxy data.gouv.fr (prix carburants instantané), TTL 1 h
- `GET /api/electricity-tariffs` — tarifs réglementés + bornes publiques, TTL 24 h
- `GET /api/vehicle-presets` — catalogue de presets

Chaque provider a un **fallback statique** snapshoté pour résilience si l'API publique est down.

En production, Hono sert aussi le build statique du web depuis `apps/web/dist/`.

### Frontend (`apps/web`)

- **Pinia store** `useSimulationStore` : véhicule A, véhicule B, profil, durée, paramètres → résultats calculés en `computed`.
- **URL state sync** : l'état est encodé en query param `?s=…` à chaque modification → partageable.
- **Live prices** : au chargement, fetch des prix carburants + élec et écrasement des valeurs par défaut.

### Routes

- `/` — comparateur interactif (page reine), état partageable via `?s=…`.
- `/compare` — index SEO listant les comparatifs populaires (maillage interne).
- `/compare/:slugA-vs-:slugB` — comparatif pré-rempli par slug (le slug est l'`id` du preset, ex. `clio-essence-vs-e208-electric`). Met à jour `<title>` et `<meta name="description">` par comparaison.
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

- Pas de catalogue exhaustif de modèles — duplique un preset et tweake.
- Tempo / heures creuses simplifié (un seul tarif moyen) — version avancée en v2.
- Pas de géocodage des prix locaux par adresse — moyenne nationale.
- Pas de simulation LOA / leasing — uniquement achat (cash ou crédit auto classique).

## Licence

MIT.
