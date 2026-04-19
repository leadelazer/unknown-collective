---
name: "UC: Expand Lore"
description: "Write a new lore entry about a systemic element of the Collective"
argument-hint: "topic"
agent: "agent"
model: "GPT-5 (copilot)"
---
Read [agents.md](../../agents.md) first and follow the Lore Expander instructions there.

Then:
- inspect the relevant character, encounter, and lore files
- write one new lore entry in `src/data/lore/<slug>.md`

Constraints:
- do not contradict existing bios or encounters
- if facts are ambiguous, name the ambiguity instead of inventing certainty
- keep the prose quiet, specific, and literary

After editing, run:
`cd unknown-collective && node src/data/sync-all.js`

Summarize the new systemic fact or ambiguity added.