# Sonnet Prompt: Abstract Location References Across Source Content
# Give this prompt directly to an editing agent.

Read `/Users/lea-mariedelazer/Projects/UC Experiment/agents.md` first for project rules.

Then perform this task:

The Unknown Collective uses an unnamed Central European city as its setting. Munich can be a hidden blueprint for atmosphere only, but the published/source text must not mention real cities, districts, landmarks, streets, rivers, parks, royal buildings, regions, or other identifiable place names.

Your job is to make a focused abstraction pass across the source markdown content and replace location-specific references with dry, believable generic equivalents.

Edit only source files here:

- `unknown-collective/src/data/characters/*.md`
- `unknown-collective/src/data/bios/*.md`
- `unknown-collective/src/data/encounters/*.md`
- `unknown-collective/src/data/lore/*.md`

Do not edit generated files directly:

- `unknown-collective/src/data/characters.js`
- `unknown-collective/src/data/bios.js`

After edits, run:

```bash
cd unknown-collective && node src/data/sync-all.js
```

## Rewrite goal

Remove real-world geographic specificity while preserving tone, historical texture, and narrative function.

This is not a global find/replace task. Read each sentence in context and rewrite it so it still sounds intentional.

## What must be removed or abstracted

Remove or abstract references to:

- city names: `Munich`, `Hamburg`, `London`, `Heidelberg`, `Salzburg`, `Starnberg`, etc.
- districts or neighborhoods
- street names
- named rivers, lakes, parks, squares, and markets
- named landmarks, palaces, churches, registries, state buildings, estates, or institutions when they point to a real place
- regional or national labels when they make the setting too concrete, such as `Bavaria`, `Bavarian`, or similar place-bound identifiers

## What to replace them with

Use abstract but concrete place-types such as:

- `the city`
- `the river`
- `the market`
- `the square`
- `the old park`
- `an English-style park`
- `the royal residence`
- `the registry`
- `the port city`
- `the southern estates`
- `the northern trade routes`
- `a lakeside town`

Do not flatten everything into vague mush. Keep the sentence grounded in class, trade, geography, or civic function.

## Style constraints

- Keep the existing restrained literary tone.
- Do not add fantasy language.
- Do not add explanation about why the place is unnamed.
- Do not turn specific places into generic placeholders if a more textured abstraction is available.
- Keep character relationships, chronology, and facts intact unless the fact itself depends on a named real place.
- Preserve sentence rhythm where possible.

## Examples of good abstraction

- `Munich` -> `the city`
- `off the Viktualienmarkt` -> `off the market`
- `near the Isar` -> `near the river`
- `the Munich Residenz fire` -> `the fire at the royal residence`
- `Englischer Garten` -> `the English-style park`
- `Maximilianstraße` -> `the grand avenue`
- `arrived from Hamburg` -> `arrived from a northern port city`
- `left London for Munich` -> `left one capital for another inland city`

## Additional caution

If a person name contains a territorial title tied to a real place, only change it if the reference reads as geographic exposition rather than character identity. Prefer minimal edits. For example, if a line says `Duchess Luise of Bavaria` and the territorial tag is not essential, reduce it to `Duchess Luise`.

## Deliverable standard

Make the pass across all relevant source content fields:

- bio text
- talisman text
- shadow text
- artifacts
- quotes, if needed
- encounter body text
- lore body text

Do not create a report file. Just make the edits in place.

When finished:

1. run `node src/data/sync-all.js`
2. verify no obvious city/place-name references remain in the edited markdown sources
3. give a short summary of the most important abstractions you made
