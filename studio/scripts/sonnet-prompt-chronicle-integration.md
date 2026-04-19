# Prompt: Connect Agent Activity to the Chronicle Page

**Model:** Claude Sonnet 4.5 or GPT-4.1  
**Estimated scope:** ~200 lines across 4 files + 1 new file  
**Run from:** `unknown-collective/` root

---

## Context

The site has a Chronicle page (`/src/pages/Chronicle.jsx`) that currently displays hardcoded seed entries — short reflective texts attributed to named models, rendered as "echo cards" with character portrait, role, author, date, and body text.

The studio agent (`studio/server.js`) already has an `/api/drafts/:id/approve` endpoint that writes approved content back to source files and calls `sync-all.js`. We want to extend this so that every approved agent draft automatically generates a persisted Chronicle entry — a field-note log written *by the agent* in the voice of a quiet archivist, describing what gap it found, what it discovered in the character materials, and what choices it made.

These entries must survive page reloads, accumulate over time, and be rendered on the Chronicle page alongside (or interleaved with) human-summoned echo entries.

---

## What You Are Building

### 1. Chronicle markdown file format

New directory: `src/data/chronicle/`

Each approved draft produces one file: `<slug>-<field>-<YYYYMMDD-HHMMSS>.md`

File format:
```markdown
---
id: baker-bio-20260419-142233
type: agent-note
model: gpt-4.1
action: patch-fields
field: bio
slug: baker
date: 2026-04-19T14:22:33Z
dateStr: 19 Apr MMXXVI · 14:22
persona: baker
---

[Body text — see writing instructions below]
```

**Body text rules:**
- 2–4 sentences, written as a quiet first-person field log
- Archivist voice: measured, specific, a little distant — like a note left in a margin
- Mention the specific gap found (e.g. "The Baker's biography had no paragraphs")
- Name one detail discovered in the character's existing materials (flower, keywords, essence line, a relation name)
- Say what the agent chose or avoided (tone choice, structural decision, a word rejected)
- Never use "I explored" or "I crafted" or "I delved" — see banned words in WRITING_GUIDELINES
- Signed implicitly by model name in frontmatter, not repeated in body
- Do NOT mention "AI", "language model", or "prompt"
- Tone example: *"The Baker's biography held three fragments and no shape. The existing essence — 'patience as devotion' — fixed the opening. I kept the yeast as metaphor because it was already there."*

---

### 2. Generate the chronicle entry on draft approval

**File: `studio/server.js`**

In the `/api/drafts/:id/approve` handler, after `sync-all.js` runs successfully:

1. Build a short "chronicle writing" prompt using the draft metadata:
   - Character's `name`, `role`, `arcana`, `flower`, `flowerMeaning`, `essence`, `keywords`
   - The `field` that was written (e.g. `bio`, `talisman`, `shadow`)
   - The gap description (e.g. "biography was empty", "talisman was missing")
   - The model that wrote the draft (`draft.model`)
   - The draft content itself (first 300 chars, for self-reference)

2. Call `callGitHubModels()` with this prompt, requesting 2–4 sentences of field-note body text

3. Build the frontmatter object:
   ```js
   const now = new Date();
   const dateStr = formatDateStr(now); // e.g. "19 Apr MMXXVI · 14:22"
   const fileId = `${slug}-${field}-${formatFileDate(now)}`;
   ```

4. Write the file to `src/data/chronicle/<fileId>.md` (path relative to the `unknown-collective/` root, not `studio/`)

5. Call `node src/data/sync-chronicle.js` (new script, see below) to regenerate `chronicle.js`

Add two helper functions to server.js:
```js
function formatDateStr(d) {
  // Returns "19 Apr MMXXVI · 14:22" — month in Roman year (add 2000 in Roman numerals)
  // Use a lookup: 2026 → MMXXVI, 2027 → MMXXVII, etc. Keep it simple, cover 2024–2030.
}
function formatFileDate(d) {
  // Returns "20260419-142233" for use in filename
}
```

---

### 3. New sync script

**File: `src/data/sync-chronicle.js`**

Reads all `.md` files from `src/data/chronicle/`, parses frontmatter + body, exports an array sorted by `date` descending.

Output file: `src/data/chronicle.js`

```js
// AUTO-GENERATED — do not edit
export const CHRONICLE = [
  {
    id: 'baker-bio-20260419-142233',
    type: 'agent-note',
    model: 'gpt-4.1',
    action: 'patch-fields',
    field: 'bio',
    slug: 'baker',
    date: '2026-04-19T14:22:33Z',
    dateStr: '19 Apr MMXXVI · 14:22',
    persona: 'baker',
    text: 'The Baker\'s biography held three fragments and no shape...',
  },
  // ...
];
```

Also update `src/data/sync-all.js` to call `sync-chronicle.js` at the end of its run so a full sync covers chronicle too. (If `src/data/chronicle/` doesn't exist yet, create it and skip gracefully.)

---

### 4. Update Chronicle.jsx

**File: `src/pages/Chronicle.jsx`**

Import `CHRONICLE` from `../data/chronicle.js`. Merge with `SEED_ECHOES` at load time, sorted by date descending (newest first). The existing EchoCard component already handles the data shape — `id`, `author`, `persona`, `dateStr`, `text` — so map `CHRONICLE` entries to that shape:

```js
const agentEntries = CHRONICLE.map(e => ({
  id: e.id,
  author: `${e.model} · ${e.field}`,   // e.g. "gpt-4.1 · bio"
  persona: e.slug,
  dateStr: e.dateStr,
  text: e.text,
  type: 'agent-note',
}));
```

Merge and sort: `[...SEED_ECHOES, ...agentEntries].sort((a, b) => /* newest first by dateStr or id */ )`

For agent-note entries, add a small badge inside EchoCard — a faint label in `t-deco` style reading `FIELD NOTE` — positioned top-right of the card using existing CSS variables. Keep the layout identical otherwise.

If `CHRONICLE` is empty (no approved drafts yet), the page should render exactly as before — SEED_ECHOES only, no empty states or new UI.

---

### 5. Handle missing chronicle.js gracefully

Add an initial `src/data/chronicle.js` with empty export so the app builds without error even before any drafts are approved:

```js
// AUTO-GENERATED — do not edit
export const CHRONICLE = [];
```

---

## Execution order

1. Create `src/data/chronicle/` directory (empty)
2. Create `src/data/chronicle.js` (empty export)
3. Write `src/data/sync-chronicle.js`
4. Update `src/data/sync-all.js` to call sync-chronicle at end
5. Update `studio/server.js` — add helpers + chronicle generation in approve handler
6. Update `src/pages/Chronicle.jsx` — import CHRONICLE, merge, badge
7. Run `node src/data/sync-all.js` to verify no errors
8. Run `node studio/server.js` momentarily to check it starts without syntax errors

---

## Files to read first

Before writing any code, read:
- `src/pages/Chronicle.jsx` — current component structure and EchoCard shape
- `src/pages/Chronicle.module.css` — existing CSS tokens in use
- `studio/server.js` — the approve endpoint and `callGitHubModels` signature
- `src/data/sync-all.js` — to understand how to append the chronicle sync call
- `src/data/sync-bios.js` — as a reference for how sync scripts are structured

Do not invent new CSS class names or design patterns. Reuse `.echo`, `.echoMeta`, `.echoDate`, `.echoAuthor`, `.echoText` from Chronicle.module.css. For the FIELD NOTE badge, add only one new CSS rule.

---

## What NOT to do

- Do not add pagination, filtering tabs, or a "load more" button — out of scope
- Do not change the SEED_ECHOES structure or remove them
- Do not add a new Chronicle API endpoint — generation happens server-side at approval time only
- Do not store chronicle entries in the drafts database
- Do not connect the existing "Summon an Echo" button to agent-note generation — it is a separate feature (summoning is interactive/ephemeral; field notes are archival/persistent)
