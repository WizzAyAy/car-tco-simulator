# Car TCO Simulator — Plan d'exécution

## 1. Vision produit

**Objectif** : permettre à un particulier de comparer le **coût total d'usage (TCO)** de 2 voitures sur une durée donnée (1 à 15 ans), en intégrant **tout** ce qui coûte de l'argent — pas seulement le prix d'achat.

**Insight clé** : un break essence à 10 k€ peut coûter plus cher à l'usage qu'un SUV électrique à 30 k€, selon le profil conducteur. Le simulateur doit rendre cette contre-intuition lisible et tangible.

**Cible** : particulier qui hésite entre 2 voitures (souvent essence/diesel vs électrique, ou citadine vs break/SUV).

**Non-objectifs (MVP)** :

- Pas de catalogue exhaustif de modèles — on s'appuie sur des **presets** + customisation libre
- Pas d'estimation de revente fine par modèle/millésime — on utilise des courbes de dépréciation par catégorie
- Pas de comptes utilisateurs (l'état reste local + URL partageable)

## 2. Modèle de coûts (le cœur métier)

Le TCO se décompose en **postes** sur une durée N années :

### Coûts d'acquisition

- Prix d'achat (neuf ou occasion)
- Bonus écologique / prime à la conversion (auto-calculé pour les VE)
- Coût de financement (taux + durée, optionnel — sinon cash)

### Coûts d'usage variables

- **Carburant / électricité** : `km_an × conso / 100 × prix_unitaire`
  - VE : split charge maison vs station rapide (% configurable)
  - Tarif maison : heures pleines / creuses (Tempo en option)
- **Pneus** : durée de vie en km, prix train de 4
- **Entretien périodique** : révisions, plaquettes, embrayage, courroie, vidange (différent thermique vs VE)
- **Consommables divers** : essuie-glaces, lave-glace, ampoules…

### Coûts fixes annuels

- Assurance (tiers / tous risques, bonus, profil conducteur)
- Contrôle technique (tous les 2 ans après 4 ans)
- Stationnement résidentiel (optionnel)
- Carte grise (acquisition + éventuelles révisions)
- Malus écologique (CO₂ / poids)

### Coûts de réparation

- Provision annuelle basée sur l'âge du véhicule (courbe croissante)
- Risque de panne majeure (VE : batterie ; thermique : boîte/moteur)

### Dépréciation

- Valeur résiduelle estimée à N années via courbe de dépréciation par catégorie/énergie
- **Coût réel** = prix d'achat − valeur de revente

### Externalités optionnelles (toggle)

- CO₂ émis cumulé (kg)
- Coût social du carbone (€ équivalent, base ADEME)

## 3. Profil conducteur

Inputs qui influent les calculs :

- **Kilométrage annuel** (slider 5 000 – 50 000 km)
- **Répartition urbain / route / autoroute** (3 sliders qui se complètent à 100 %)
- **Région** (impacte assurance + tarif élec local)
- **Âge / ancienneté permis** (assurance)
- **Bonus assurance** (CRM 0.50 à 1.00+)
- **Place de stationnement** : garage / rue / parking payant
- **Charge VE** : possible à domicile ? (oui/non, prise standard/wallbox)
- **Abonnement réseau de charge** (Ionity, TotalEnergies, etc. — optionnel)

## 4. Presets de véhicules

Catalogue initial (10–15 entrées) couvrant les archétypes :

| Catégorie           | Exemples                   |
| ------------------- | -------------------------- |
| Citadine essence    | Clio, 208, Polo            |
| Citadine électrique | Zoé, e-208, MG4            |
| Compacte hybride    | Yaris Cross, Niro HEV      |
| Berline diesel      | 308 BlueHDi, Golf TDI      |
| Break essence       | Octavia Combi, Megane SW   |
| Break diesel        | Passat SW, V60             |
| SUV électrique      | Tesla Model Y, ID.4, Ariya |
| SUV thermique       | 3008, Tiguan, RAV4         |
| Utilitaire familial | Berlingo, Rifter           |

Chaque preset porte : prix neuf indicatif, conso L/100 ou kWh/100, émissions CO₂, catégorie d'assurance, courbe de dépréciation, intervalles d'entretien.

L'utilisateur peut **dupliquer un preset et tweaker** chaque paramètre.

## 5. Architecture technique

### Stack

- **Frontend** : Vue 3 + TypeScript + Vite + Pinia + Vue Router + VueUse + Tailwind CSS
- **Charts** : ECharts (riche, performant, accessible) — ou Chart.js si plus simple suffit
- **Backend proxy/API** : Hono (TS, edge-ready, ultra léger) sur Node 22 — endpoint REST minimal
- **Cache backend** : in-memory (LRU) + persistance disque optionnelle pour dev
- **Tests** : Vitest + @vue/test-utils côté front ; Vitest aussi côté back
- **Type-checking** : vue-tsc
- **Lint/format** : ESLint flat config + style Antfu, Prettier intégré
- **Package manager** : pnpm 10
- **Déploiement** : Fly.io (1 service combiné : Hono sert le build statique + endpoints `/api/*`)

### Arborescence

```
car-tco-simulator/
├── apps/
│   ├── web/                    # Vue 3 SPA
│   │   ├── src/
│   │   │   ├── components/     # Présentation (boutons, sliders, cards)
│   │   │   ├── features/       # Modules métier (vehicle-form, profile-form, comparison)
│   │   │   ├── composables/    # use*() réutilisables
│   │   │   ├── stores/         # Pinia (vehicleA, vehicleB, profile, comparison)
│   │   │   ├── services/       # Appels API (vers /api/*)
│   │   │   ├── domain/         # TCO calculation engine (pur TS, testé en isolation)
│   │   │   ├── data/           # Presets véhicules
│   │   │   ├── types/          # Types globaux
│   │   │   ├── pages/          # Routes
│   │   │   └── main.ts
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   └── api/                    # Hono backend
│       ├── src/
│       │   ├── routes/         # /api/fuel-prices, /api/electricity, /api/vehicles
│       │   ├── providers/      # Adapters open APIs (data.gouv, ADEME, etc.)
│       │   ├── cache/          # LRU + TTL par provider
│       │   └── server.ts
│       └── package.json
├── packages/
│   └── shared/                 # Types partagés front/back (TCOInput, TCOResult)
├── docker-compose.yml          # Dev environment
├── fly.toml                    # Prod deploy
├── pnpm-workspace.yaml
├── DESIGN.md                   # Source of truth visuelle (créé après plan-design-review)
├── CLAUDE.md                   # Conventions projet
└── README.md
```

### Séparation domaine pur

Le moteur de calcul TCO vit dans `apps/web/src/domain/tco/` (ou dans `packages/shared` si on veut le partager côté back).
**Fonctions pures, testables en isolation** : `computeTCO(input: TCOInput): TCOResult`.
Aucune dépendance Vue, aucun fetch — uniquement de l'arithmétique.

## 6. Open APIs intégrées

| Source                        | Donnée                                                | Endpoint                                           | Cache TTL |
| ----------------------------- | ----------------------------------------------------- | -------------------------------------------------- | --------- |
| data.economie.gouv.fr         | Prix carburants par station                           | `prix-des-carburants-en-france-flux-instantane-v2` | 1 h       |
| data.gouv.fr / ADEME          | Conso/CO₂ par modèle homologué                        | dataset "véhicules commercialisés"                 | 7 j       |
| commission régulation énergie | Tarif réglementé électricité                          | scraping ou dataset CRE                            | 1 j       |
| api.gouv.fr (SIV)             | Catégorie véhicule par immatriculation (stretch goal) | —                                                  | —         |
| OpenStreetMap Overpass        | Bornes de recharge proches (stretch)                  | overpass-api                                       | 1 j       |

**Stratégie de résilience** : chaque provider a un **fallback statique** snapshoté dans le repo, utilisé si l'API est down.

## 7. Pages / flow utilisateur

### 1. Landing

Brève accroche, exemple chiffré frappant ("Saviez-vous qu'un SUV électrique peut coûter 4 000 € de moins qu'un break essence sur 5 ans pour un commuter ?"), bouton "Comparer 2 voitures".

### 2. Setup

Wizard « profil de vie » optionnel (`WizardModal`) — questionnaire guidé en 10 étapes à inputs variés (sliders, cartes à icônes, stepper) qui alimentent le scoring `rankVehicles` :

1. Kilométrage annuel · 2. Type de trajet + commute · 3. Fréquence des longs trajets · 4. Composition du foyer · 5. Besoins de volume/chargement · 6. Contrainte de stationnement · 7. Recharge à domicile · 8. Budget d'achat · 9. Durée de détention · 10. Priorité écologique.

Le wizard classe les modèles, laisse choisir la **Voiture A** parmi le top, puis sélectionne automatiquement un **équivalent thermique** (Voiture B) dans la même catégorie. Sinon, sélection manuelle des deux véhicules via le `VehiclePicker`.

Dimensions de scoring dans `packages/shared/src/wizard/lifestyle.ts` (`LifestyleProfile`). Les dimensions stationnement / volume / durée / longs trajets sont neutres à leur valeur par défaut.

### 3. Comparison (la page reine)

- Hero : "Sur 5 ans, **Voiture B coûte 3 240 € de moins** que Voiture A" — gros chiffre, couleur sémantique
- Graphique cumulé année par année (2 courbes qui se croisent ou non)
- Stacked bar par poste de coût (carburant, entretien, assurance, dépréciation, etc.)
- Tableau détaillé année par année
- **Sliders ajustables en temps réel** (km/an, prix carburant, durée) qui rafraîchissent tout
- Bouton "Partager" → URL avec état encodé (query params compressés ou base64)
- Bouton "Exporter en PDF"

### 4. Détails par voiture (drilldown)

Page dédiée à chaque voiture avec breakdown complet de chaque poste.

## 8. Direction visuelle proposée (à reviewer)

> Cette section est volontairement esquissée — `/plan-design-review` va la durcir.

**Aesthetic** : data-driven, moderne, premium-mais-accessible.

**Palette préliminaire** :

- Fond : off-white `#FAFAF9` (clair) / `#0A0A0B` (dark)
- Texte : `#0A0A0B` / `#FAFAF9`
- Accent primaire : un vert profond pour l'économie / le positif (`#10B981` env.)
- Accent secondaire : ambre pour le warning / surcoût (`#F59E0B`)
- Neutres : 9 niveaux de gris

**Typographie** :

- Display : **Geist** (ou Inter Display) pour les gros chiffres
- Body : **Inter** ou **Geist**
- Mono : **JetBrains Mono** pour les data tables et tooltips chiffrés

**Composants signature** :

- "Big number" card avec animation de compteur quand la valeur change
- Sliders custom avec rail dégradé et bulle de valeur
- Graphiques ECharts thémés (pas le style par défaut)
- Cards avec fine bordure et hover subtil

**Motion** :

- Transitions de valeurs (compteurs qui s'animent en 400 ms quand un slider bouge)
- Reveal des charts au scroll
- Pas d'animations gadget — tout doit servir la lisibilité des chiffres

## 9. Découpage des livraisons

### Phase 0 — Setup (jour 1)

- Scaffolding pnpm workspace, Vite, Vue 3, Hono, Tailwind, Pinia
- ESLint Antfu, Prettier, Vitest config
- CI minimale (type-check + lint + test)
- README + CLAUDE.md

### Phase 1 — Moteur de calcul (jour 2)

- Types `TCOInput` / `TCOResult` dans `packages/shared`
- `computeTCO()` fonction pure, **testée à 100 %** avec scénarios connus
- Presets de véhicules en dur (10 entrées)
- Courbes de dépréciation par catégorie

### Phase 2 — Backend & APIs (jour 3)

- Hono routes : `/api/fuel-prices`, `/api/electricity-tariffs`, `/api/vehicle-catalog`
- Providers + cache LRU + fallbacks statiques
- Tests d'intégration des providers (mocked)

### Phase 3 — UI Setup & Profile (jour 4-5)

- Layout général, dark mode toggle
- Wizard / formulaire profile conducteur
- Sélecteur de preset + édition fine voiture A et B
- Store Pinia + URL sync

### Phase 4 — Page Comparison (jour 6-7)

- Hero verdict
- Charts ECharts (cumul + stacked bar)
- Tableau détaillé
- Réactivité temps réel des sliders

### Phase 5 — Polish (jour 8)

- Animations / motion
- Export PDF
- Partage URL
- Responsive mobile complet
- Accessibilité (lighthouse a11y > 95)

### Phase 6 — Déploiement (jour 9)

- Dockerfile production
- Fly.io setup, domaine, HTTPS
- Monitoring basique (logs structurés)

## 10. Risques & inconnues

1. **CORS / rate-limits open APIs** → mitigé par le backend proxy + cache + fallback statique
2. **Précision des courbes de dépréciation** → on annonce clairement "estimation", on cite la source
3. **Tempo / heures creuses** complexe à modéliser → version simplifiée en MVP (un seul tarif moyen), option avancée en v2
4. **Performance des sliders temps réel** → debounce 50 ms + recalcul incrémental si lent
5. **Catalogue véhicules** : risque d'incomplétude → on accepte, on guide vers la duplication+édition

## 11. Tests et qualité

- **Domaine TCO** : couverture 100 % avec snapshots de calculs
- **Composants Vue** : tests d'interaction sur les pièces critiques (sliders, formulaires)
- **API backend** : tests d'intégration avec providers mockés
- **E2E** : 2-3 scénarios Playwright sur le flow complet
- **Type-check** : `vue-tsc --noEmit` doit passer en CI
- **Lint** : ESLint Antfu strict

## 12. Out of scope MVP

- Comparaison à 3+ voitures
- Comptes utilisateurs et sauvegarde cloud
- Catalogue exhaustif de tous les modèles France (on garde presets + édition)
- Géocodage de l'adresse pour prix carburants locaux exacts (on prend une moyenne régionale)
- Simulation leasing/LOA
- Mobile app native
