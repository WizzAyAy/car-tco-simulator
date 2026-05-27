# Car TCO Simulator — Instructions projet

## Vue d'ensemble

Web app de simulation et comparaison du coût total d'usage (TCO) de 2 voitures. Voir `PLAN.md` pour le plan d'exécution complet et `DESIGN.md` (à venir) pour le système de design.

## Stack

- **Frontend** : Vue 3 + TypeScript + Vite + Pinia + Vue Router + VueUse + Tailwind CSS
- **Charts** : ECharts
- **Backend** : Hono (TS) sur Node 22 — proxy open APIs avec cache
- **Package manager** : pnpm 10 (workspaces)
- **Tests** : Vitest + @vue/test-utils
- **Lint** : ESLint flat config (style Antfu) + Prettier
- **Type-check** : vue-tsc
- **Déploiement** : Fly.io

## Architecture monorepo

```
apps/web/      — SPA Vue 3
apps/api/      — Backend Hono (proxy APIs externes)
packages/shared/ — Types et moteur TCO partagés
```

## Conventions de code

- Code, commits, branches, comments → **English**
- Communication avec l'utilisateur → **français**
- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`)
- Pas de commentaires inutiles — laisser les noms parler
- Pas de `any` TS — typer correctement à la source
- Pas de `// @ts-ignore` — toujours vrai fix
- Fonctions pures pour le domaine TCO (testables sans Vue ni fetch)

## Workflow

- Toujours lire le code existant avant de modifier
- Tests sur demande uniquement (sauf pour le moteur TCO qui doit rester couvert)
- **Docs toujours synchrones avec le code** : toute PR qui change l'archi, une commande, un service, une route, un type, une constante ou un poste de coût doit mettre à jour **tous** les fichiers `.md` concernés dans le même commit — `CLAUDE.md` (conventions/archi), `README.md` (usage public + features), `PLAN.md` (plan/scope), `DESIGN.md` (système de design). Un `.md` périmé est traité comme un bug. `CLAUDE.md` reste la source de vérité des conventions, `README.md` celle de l'usage.
- Toute modification de l'UI passe par le système de design `DESIGN.md`

## Domaine TCO

Le moteur de calcul vit dans `packages/shared/src/tco/`. Fonctions pures uniquement.
Voir `PLAN.md` section 2 pour la liste exhaustive des postes de coûts.

### Catalogue véhicules

- `VEHICLE_PRESETS` (`vehicles/presets.ts`) : modèles réels du marché France.
- `VEHICLE_ARCHETYPES` (`vehicles/archetypes.ts`) : « méta-voitures » fictives, une par couple (catégorie × énergie) ayant ≥ 3 modèles réels. Chaque spec = **médiane** du segment, calculée en priorité sur les modèles **grand public** (les marques premium de `PREMIUM_BRANDS` sont écartées tant qu'il reste ≥ 3 modèles grand public, sinon on retombe sur le bucket complet — cas des segments réellement premium type berline élec). `buildArchetypes()` est pure. Marquées `isArchetype: true`. Servent à comparer des usages sans dépendre d'un modèle ; l'âge reste géré par `purchaseCondition`.
- `ALL_VEHICLES` = presets + archétypes. `findPresetById()` (dans `vehicles/index.ts`) résout les deux — l'utiliser pour toute résolution d'id.

### Mode d'acquisition

`TCOInput.acquisitionMode: 'cash' | 'credit' | 'leasing'` (optionnel — fallback dérivé de `financing.enabled`).

- `cash` / `credit` : achat, dépréciation = prix − valeur résiduelle. Le crédit ajoute les intérêts via `financing` (`tco/financing.ts`).
- `leasing` (LOA/LLD) : config `TCOInput.leasing` (`tco/leasing.ts`). Loyers + apport + dépassement km dans la catégorie `leasing` ; dépréciation = 0 (pas de propriété) ; carte grise/malus = 0 par défaut. Avec option d'achat (LOA), le prix d'option est payé en fin de bail et la valeur résiduelle lui est égale (option supposée correctement tarifée → impact net nul, hypothèse conservatrice). `credit` et `leasing` sont mutuellement exclusifs.
- Catégories de coût : voir l'enum `CostCategory` dans `types/index.ts`. Toute nouvelle catégorie doit être ajoutée à `EMPTY_COSTS` (compute.ts), `CATEGORY_LABELS`/`CATEGORY_COLORS` (`apps/web/src/composables/useChartTheme.ts`) et `CATEGORIES_ORDER` (`BreakdownChart.vue`).

## Open APIs intégrées

Voir `PLAN.md` section 6. Toutes les intégrations passent par `apps/api` avec cache + fallback statique snapshoté.

## Commandes (à mettre à jour après le setup)

```bash
# Dev
pnpm dev              # lance web + api en parallèle
pnpm dev:web          # SPA seule
pnpm dev:api          # backend seul

# Qualité
pnpm typecheck        # vue-tsc + tsc côté api
pnpm lint             # eslint
pnpm test             # vitest

# Build / prod
pnpm build            # build web + api
pnpm start            # lance le serveur Hono (sert le build statique + /api)
```
