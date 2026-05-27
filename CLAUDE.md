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
- Garder ce CLAUDE.md à jour : tout changement d'archi, commande, service, type ou constante doit être reflété ici
- Toute modification de l'UI passe par le système de design `DESIGN.md`

## Domaine TCO
Le moteur de calcul vit dans `packages/shared/src/tco/`. Fonctions pures uniquement.
Voir `PLAN.md` section 2 pour la liste exhaustive des postes de coûts.

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
