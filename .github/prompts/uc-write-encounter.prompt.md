---
name: "UC: Write Encounter"
description: "Write an encounter document for two characters"
argument-hint: "slugA + slugB"
agent: "agent"
model: "GPT-5 (copilot)"
---
Read [agents.md](../../agents.md) first and follow the Encounter Writer instructions there.

Then:
- read both character files and both bios
- write a specific event between those two characters
- save it to `src/data/encounters/<slugA>--<slugB>.md`

Constraints:
- include frontmatter with an evocative event title
- body should be 2-4 paragraphs
- write as restrained reconstruction from records, not omniscient fantasy narration
- keep the setting consistent with the existing source files

After editing, run:
`cd unknown-collective && node src/data/sync-all.js`

State the event title and why it fits those characters.