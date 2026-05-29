# Car TCO Simulator — Système de design

> Source de vérité du design. Toute modification UI doit respecter ce document
> et le tenir à jour (cf. `CLAUDE.md`). Les tokens vivent dans
> `apps/web/src/assets/main.css` (`@theme`), les couleurs de data-viz dans
> `apps/web/src/composables/useChartTheme.ts`.

## 1. Direction

**Cockpit premium — dark.** L'app doit ressembler au tableau de bord d'une
voiture haut de gamme / EV : fond charbon profond, surfaces en verre dépoli
(glass), chiffres et data-viz qui « glow » en néon vert→cyan. Un seul mode
(sombre), soigné au pixel. Motion marquée mais maîtrisée (respect de
`prefers-reduced-motion`).

Trois principes :

1. **Le chiffre est le héros.** Le verdict (l'économie) est l'élément le plus
   lumineux de la page — typo géante, glow, animation au changement.
2. **Profondeur par la lumière, pas par l'ombre.** Sur fond sombre, la
   hiérarchie vient des halos (glow), du verre translucide et des bordures
   lumineuses — jamais d'ombres portées lourdes.
3. **Calme au repos, vivant à l'interaction.** Surfaces sobres ; l'énergie
   (glow, lift, sparkle) apparaît au hover, au focus et au recalcul.

## 2. Couleurs

Tokens sémantiques (ne jamais hardcoder un hex dans un composant) :

| Token | Hex | Usage |
| --- | --- | --- |
| `--color-canvas` | `#0a0c10` | Fond global (charbon) |
| `--color-canvas-elevated` | `#13161d` | Cartes, panneaux (base du glass) |
| `--color-canvas-inset` | `#0d1014` | Champs, fonds en creux |
| `--color-ink` | `#f4f6fb` | Texte principal (blanc cassé) |
| `--color-ink-muted` | `#a8b0bf` | Texte secondaire |
| `--color-ink-subtle` | `#6b7280` | Légendes, hints |
| `--color-line` | `rgba(255,255,255,.08)` | Bordures par défaut |
| `--color-line-strong` | `rgba(255,255,255,.14)` | Bordures inputs / hover |
| `--color-accent` | `#34e89e` | Vert néon — gains, validation, série B |
| `--color-accent-2` | `#22d3ee` | Cyan — extrémité du dégradé néon |
| `--color-accent-soft` | `rgba(52,232,158,.14)` | Fonds de badges accent |
| `--color-warn` | `#fbbf24` | Alertes douces |
| `--color-danger` | `#fb6f6f` | Malus, surcoûts |
| `--color-info` | `#7aa2ff` | Énergie, info |

**Dégradé signature** : `linear-gradient(135deg, #34e89e, #22d3ee)` — réservé
aux moments forts (chiffre du verdict, CTA primaire, logo, traits actifs).

**Series / data-viz** : A = blanc cassé neutre (`#cdd3df`), B = néon accent.
Les catégories de coût ont une palette dédiée *désaturée pour le sombre* dans
`useChartTheme.ts` (jamais de noir pur — il disparaît sur le canvas).

## 3. Typographie

- **Sans** : Inter (400/500/600/700/800). `font-feature-settings: 'cv11','ss01','ss03'`.
- **Mono** : JetBrains Mono — **tous les chiffres** (prix, €/mois, %), via
  `.font-num` (`tabular-nums`, `'tnum','zero'`). Les chiffres ne doivent jamais
  « danser » pendant les animations.

Échelle :

| Rôle | Taille | Poids | Tracking |
| --- | --- | --- | --- |
| Display (verdict) | `clamp(3rem, 8vw, 6rem)` | 800 | `-0.04em` |
| H1 page | `2.25–3rem` | 700 | `-0.03em` |
| H2 section | `1.125rem` | 600 | `-0.01em` |
| Body | `0.9375rem` | 400/500 | — |
| Label / eyebrow | `0.75rem` | 600, `uppercase`, `0.12em` | — |

## 4. Surfaces & profondeur

- **`.card`** — glass : `--color-canvas-elevated` à ~70% + `backdrop-blur`,
  bordure `--color-line`, highlight 1px en haut (inset light). Radius `lg` (16px).
- **`.card-glow`** — carte avec halo accent ambiant (verdict, éléments clés).
- **`.glass`** — utilitaire verre réutilisable (header, dropdowns, modale).
- Rayons : `xs 6 · sm 8 · md 10 · lg 16 · xl 24`.
- **Pas d'ombres portées sombres.** La profondeur = halos + bordures lumineuses.
  `--shadow-glow` (halo accent) et `--shadow-lift` (légère élévation au hover).

## 5. Composants

- **Boutons** : `.btn-primary` = dégradé signature, texte charbon, glow au hover,
  léger scale au press. `.btn-ghost` = bordure lumineuse, fond verre au hover.
- **Badges** : pill verre. `.badge-accent` (gain/live) avec point lumineux pulsé.
- **Inputs** : fond inset, bordure qui s'illumine au focus (ring accent translucide).
- **Slider** : piste = dégradé signature jusqu'au thumb ; thumb rond glow.
- **Tabs / segmented** (état véhicule) : actif = fond verre accent + bordure néon
  (jamais `bg-ink` qui devient invisible sur sombre).

## 6. Motion

Marquée mais jamais gratuite. Durées : micro 120ms, standard 240ms, reveal 500ms.
Easing : `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out expressif).

- **Reveal au scroll** : sections qui montent + fade (`.reveal`, via IntersectionObserver).
- **Chiffres** : comptés/animés au changement (`AnimatedNumber`), flash glow sur recalcul.
- **Charts** : tracés/barres qui se dessinent à l'apparition (animation ECharts).
- **Hover** : lift + glow sur cartes interactives, scale sur thumbs/boutons.
- **`prefers-reduced-motion`** : toutes les animations non essentielles désactivées.

## 7. Layout

- Container max `1400px`, padding `1.5rem` (mobile) → `2rem`.
- Rythme vertical entre sections : `4rem` desktop, `2.5rem` mobile.
- Fond global : charbon + **deux halos radiaux** néon très diffus (ambient mesh)
  fixés, derrière le contenu, pour la profondeur cockpit.
- Grilles 2 colonnes (`lg:`) pour cartes véhicules, charts et panneaux.

## 8. Accessibilité

- Contraste texte principal ≥ 7:1 sur canvas ; muted ≥ 4.5:1.
- Focus visible partout (ring accent), jamais supprimé sans remplacement.
- Glow et couleur ne sont jamais le **seul** porteur d'information (toujours doublé
  d'un label ou d'une forme).
- `prefers-reduced-motion` respecté globalement.
