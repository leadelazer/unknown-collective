# The Unknown Collective

A literary world-building project and AI content pipeline experiment — 22 archetypal characters mapped to the Major Arcana, inhabiting an unnamed Central European city across centuries.

**[→ View the live site](https://lea-mariedelazer.github.io/unknown-collective/)**

---

## What This Is

The Unknown Collective is a fictional universe built around the 22 cards of the Major Arcana. Each card becomes a named figure — The Curator, The Oracle, The Ferryman, The Bind — with a full biography, talisman meaning, shadow side, relationships, and a place in the city's history. The world is literary, quiet, and specific: less fantasy lore, more evidence from an archive that no one has fully catalogued yet.

This repo is the full production system: a React frontend, a markdown-first content database, a local API studio, and an AI agent pipeline that writes, patches, and evaluates content.

---

## Technical Architecture

### Frontend — React + Vite

- Character profiles with biography, talisman/shadow card meanings, artifact, and relational maps
- Chronicle view — a live log of AI agent activity, written as in-character "echoes"
- Encounter pages — narrative documents between pairs of characters
- Lore pages — systemic world entries (the Collective's structure, the city, recurring rituals)
- Deployed to GitHub Pages via `npm run build` + static export

### Content Database — Markdown-First

All canonical content lives as plain markdown files. Generated JS files (`characters.js`, `bios.js`) are **never edited directly** — they are rebuilt from source via:

```bash
node src/data/sync-all.js
```

```
src/data/
  characters/<slug>.md     ← YAML frontmatter: meta, talisman, shadow, relations
  bios/<slug>.md           ← biography paragraphs (plain text, blank-line separated)
  encounters/<a>--<b>.md  ← narrative between two characters
  lore/<topic>.md          ← world-level entries
  chronicle/<timestamp>.md ← agent activity log entries
```

This separation means human editors and AI agents can both write to the same files with predictable merge behavior, and the content is fully readable and version-controllable independent of the app.

### Studio — Local Agent API

`/studio` is a local Express server (port 3099) with a React UI (port 5200). It orchestrates AI writing runs against the content database:

- **Gap analysis** — scans all characters, scores content completeness, surfaces what's missing
- **Targeted updates** — POST to `/api/agent/run` with `{ slug, field, instructions }` to patch a single field
- **Coherence evaluation** — evaluates the full roster for tone consistency, bidirectional relations, timeline contradictions
- **Chronicle logging** — every agent write is logged as a dated entry with model attribution

The studio is intentionally local-only. It reads and writes the same markdown files the frontend consumes.

### AI Agent Pipeline

The project uses two models for different tasks:

| Model | Role |
|---|---|
| `gpt-4.1` | Long-form biography and encounter writing |
| `gpt-4o-mini` | Gap analysis, coherence checks, field patches |
| `claude-sonnet-4-6` | Structural decisions, relation mapping, prompt authoring |

Agents are given:
1. The character's frontmatter (arcana, tier, keywords, essence, existing relations)
2. Related characters' bios for context
3. A prose style reference (The Curator and The Oracle are the canonical tone anchors)
4. A specific task (write bio, patch talisman, flag coherence issues)

The writing guidelines are encoded in `agents.md` — a living spec document that agents read before any task.

---

## The 22 Characters

| # | Arcana | Role | Tier |
|---|--------|------|------|
| 0 | The Fool | The Florist | custodians |
| 1 | The Magician | The Curator | luminaries |
| 2 | The High Priestess | The Oracle | luminaries |
| 3 | The Empress | The Gardener | grounded |
| 4 | The Emperor | The Merchant Prince | luminaries |
| 5 | The Hierophant | The Duchess | luminaries |
| 6 | The Lovers | The Weavers | grounded |
| 7 | The Chariot | The Shieldbearer | guardians |
| 8 | Strength | The Firefighter | guardians |
| 9 | The Hermit | The Ferryman | guardians |
| 10 | Wheel of Fortune | The Mapmaker | custodians |
| 11 | Justice | The Obsidian Count | luminaries |
| 12 | The Hanged Man | The Baker | grounded |
| 13 | Death | The Bind | guides |
| 14 | Temperance | The Cook | grounded |
| 15 | The Devil | The Mirrormaker | custodians |
| 16 | The Tower | The Doorwarden | guardians |
| 17 | The Star | The Lightkeeper | guides |
| 18 | The Moon | The Tailor | grounded |
| 19 | The Sun | The Brewer | grounded |
| 20 | Judgment | The Keymaker | custodians |
| 21 | The World | The Timekeeper | guides |

**Tiers** reflect each character's relationship to the world: `guides` are archetypal forces (least human); `luminaries` are the city's intellectual and power layer; `guardians` hold thresholds; `custodians` are craftspeople and observers; `grounded` are everyday life and the material world.

---

## Running Locally

```bash
# Install and start the frontend
cd unknown-collective
npm install
npm run dev
# → http://localhost:5173

# Rebuild generated data files after editing markdown
node src/data/sync-all.js

# Start the studio (agent UI + API)
cd studio
npm install
npm run dev
# → UI: http://localhost:5200 / API: http://localhost:3099
```

---

## What I Was Exploring

This project is an experiment in a few overlapping questions:

**Can AI agents maintain a consistent literary voice across a large corpus?** The answer so far is: yes, with enough context and a well-defined style anchor. The prose degrades when agents are given too little character context or too generic a prompt.

**What does a human+AI collaborative writing workflow actually look like at the file level?** This repo is one answer: markdown as the canonical layer, sync scripts as the interface between human editing and agent output, and a local API as the coordination layer.

**What is the right level of structure for fictional world-building?** The YAML frontmatter schema evolved through the project — it's strict enough to drive UI rendering, loose enough to let the writing breathe. The tension between schema and narrative is something the project keeps surfacing.

---

## Stack

- **Frontend:** React 18, Vite, CSS Modules
- **Content:** Plain markdown + YAML frontmatter, custom sync pipeline
- **Studio:** Express, Node.js, React
- **AI:** OpenAI API (GPT-4.1, GPT-4o-mini), Anthropic API (Claude Sonnet)
- **Deploy:** GitHub Pages

---

*The Unknown Collective — what the city keeps.*
