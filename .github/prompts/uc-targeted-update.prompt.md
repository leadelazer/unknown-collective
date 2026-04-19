---
name: "UC: Targeted Update"
description: "Rewrite one specific character field using the Unknown Collective source markdown files"
argument-hint: "slug + field + any steering"
agent: "agent"
model: "GPT-5 (copilot)"
---
Read [agents.md](../../agents.md) first and follow it as the source of truth.

Then perform a targeted content update in the Unknown Collective source files.

Input will specify:
- character slug
- field to update
- optional steering

Rules:
- Edit only the markdown source files in `src/data/characters/` and `src/data/bios/`
- Never edit generated files like `characters.js` or `bios.js` directly
- Match the established tone and keep the city unnamed
- If the field is `bio`, write 4-5 paragraphs with blank lines between paragraphs
- If the field is `talisman` or `shadow`, preserve the markdown section structure in the character file
- If the field is frontmatter-based, update only that frontmatter value
- If relations are changed, keep them bidirectional

After editing, run:
`cd unknown-collective && node src/data/sync-all.js`

Report what changed and note any inconsistencies you noticed.