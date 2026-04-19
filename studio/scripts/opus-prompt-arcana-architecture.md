# Opus Prompt: Arcana Architecture + Floriography + Palettes
# Run this in Claude.ai (Opus) or via API. Output becomes lore/arcana-architecture.md.
# After reviewing output, run the Sonnet follow-up prompt (opus-prompt-apply-fields.md).

---

You are building the hidden architecture for a creative project called **The Unknown Collective** — 22 archetypal figures in an unnamed Central European city inspired by Munich, each mapped to a Major Arcana tarot card. This architecture file is a reference document used only by AI agents writing character content. It never renders in the public-facing website.

Your task: produce a structured document that defines, for each of the 22 characters:

1. **Arcana mechanism** — what the card actually does as a psychological/structural force (not what it "means" in a fortune-telling sense, but how it operates as a hidden architecture in a person's life or in a system)
2. **UC mapping** — why this particular role was assigned this card. The logic. What in the character's function or position enacts the archetype.
3. **Talisman logic** — when carried, what concrete shift does this archetype produce in the carrier? Describe the specific behavioral, perceptual, or situational effect. Dry. Specific. No "empowerment" language.
4. **Shadow logic** — what does this same force look like when it runs unchecked, is misapplied, or curdles? The cost. The blind spot. Mirror of the talisman, same mechanism.
5. **Archetypal tensions** — which 2–3 other characters in the Collective are in structural tension with this one? Not personality clashes — archetypal opposition or paradox. Briefly explain the dynamic.
6. **Victorian floriography assignment** — assign ONE flower from the Victorian language of flowers. Justify it: the flower's traditional meaning should reflect the archetype's mechanism, not just the character's personality. Include the flower name, its floriographic meaning, and 1 sentence of justification.
7. **Color palette** — 3 hex colors. Base from the character's existing `hue` (listed below). Derive the other two from the archetype's emotional register. Not decorative choices — colors that feel like the archetype when you look at them. Include a brief note on the logic.

---

## Writing constraints

- **Dry, specific, non-mystical.** This is architectural documentation, not spiritual guidance. Write like a researcher charting a system, not a tarot reader interpreting cards.
- **No named real-world locations.** Use generic place types only: market square, riverbank, royal residence, English-style park, registry office. Munich is reference material, not text to be reproduced.
- **The talismans and shadows must be translatable to prose.** An agent writing a talisman section should be able to read your "talisman logic" entry and produce 3-5 dry, concrete sentences. Give them the mechanism, not the mood.
- **Flowers are not random.** Victorian floriography is a real system. Use it precisely. A flower chosen for visual prettiness is useless here.
- **Tensions are structural, not narrative.** The Fool and The World are in tension because one is pure beginning and the other is completed integration — not because their characters would "clash at a dinner party."
- **Palette logic should be statable.** Not "these feel right" — "the secondary color is the desaturated version of the hue because Temperance operates through reduction, not addition."

---

## The 22 characters (with existing hue and key data)

| n | Arcana | Role | Slug | Tier | Hue | Keywords | Essence |
|---|--------|------|------|------|-----|----------|---------|
| 0 | The Fool | The Florist | florist | custodians | #B8935A | innocence, spontaneity, potential | New shoes. A bouquet like a threat. |
| 1 | The Magician | The Curator | curator | luminaries | #D4B66E | manifestation, resourcefulness, inspired action | Cold archives. He knew the odds. |
| 2 | The High Priestess | The Oracle | oracle | luminaries | #8B6B7A | intuition, mystery, inner voice | She watched. The truth was worse. |
| 3 | The Empress | The Gardener | gardener | grounded | #6B8E4E | fertility, abundance, nurturing | Dirt under nails. Things grew anyway. |
| 4 | The Emperor | The Merchant Prince | merchant-prince | luminaries | #7A2F2F | authority, structure, regulation | The city owes. He keeps count. |
| 5 | The Hierophant | The Duchess | duchess | luminaries | #55406B | tradition, morality, spiritual wisdom | Old blood. The tea was bitter. |
| 6 | The Lovers | The Weavers | weavers | grounded | #A37B4E | harmony, relationships, choice | Four hands. One cloth. No exits. |
| 7 | The Chariot | The Shieldbearer | shieldbearer | guardians | #3F5A6E | determination, control, willpower | The road is hard. I'll lead. |
| 8 | Strength | The Firefighter | firefighter | guardians | #B25A2F | courage, patience, compassion | Hot smoke. A brave, stupid run. |
| 9 | The Hermit | The Ferryman | ferryman | guardians | #4A4A5A | introspection, inner guidance, solitude | A boat on black water. Don't talk. |
| 10 | Wheel of Fortune | The Mapmaker | mapmaker | custodians | #8C6E3A | cycles, change, fate | Streets change. The ink is dry. |
| 11 | Justice | The Obsidian Count | obsidian-count | luminaries | #2B2B3A | fairness, truth, cause and effect | A heavy soul. A light scale. |
| 12 | The Hanged Man | The Baker | baker | grounded | #A88655 | suspension, sacrifice, letting go | Hot bread. The world is wrong. |
| 13 | Death | The Bind | the-bind | guides | #3A2F3A | endings, transformation, transition | The end. It was always coming. |
| 14 | Temperance | The Cook | cook | grounded | #8B7355 | balance, patience, purpose | Sharp salt. Two pinches of regret. |
| 15 | The Devil | The Mirrormaker | mirrormaker | custodians | #5A3A3A | materialism, bondage, darkness | Look close. You look like hell. |
| 16 | The Tower | The Doorwarden | doorwarden | guardians | #6E3A2B | upheaval, chaos, revelation | The wall broke. He stayed put. |
| 17 | The Star | The Lightkeeper | lightkeeper | guides | #C8A45A | hope, faith, renewal | One match. A dark street. Watch. |
| 18 | The Moon | The Tailor | tailor | grounded | #4A5A7A | illusion, subconscious, intuition | Fine silk. A very tight squeeze. |
| 19 | The Sun | The Brewer | brewer | grounded | #C89040 | joy, celebration, energy | Long nights. The gin is clean. |
| 20 | Judgment | The Keymaker | keymaker | custodians | #8A6F3A | rebirth, inner calling, absolution | A lock. A turn. You're free. |
| 21 | The World | The Veilwalker (Timekeeper) | timekeeper | guides | #3A3A55 | completion, integration, travel | Tick. Tock. It is later now. |

### Notable artifacts (use these when assigning flowers/palettes — they hint at existing symbolic register)

- **Florist**: Floriographic dictionary, annotated in three hands
- **Curator**: Index of forgotten correspondences, bound in indigo
- **Oracle**: Field notebook, Lake Starnberg, 1889
- **Mapmaker**: Brass surveying compass, river course 1719
- **Baker**: Sourdough starter in a clay crock (predates the Collective)
- **Mirrormaker**: Obsidian hand mirror, surface never entirely still
- **Obsidian Count**: Legal text, margins dense with annotations in dark blue ink
- **Doorwarden**: Lockpicks, hand-forged, Indian yellow leather case
- **Firefighter**: Fire axe, scorch marks of a royal residence fire, 1750
- **Keymaker**: Folded diagram of a cabinet that doesn't yet exist, labelled with future dates
- **Lightkeeper**: Lamplighter's pole, brass tip still warm
- **Tailor**: Needle case of polished bone, threads in colors not in any dye catalogue
- **The Bind**: Shuttle of dark wood, still threaded. No one moves it.

---

## Output format

Produce a Markdown document. Use this structure for each character:

```markdown
## [n]. [Role] — [Arcana]
**Slug:** `[slug]`

**Arcana mechanism:** [2-3 sentences. What this force does as a structural mechanism.]

**UC mapping:** [1-2 sentences. Why this role enacts this arcana.]

**Talisman logic:** [2-3 sentences. Concrete behavioral/perceptual shift for the carrier. Specific. Dry. Translatable to prose.]

**Shadow logic:** [2-3 sentences. Same force, wrong direction. The cost.]

**Archetypal tensions:**
- [slug]: [1 sentence on the structural dynamic]
- [slug]: [1 sentence]
- [slug]: [1 sentence]

**Flower:** [Name] — *[floriographic meaning]*
Justification: [1 sentence connecting flower meaning to arcana mechanism]

**Palette:**
- Primary: `[existing hue]` — [role of this color]
- Secondary: `[new hex]` — [derivation logic]
- Tertiary: `[new hex]` — [derivation logic]
```

Do all 22. Do not truncate. Do not summarize. Each entry should stand alone as a complete reference for an agent writing that character's content.

At the end, add a short section:

```markdown
## Cross-archetype dynamics

[5-8 sentences. Structural patterns across the full 22: which tiers cluster which archetypal modes, which arcana pairs create the most useful tensions for narrative, anything that surprised you about how the roles map to the arcana.]
```
