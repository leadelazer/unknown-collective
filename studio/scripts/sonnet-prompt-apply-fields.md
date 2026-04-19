# Sonnet Follow-up Prompt: Apply Fields + Update Agents
# Run AFTER reviewing the Opus output (lore/arcana-architecture.md).
# This is a Copilot/Sonnet task — give it the Opus output + this prompt.

---

You are updating **The Unknown Collective** project after receiving an arcana architecture document from a previous analysis pass.

## Your tasks

### Task 1 — Save the architecture document
Save the full Opus output to:
```
unknown-collective/src/data/lore/arcana-architecture.md
```
This file is a reference for AI agents. It must not be edited manually after saving — it's the source of truth for arcana-to-character mapping.

### Task 2 — Apply flower + palette to character files
For each of the 22 characters, add these fields to the YAML frontmatter in `src/data/characters/<slug>.md`:

```yaml
flower: "[Name from Opus output]"
flowerMeaning: "[Floriographic meaning, brief]"
palette: ["[hex1]", "[hex2]", "[hex3]"]
```

Rules:
- Do NOT remove `hue` — it stays as the primary accent color used in the existing UI
- `palette[0]` should match or be close to `hue`
- Add after the `hue` line
- Run `node src/data/sync-all.js` after all files are updated

### Task 3 — Update agent prompts in studio/scripts/agent-core.js
In `buildWritingPrompt()`, after the character data section, add a call that loads and injects the relevant entry from `arcana-architecture.md` for the character being written. The server.js `buildWritingPrompt` call should pass the architecture entry as a string parameter.

Specifically:
- In `server.js`, read `lore/arcana-architecture.md` once at the start of the `/api/agent/run` handler
- Parse out the entry for the chosen character by matching `## [n]. [Role]`
- Pass it to `buildWritingPrompt(char, field, relatedChars, architectureEntry)`
- In `agent-core.js`, update `buildWritingPrompt` signature and add the entry to the prompt under a section called `## Architecture reference (use this, do not summarise it):`

### Task 4 — Update frontend to hide arcana, show flower
In `src/pages/Character.jsx`:
- Replace `{c.arcana} · Tier of the {tier.short}` with `{c.flower} · {c.flowerMeaning}`
- In the relations section, replace `{r.arcana}` with `{r.flower}`
- Add a palette swatch strip: 3 small circles using `c.palette` colors, positioned below the character portrait or above the artifact line

The `arcana` field stays in the data (agents use it). It just stops displaying in the UI.

### Task 5 — Run sync
```bash
cd unknown-collective && node src/data/sync-all.js
```

Verify no errors. If sync produces errors, fix them before finishing.
