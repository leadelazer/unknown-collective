# The Unknown Collective — Claude Code Documentation

## Project Overview

A React + Vite web app showcasing "The Unknown Collective" — 22 archetypal characters in an unnamed Central European city inspired by Munich, each mapped to a Major Arcana tarot card. The site displays character profiles with biographical details, talisman/shadow card meanings, artifacts, and interconnected relationships.

**Repo root:** `unknown-collective/`  
**Dev server:** `npm run dev` (runs on `http://localhost:5173`)  
**Build:** `npm run build`

---

## Key Directories

```
src/
  App.jsx                  — Router (HashRouter, 7 routes)
  main.jsx                 — Entry point
  components/              — Shared UI (Nav, Footer, DecoRule, DecoCorner, TextureBackdrop)
  pages/                   — Route-level components (Home, Collective, Character, Tiers, Manifesto, Chronicle, About)
  data/
    characters.js          — Master character array (imports bios from bios.js)
    bios.js                — Long-form bio text, keyed by slug
    bios/<slug>.md         — Source markdown for each bio (22 files)
    tiers.js               — Tier definitions
    questions.js           — Chronicle page questions
    sync-bios.js           — Script: reads bios/*.md → writes bios.js
  styles/
    global.css             — Base styles, layout utilities
    tokens.css             — Design tokens (colors, spacing, type scale)
public/
  assets/
    echos/                 — Character portrait images (<slug>.png)
    stories/               — Story/scene images
    artifacts/             — Artifact images
    botanics/              — Botanical illustration images
    textures/              — Background textures
    videos/                — Video assets
```

---

## Character Data Structure

Each entry in `src/data/characters.js` follows this schema:

```javascript
{
  n: <number 0-21>,                    // Arcana number
  arcana: '<tarot card name>',
  role: '<the role>',                  // e.g. 'The Florist', 'The Curator'
  name: '<character name>',            // Real name (optional for stubs)
  tier: '<tier>',                      // grounded | custodians | guardians | luminaries | guides
  slug: '<url-slug>',                  // lowercase, hyphens (e.g. 'duchess')
  img: '/assets/echos/<slug>.png',
  hue: '<hex color>',
  keywords: ['word1', 'word2', 'word3'],
  essence: '<poetic 1-2 line phrase>',

  // Full detail fields (omit or set detail: false for stubs)
  detail: true,
  bio: bios.<slug>,                    // reference into bios.js
  talisman: '<talisman description>',
  shadow: '<shadow description>',
  relations: ['slug1', 'slug2'],       // links to related characters
  artifact: '<artifact description>',
  quote: '<character quote>',

  // Optional story images
  stories: [
    { src: '/assets/stories/<image>.png', title: '<title>', caption: '<caption>' },
  ],
  storyLabel: '<section title>',
}
```

**Bio text lives in `bios.js`**, not inline in characters.js. Bios are authored as markdown in `src/data/bios/<slug>.md` and compiled via `npm run sync-bios`.

---

## Character Sync Workflow (Notion → App)

1. **Search Notion** for character by name: `notion-search query: "<name>"`
2. **Fetch Notion page** by ID from search results: `notion-fetch <id>`
3. **Parse properties** into data fields:
   - `Name` → `name`
   - `Talisman` → `talisman`
   - `Shadow` → `shadow`
  - `Short Description` → `essence` (1-2 sentences, poetic)
   - `Profile` / extended text → `bios/<slug>.md`
  - Replace named Munich references with abstract place types before writing
4. **Write bio** to `src/data/bios/<slug>.md` — 4-5 paragraphs, 2-4 sentences each, with no named real Munich locations
5. **Run** `npm run sync-bios` to regenerate `bios.js`
6. **Update** `characters.js` with talisman, shadow, relations, artifact, quote, hue
7. **Verify** in browser at `/character/<slug>`

---

## Display & Formatting Rules

**Bio paragraphs:** 15px, Inter sans-serif (`t-body` class), line-height 1.8, `var(--color-paper-2)`

**Talisman & Shadow:** Two-column grid. Talisman label gold (`var(--color-gold)`), shadow label rose (`var(--color-rose)`). Section has top border `1px solid var(--color-gold-faint)`.

**Essence:** 22px, display serif, italic, poetic/atmospheric — do not explain the character.

---

## Character Page Component

`src/pages/Character.jsx` renders two layouts:
- **DetailedCharacter** — full page with bio, talisman, shadow, artifact, relations, stories (when `c.detail === true`)
- **StubCharacter** — placeholder for characters with `detail: false` or missing `detail`

---

## Tips & Conventions

- **Essence tone:** Atmospheric, not explanatory. Fragments are fine.
- **Bio structure:** Introduce → context/role → key relationships → current state
- **Relations:** Only meaningful narrative connections; verify target slugs exist
- **Hex colors:** Match the archetype's energy (e.g. `#55406B` purple for Duchess, `#B8935A` gold for Florist)
- **Keywords:** Capture the tarot card's essence, not just character traits
- **Characters ordered** by `n` (0–21) in the array

---

## Current State (as of 2026-04-19)

All 22 characters are present in `characters.js`. Most have full `detail: true` entries with bio, talisman, shadow, relations. Bio text lives in `bios.js` (sourced from `bios/*.md`). Portrait images exist for all characters in `public/assets/echos/`.

**Next steps:**
1. Sync remaining stub characters from Notion (fill talisman/shadow/bio where missing)
2. Add story images for characters with visual materials
3. Test all relations bidirectionally
4. Refine essence/keywords for consistency

---

**Last updated:** 2026-04-19
