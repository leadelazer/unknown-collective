---
name: "UC: Relation Mapper"
description: "Check relation bidirectionality and propose or apply relation-note improvements"
argument-hint: "optional slug or focus"
agent: "agent"
model: "GPT-5 (copilot)"
---
Read [agents.md](../../agents.md) first and follow the Relation Mapper expectations there.

Then inspect the source character markdown and do one of two things depending on the request:
- audit relation arrays for bidirectionality and missing narrative justification
- or update relation arrays and relation notes in the source markdown

Rules:
- work only in `src/data/characters/*.md`
- keep relations meaningful, not exhaustive
- if you add relation links, make them bidirectional
- explain why each change belongs narratively

If you make edits, run:
`cd unknown-collective && node src/data/sync-all.js`