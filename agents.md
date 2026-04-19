# The Unknown Collective — Repo Structure for Agents

Quick reference for AI agents working in this repo. Read this alongside `CLAUDE.md` for full workflow context.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router v7 (HashRouter) |
| Styling | CSS Modules + global tokens |
| Data | Static JS files (no backend) |
| Build | `npm run build` → `dist/` |
| Dev | `npm run dev` → `http://localhost:5173` |

---

## File Map

```
unknown-collective/
├── CLAUDE.md                    ← Workflow docs + character schema
├── agents.md                    ← This file
├── index.html
├── vite.config.js
├── package.json
│
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── assets/
│       ├── echos/               ← Character portraits: <slug>.png (22 files)
│       ├── stories/             ← Scene/narrative images
│       ├── artifacts/           ← Object/artifact images
│       ├── botanics/            ← Botanical illustrations
│       ├── textures/            ← Background textures (damask, dark-leaf, snow)
│       └── videos/              ← Video assets
│
└── src/
    ├── main.jsx                 ← Mounts <App /> to DOM
    ├── App.jsx                  ← Route definitions (7 routes)
    │
    ├── styles/
    │   ├── tokens.css           ← Design tokens: colors, spacing, type scale
    │   └── global.css           ← Base resets, layout utilities, type classes
    │
    ├── components/
    │   ├── Nav.jsx / .module.css
    │   ├── Footer.jsx / .module.css
    │   ├── DecoRule.jsx / .module.css   ← Decorative horizontal rule
    │   ├── DecoCorner.jsx / .module.css ← Decorative corner ornament
    │   └── TextureBackdrop.jsx / .module.css
    │
    ├── pages/
    │   ├── Home.jsx / .module.css
    │   ├── Collective.jsx / .module.css  ← Grid of all 22 characters
    │   ├── Character.jsx / .module.css   ← Individual character detail page
    │   ├── Tiers.jsx / .module.css       ← Tier overview (5 tiers)
    │   ├── Manifesto.jsx / .module.css
    │   ├── Chronicle.jsx / .module.css   ← Questions/interactive section
    │   └── About.jsx / .module.css
    │
    └── data/
        ├── characters.js        ← Master array: CHARACTERS (22 entries, ordered n: 0–21)
        ├── bios.js              ← Generated: { slug: [...paragraphs] } — do not edit manually
        ├── bios/                ← Source markdown: <slug>.md — edit these
        │   ├── florist.md
        │   ├── curator.md
        │   ├── oracle.md
        │   ├── duchess.md
        │   └── ... (22 total)
        ├── sync-bios.js         ← Script: reads bios/*.md → writes bios.js
        ├── BIOS_WORKFLOW.md     ← Notes on bio sync process
        ├── tiers.js             ← Tier metadata (grounded, custodians, guardians, luminaries, guides)
        └── questions.js         ← Chronicle page content
```

---

## Routes

| Path | Page | Notes |
|---|---|---|
| `/` | Home | Landing page |
| `/collective` | Collective | Grid of all 22 characters |
| `/character/:slug` | Character | Detail page; slug matches `CHARACTERS[n].slug` |
| `/tiers` | Tiers | 5-tier overview |
| `/manifesto` | Manifesto | |
| `/chronicle` | Chronicle | Interactive questions |
| `/about` | About | |

---

## Data Flow

```
Notion (source of truth)
  ↓  notion-search / notion-fetch
bios/<slug>.md          (human-readable source)
  ↓  npm run sync-bios
bios.js                 (generated, auto-import)
  ↓  import { bios }
characters.js           (references bios.<slug>)
  ↓  import { CHARACTERS }
Character.jsx           (renders DetailedCharacter or StubCharacter)
```

**Never edit `bios.js` directly.** Edit the `.md` file, then run `npm run sync-bios`.

---

## Character Slugs (all 22)

| n | Arcana | Slug |
|---|---|---|
| 0 | The Fool | `florist` |
| 1 | The Magician | `curator` |
| 2 | The High Priestess | `oracle` |
| 3 | The Empress | `gardener` |
| 4 | The Emperor | `merchant-prince` |
| 5 | The Hierophant | `duchess` |
| 6 | The Lovers | `weavers` |
| 7 | The Chariot | `shieldbearer` |
| 8 | Strength | `firefighter` |
| 9 | The Hermit | `ferryman` |
| 10 | Wheel of Fortune | `mapmaker` |
| 11 | Justice | `obsidian-count` |
| 12 | The Hanged Man | `baker` |
| 13 | Death | `the-bind` |
| 14 | Temperance | `timekeeper` |
| 15 | The Devil | `mirrormaker` |
| 16 | The Tower | `firefighter` ← check |
| 17 | The Star | `lightkeeper` |
| 18 | The Moon | `cook` |
| 19 | The Sun | `brewer` |
| 20 | Judgement | `doorwarden` |
| 21 | The World | `tailor` |

---

## Design Tokens (key vars)

Defined in `src/styles/tokens.css`:

```css
--color-gold           /* Primary gold accent */
--color-gold-faint     /* Subtle gold for borders */
--color-rose           /* Shadow section accent */
--color-paper-2        /* Body text color (light tan) */
--color-ink            /* Dark text */
```

Type utility classes (from `global.css`): `t-body`, `t-display`, `t-deco`, `t-small`

---

## Common Tasks

**Add/update a character bio:**
1. Edit `src/data/bios/<slug>.md`
2. Run `npm run sync-bios`
3. Verify `bios.js` updated

**Add character portrait:**
- Place at `public/assets/echos/<slug>.png`
- Reference in characters.js: `img: '/assets/echos/<slug>.png'`

**Unlock full character detail page:**
- Set `detail: true` in characters.js entry
- Ensure `bio`, `talisman`, `shadow`, `relations` are populated

**Add story images:**
- Place in `public/assets/stories/`
- Add `stories: [...]` and `storyLabel: '...'` to character entry
