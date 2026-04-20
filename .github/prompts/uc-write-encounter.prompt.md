---
name: "UC: Write Encounter"
description: "Write a new encounter file for a set of Collective members"
argument-hint: "slug1 + slug2 [+ slug3...]"
agent: "agent"
model: "gpt-4.1 (copilot)"
---

## Before writing anything

1. Read **[agents.md](../../agents.md)** — specifically the **Encounter Writing Guidelines** section. These rules are mandatory, not optional.
2. Read `src/data/timeline.js` — check every participant's `sortStart` year and confirm the encounter date is chronologically possible.
3. Read the character files `src/data/characters/<slug>.md` and bios `src/data/bios/<slug>.md` for every participant.
4. Read 2–3 existing encounter files from `src/data/encounters/` to calibrate tone.

## Writing the encounter

- Not every encounter must connect to The Bind — some scenes exist to establish how two people see differently, or how a relationship forms. Where the Bind is present, it should never be named directly (see guidelines for how it manifests)
- Date must fall within a meaningful era cluster (see guidelines)
- Tone: restrained third-person reconstruction, 2–4 paragraphs, no adverbs of feeling
- Title format: `[Event Name] — [Location], [Month/Season] [Year]`
- Let each character notice through their specific register (records, soil, maps, commerce, etc.)
- End unresolved — the Bind's logic is that things don't resolve cleanly

## Saving

Save to `src/data/encounters/<slug1>--<slug2>[--<slug3>].md` with frontmatter:

```md
---
title: [Your evocative title here]
---

[Body]
```

Then run:
```
cd unknown-collective && node src/data/sync-all.js
```

## After writing

State:
- the encounter title
- the year chosen and why it fits the era
- which character's register drives the scene and what they notice
- how the Bind is present (even if never named)