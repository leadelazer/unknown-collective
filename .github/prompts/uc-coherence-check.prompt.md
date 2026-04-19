---
name: "UC: Coherence Check"
description: "Audit the character source files for relation, timeline, naming, and tone inconsistencies"
argument-hint: "optional focus area"
agent: "agent"
model: "GPT-5 (copilot)"
---
Read [agents.md](../../agents.md) first and follow the Coherence Agent instructions there.

Audit the files in `src/data/characters/` and `src/data/bios/` for:
- broken or one-directional relations
- timeline contradictions
- tone mismatches versus curator and oracle
- misspelled or inconsistent character names
- keywords that do not match arcana meaning

Write findings to a dated file in `src/data/lore/` named `coherence-report-YYYY-MM-DD.md`.

Do not silently fix issues unless the user explicitly asks for fixes. Focus on precise findings with file references and concrete explanations.