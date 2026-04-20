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
    │   ├── Encounters.jsx / .module.css  ← Encounter index page
    │   ├── Encounter.jsx / .module.css   ← Single encounter detail page
    │   └── About.jsx / .module.css
    │
    └── data/
        ├── characters.js        ← Master array: CHARACTERS (22 entries, ordered n: 0–21)
        ├── bios.js              ← Generated: { slug: [...paragraphs] } — do not edit manually
        ├── encounters.js        ← Generated: ENCOUNTERS array — do not edit manually
        ├── bios/                ← Source markdown: <slug>.md — edit these
        │   ├── florist.md
        │   ├── curator.md
        │   └── ... (22 total)
        ├── encounters/          ← Source markdown: <id>.md — edit these
        │   └── <slugA>--<slugB>[--<slugC>...].md
        ├── sync-all.js          ← Master sync: runs all sub-syncs
        ├── sync-bios.js         ← Script: reads bios/*.md → writes bios.js
        ├── sync-encounters.js   ← Script: reads encounters/*.md → writes encounters.js
        ├── pick-encounter.js    ← Game script: random encounter generator (see below)
        ├── BIOS_WORKFLOW.md     ← Notes on bio sync process
        ├── tiers.js             ← Tier metadata
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
| `/encounters` | Encounters | Index of all recorded encounters |
| `/encounter/:id` | Encounter | Single encounter; `:id` = filename without `.md` |
| `/about` | About | |

---

## Data Flow

```
bios/<slug>.md              (human-readable source)
  ↓  node src/data/sync-all.js
bios.js                     (generated, auto-import)
encounters/<id>.md          (human-readable source, named <slugA>--<slugB>.md)
  ↓  node src/data/sync-all.js
encounters.js               (generated, ENCOUNTERS array)
  ↓  import { ENCOUNTERS }
Character.jsx               (renders encounter list + slide-over panel)
Encounters.jsx              (index of all encounters)
Encounter.jsx               (single encounter detail: /encounter/:id)
```

**Never edit `bios.js` or `encounters.js` directly.** Edit source `.md` files, then run `node src/data/sync-all.js`.

---

## Encounter Writing Guidelines

These rules apply to every encounter, whether written by a human or an agent. Read them before writing or editing any encounter file.

### The Bind is available, not mandatory
Not every encounter needs to connect to The Bind. Some scenes are simply about how two people see differently, or how a relationship forms before it becomes significant. The Bind radiates outward — sometimes a scene exists to establish the charge between two people who are going to matter later.

Where the Bind *is* present, it does not need to be named. It can be felt as:
- a gap in the records that shouldn't be there
- something that won't grow in a specific place
- a route or street that won't stay consistent
- a decision that feels as if it has already been made
- warmth where there should be cold; absence where there should be presence

What every encounter *does* need: **a reason these two people are in the same room, and something that shifts before the scene ends.** That shift can be small — a stem placed at the centre of an arrangement, a drainage plan revised forty feet east. It does not have to be legible to the characters themselves.

### The Collective is not a social club
These people are not meeting at markets to discuss flowers. They are a body trying to read and resist something they agreed in 1698 never to formally name. Every scene should carry that weight, even if quietly and obliquely.

### Dates must be chronologically possible
Every character has a timeline entry (`src/data/timeline.js`) with a `sortStart` year. Do not place a character in a scene before their `sortStart`. Key constraints:
- Weavers, Baker, Duchess, Cook: 1685–1703
- Mapmaker, Curator, Keymaker, Doorwarden: 1714–1729
- Firefighter: 1745–1750
- Shieldbearer: 1806, Mirrormaker: 1855
- Merchant Prince, Obsidian Count, Tailor, Brewer: 1878–1884
- Oracle: 1889, Florist: 1891, Gardener: 1872, Ferryman: 1899

### Cluster dates around meaningful eras
Do not spread encounters randomly across centuries. The meaningful windows are:
- **1700–1729** — The Duchess era: the Collective forming, the Bind becoming visible
- **1745–1760** — The hall fire, crisis inductions
- **1878–1906** — The Oracle's generation assembling its counter-strategy; the Merchant Prince's arrival; the flood

### Scene over summary
Show the room, the object, the gesture. Do not state the conclusion. The best encounters end unresolved — the Bind's logic is that things do not resolve cleanly.

- Right: *He wrote her name in pencil inside the ledger, then scratched it out.*
- Wrong: *They came to an understanding about the importance of the archive.*

### Dialogue carries subtext
Nobody says "the Bind is dangerous" or "we must protect the archive." They say:
- *The third ledger is under ongoing review.*
- *This building is on that line too.*
- *I do not give you this.* (not: I cannot share this dangerous knowledge)

Speak in the language of ordinary institutional life — ledgers, drainage plans, botanical notes — and let the strangeness come through the gap between that language and what is actually happening.

### Each character has a specific register
Let each participant notice something the others don't:
- **Curator** — cold, precise, reads through records and gaps in records
- **Oracle** — tactical, quiet, pattern-recognition before anyone else names the pattern
- **Florist** — reads through objects and flowers; the floriographic notebook is her parallel archive
- **Gardener** — reads through soil, growth, and physical absence; what won't grow where
- **Mapmaker** — reads through geography; inconsistencies between map versions and reality
- **Merchant Prince** — reads through commerce and systems; is changed by direct encounter with what resists systematisation
- **Duchess** — reads through institutional history; protects the Collective's accumulated tacit knowledge

### The Merchant Prince is the productive outsider
He is the wrong kind of mind for the Bind — and that is why he belongs in scenes. He will try to leverage, fund, purchase, or systematise what resists those approaches. The encounter should show him being changed by that failure, quietly and without explanation. He revised a drainage plan forty feet east without comment. This is the model.

### Tone
- Restrained, third-person reconstruction — as if assembled from contemporary accounts, not omniscient narration
- No flourishes, no adverbs of feeling (*she felt a deep unease*)
- Concrete sensory detail where needed: temperature, sound, the smell of the room
- 2–4 paragraphs; each paragraph should do something different (arrive, tension, shift, departure or irresolution)
- Titles should be specific: *The Third Ledger — Administrative Gate, October 1879* — not *A Tense Meeting*

---

## Encounter Filename Convention

Files live in `src/data/encounters/`. Filename format:

```
<slug1>--<slug2>[--<slug3>--<slug4>--<slug5>].md
```

Rules:
- Each segment separated by `--` is **a single character slug** (not a compound)
- Slugs are sorted by character `n` (arcana number), ascending
- 2–5 participants per encounter
- Each `<slug>.md` file must exist in `characters/`

Examples:
```
curator--florist.md
curator--florist--oracle.md
curator--florist--gardener--oracle.md   ← 4-person encounter
```

Wrong (old format, do not use):
```
curator-florist--florist-curator.md     ← compound segments, not canonical
```

---

## Encounter `era` Field (Timeline Enforcement)

Characters can carry an optional `era` field in their frontmatter (an integer year):

```yaml
era: 1923
```

This means the character arrived in the city / joined the Collective no earlier than that year. The `pick-encounter.js` script uses this to filter eligible participants for a given year.

Characters **without** an `era` field are treated as timeless — always available (guides, eternal presences, etc.).

When writing bios or encounters, do not place a character in a scene before their `era` year.

---

## Random Encounter Generator

```bash
node src/data/pick-encounter.js
node src/data/pick-encounter.js --year 1930
node src/data/pick-encounter.js --count 3 --year 1945
node src/data/pick-encounter.js --type argument
node src/data/pick-encounter.js --seed oracle,ferryman
node src/data/pick-encounter.js --seed oracle,ferryman --write   # creates stub .md file
```

Available `--type` values: `argument`, `gathering`, `chance`, `negotiation`, `observation`, `reckoning`, `convergence`, `commission`

The script outputs:
- A canonical filename suggestion
- The year, encounter type, setting, and central tension
- A full writer prompt ready to paste into Claude Code or an agent

---

## Common Tasks

**Add/update a character bio:**
1. Edit `src/data/bios/<slug>.md`
2. Run `node src/data/sync-all.js`
3. Verify `bios.js` updated

**Add a new encounter:**
1. Run `node src/data/pick-encounter.js --write` to generate a stub (or create manually)
2. Write the encounter body in the `.md` file
3. Run `node src/data/sync-all.js`
4. Encounter appears automatically on character pages and `/encounters`

**Set a character's era (timeline):**
- Add `era: <year>` to the character's `characters/<slug>.md` frontmatter
- Re-run `node src/data/sync-all.js`

**Add character portrait:**
- Place at `public/assets/echos/<slug>.png`

**Unlock full character detail page:**
- Set `detail: true` in `characters/<slug>.md` frontmatter
- Ensure bio, talisman, shadow, relations are populated
- Run `node src/data/sync-all.js`

**Add story images:**
- Place in `public/assets/stories/`
- Add `stories: [...]` and `storyLabel: '...'` to character frontmatter

---

## Character Slugs (all 22)

| n | Arcana | Slug |
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
| 14 | Temperance | `cook` |
| 15 | The Devil | `mirrormaker` |
| 16 | The Tower | `doorwarden` |
| 17 | The Star | `lightkeeper` |
| 18 | The Moon | `tailor` |
| 19 | The Sun | `brewer` |
| 20 | Judgement | `keymaker` |
| 21 | The World | `veilwalker` |

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
