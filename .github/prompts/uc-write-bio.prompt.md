---
name: "UC: Write Bio"
description: "Write or improve one character bio from the markdown source files"
argument-hint: "character slug"
agent: "agent"
model: "GPT-5 (copilot)"
---
Read [agents.md](../../agents.md) first and follow the Bio Writer instructions there.

Then:
- read `src/data/characters/<slug>.md`
- read the related characters listed in that file
- write or improve `src/data/bios/<slug>.md`

Constraints:
- 4-5 paragraphs
- 2-4 sentences per paragraph
- structure: origin or arrival, role in the city, key relationship or event, current state, optional unresolved tension
- match the restrained literary tone used elsewhere
- do not name real landmarks or cities

After editing, run:
`cd unknown-collective && node src/data/sync-all.js`

Summarize the character direction you reinforced.