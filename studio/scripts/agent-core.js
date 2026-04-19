// Shared agent logic — used by both studio/server.js (local) and studio/scripts/run-agent.js (GitHub Actions).
// Pure functions only: no file I/O, no API calls.

export const WRITING_GUIDELINES = `## Voice & Tone (MANDATORY — read before writing anything)

You are NOT writing fantasy, mythology, or self-help. You are writing about real-seeming people who happen to exist across centuries in a Central European city inspired by Munich, but never named directly. The voice is:
- Journalistic, dry, observational. Like a case file or a quiet documentary.
- Specific. Concrete nouns, ordinary places, physical details. "flour on his hands" not "blessed with ancient gifts."
- Short sentences. Blunt. Then occasionally a longer one that lands.
- No superlatives. No "bestowed," "empowered," "imbued," "ancient wisdom." No "remarkable," "extraordinary," "profound."
- No fantasy language. No "mystical forces," "arcane powers," "sacred bonds," "ethereal." These are people, not wizards.
- Avoid cliché pairings: "light and shadow," "chaos and order," "past and present."
- Do NOT name real Munich locations, districts, streets, rivers, parks, landmarks, or institutions. Use abstract equivalents instead: "market square," "river," "royal residence," "English-style park," "registry office."

BANNED WORDS: bestowed, imbued, empowered, ethereal, mystical, sacred, ancient wisdom, tapestry, enigmatic, realm, vessel, beacon, harbinger, profound, remarkable, transcend, celestial, luminous, destiny, fate (as a force), divine, arcane, eldritch, whisper (as metaphor for vague influence).

BANNED LOCATION REFERENCES: Munich, Viktualienmarkt, Englischer Garten, Eisbach, Isar, Residenz, Maximilianstraße, Starnberg, Marienplatz, Schwabing, Bavaria, Bavarian.

### Bio rules
4-5 paragraphs, blank line between each. Structure:
1. Origin — a specific physical detail, a year, a smell, a sound. Ground the reader.
2. How they came to their role. What happened, not what they "represent."
3. Key relationship — name another character, describe what actually occurred between them.
4. How they operate now. What do they literally do day-to-day?
5. (Optional) An unresolved tension. A cost. Something that doesn't add up.

Reference tone — this is what good looks like:
"He was born in 1680 with flour on his hands. As a baker's son, he spent his pre-dawn hours kneading dough and listening to bells."
"She left the estate with a cold head and a list of names. The Collective wasn't a dream of harmony. It was a tactical assembly."

### Talisman rules
What shifts when someone carries this card? Be concrete, not aspirational. Address the reader with "you" but stay dry — no cheerleading.
3-5 sentences. Name a specific effect, a habit that changes, a thing you notice differently. Not "you are bestowed with courage" but "Arguments you used to avoid start feeling like they have a point. You sit down when others leave."

### Shadow rules
The cost. The blind spot. What this energy looks like when it curdles. Mirror the talisman — same force, ugly angle.
3-5 sentences. Be honest, not dramatic. Not "darkness consumes you" but "You stop asking whether the silence is comfortable for anyone else."

### Encounter rules
Witness/historian perspective — as if reconstructed from a municipal record or overheard testimony.
2-4 paragraphs. Name a specific kind of place in the city, a season, a physical object. The encounter should feel like an event, not a mood.

### Lore rules
Scholar tone. Present evidence, acknowledge gaps. "There are three accounts of…" not "In the mists of time…"
Do not invent facts that contradict existing bios. Where facts are ambiguous, name the ambiguity.

Setting: an unnamed Central European city. Munich is only a blueprint. Characters exist across centuries but are not immortal in a fantasy sense — the Collective persists, members come and go across eras.`;

const BANNED_LOCATION_REFERENCES = [
  'munich',
  'viktualienmarkt',
  'englischer garten',
  'eisbach',
  'isar',
  'residenz',
  'maximilianstraße',
  'maximilianstrasse',
  'starnberg',
  'marienplatz',
  'schwabing',
  'bavaria',
  'bavarian',
];

function hasSpecificLocationReference(text) {
  const lower = (text || '').toLowerCase();
  return BANNED_LOCATION_REFERENCES.some(term => lower.includes(term));
}

// Hidden architecture: what each arcana actually means as a mechanism.
// Agents use this to ground talisman/shadow in the card's logic, not just the character's personality.
export const ARCANA_NOTES = {
  'The Fool':        'Departure without a map. The energy of beginning before you know the cost. Talisman: opens a person to genuine new starts. Shadow: naivety that reads as courage until it isn\'t.',
  'The Magician':    'Concentration of will; the right tool for the right problem. Talisman: sharpens focus, surfaces available resources. Shadow: the same will used to manipulate rather than make.',
  'The High Priestess': 'Knowing without speaking. Sitting with ambiguity. Talisman: comfort with not-yet-knowing; patience with half-information. Shadow: withholding so long the knowledge curdles into secrecy.',
  'The Empress':     'Growth from the right conditions. Cultivation, not conjuring. Talisman: draws out latent potential in people and places. Shadow: providing so reliably that others stop providing for themselves.',
  'The Emperor':     'Structure as a technology. Authority that gets things done. Talisman: helps you claim territory and hold it. Shadow: the structure outlasts what it was built to protect.',
  'The Hierophant':  'Transmission of institutional knowledge. The bridge between generations. Talisman: gives access to what was already figured out. Shadow: protecting the form of tradition instead of its function.',
  'The Lovers':      'The irreversible choice. Commitment as a closing of other doors. Talisman: clarity about what you actually value. Shadow: treating every choice as provisional, never fully committing.',
  'The Chariot':     'Disciplined force in a single direction. Competing drives held in check. Talisman: cuts through noise, advances on a single track. Shadow: winning through will alone, ignoring what was trampled.',
  'Strength':        'Endurance over force. The patience of not reacting. Talisman: the ability to absorb difficulty without hardening. Shadow: absorbing so much for others that there is nothing left.',
  'The Hermit':      'Deliberate withdrawal to see clearly. The lantern for yourself, not for others. Talisman: turns isolation into useful distance. Shadow: mistaking withdrawal for wisdom; the lantern narrows.',
  'Wheel of Fortune':'The system turning regardless of readiness. Change as a mechanism. Talisman: sharpens awareness of timing; helps you read when cycles shift. Shadow: fatalism masquerading as acceptance.',
  'Justice':         'Precise calibration between action and consequence. Talisman: cuts through rationalisation; sees what actually happened. Shadow: applying the same standard to situations that are not equivalent.',
  'The Hanged Man':  'Voluntary suspension. Seeing from an inverted angle. The pause that reorders everything. Talisman: unlocks an oblique perspective; slows impulsive action. Shadow: mistaking inaction for spiritual progress.',
  'Death':           'The ending that clears the way. Transition as mechanism, not tragedy. Talisman: makes it easier to finish what needs finishing. Shadow: forcing change before it is ready, or recognising it too late.',
  'Temperance':      'The patience of calibration. Careful blending over time. Talisman: steadies and integrates; finds the right measure. Shadow: endless adjustment that never produces anything finished.',
  'The Devil':       'The comfortable cage; what holds you because you built it. Talisman: reveals what you have been refusing to see. Shadow: recognising the cage and choosing it anyway.',
  'The Tower':       'The necessary collapse. What breaks when the foundation was wrong. Talisman: clears what needs clearing. Shadow: rebuilding the same structure and calling it different.',
  'The Star':        'Orientation after catastrophe. The fixed point in the dark. Talisman: restores direction; something to navigate by. Shadow: becoming a bearing others use while losing your own.',
  'The Moon':        'What surfaces at night; the unreliable guide. Talisman: surfaces what is normally submerged. Shadow: following the reflection instead of the source.',
  'The Sun':         'Clarity and direct exposure. What grows in the open. Talisman: removes ambiguity; brings things into plain sight. Shadow: burning what needed shade to survive.',
  'Judgement':       'The honest reckoning. Hearing the call clearly. Talisman: cuts through self-deception; enables accurate accounting. Shadow: judging before the evidence is complete.',
  'The World':       'Integration; wholeness as a state, not an end. Talisman: the ability to hold contradictions without needing to resolve them. Shadow: the completeness that closes off what comes next.',
};

function bioParagraphCount(bio) {
  if (!bio || !bio.trim()) return 0;
  return bio.trim().split(/\n\n+/).filter(Boolean).length;
}

function gapScore(issues) {
  return issues.reduce((score, issue) => {
    if (issue === 'bio-structure') return score + 6;
    if (issue === 'bio-thin') return score + 5;
    if (issue === 'talisman') return score + 5;
    if (issue === 'shadow') return score + 5;
    if (issue === 'talisman-thin') return score + 3;
    if (issue === 'shadow-thin') return score + 3;
    if (issue === 'location-specific') return score + 4;
    if (issue.startsWith('broken-relations')) return score + 1;
    return score;
  }, 0);
}

function scoreToLabel(score) {
  if (score >= 92) return 'Excellent';
  if (score >= 82) return 'Strong';
  if (score >= 68) return 'Uneven';
  return 'Thin';
}

export function computeGaps(chars) {
  const allSlugs = new Set(chars.map(c => c.slug));
  return chars.map(c => {
    const issues = [];
    const talismanLength = c.talisman?.trim().length || 0;
    const shadowLength = c.shadow?.trim().length || 0;
    const bioLength = c.bio?.trim().length || 0;
    const paragraphs = bioParagraphCount(c.bio);

    if (talismanLength < 30) issues.push('talisman');
    else if (talismanLength < 340) issues.push('talisman-thin');

    if (shadowLength < 30) issues.push('shadow');
    else if (shadowLength < 340) issues.push('shadow-thin');

    if (bioLength < 150) issues.push('bio');
    else {
      if (paragraphs < 4) issues.push('bio-structure');
      if (bioLength < 900) issues.push('bio-thin');
    }

    if (hasSpecificLocationReference(c.bio) || hasSpecificLocationReference(c.talisman) || hasSpecificLocationReference(c.shadow) || hasSpecificLocationReference(c.artifact)) {
      issues.push('location-specific');
    }

    const broken = (c.relations || []).filter(r => !allSlugs.has(r));
    if (broken.length) issues.push(`broken-relations(${broken.join(',')})`);
    return issues.length
      ? { slug: c.slug, role: c.role, arcana: c.arcana, n: c.n, issues, score: gapScore(issues) }
      : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score || (a.n ?? 99) - (b.n ?? 99));
}

export function computeContentRatings(chars) {
  const gaps = computeGaps(chars);
  const bySlug = new Map(gaps.map(gap => [gap.slug, gap]));
  const characters = chars.map(char => {
    const gap = bySlug.get(char.slug);
    const penalty = gap?.score || 0;
    const score = Math.max(0, 100 - penalty * 4);
    return {
      slug: char.slug,
      role: char.role,
      score,
      label: scoreToLabel(score),
      issues: gap?.issues || [],
    };
  }).sort((a, b) => a.score - b.score || a.role.localeCompare(b.role));

  const overallScore = characters.length
    ? Math.round(characters.reduce((sum, char) => sum + char.score, 0) / characters.length)
    : 100;

  return {
    overall: {
      score: overallScore,
      label: scoreToLabel(overallScore),
    },
    weakest: characters.slice(0, 5),
    strongest: [...characters].sort((a, b) => b.score - a.score || a.role.localeCompare(b.role)).slice(0, 5),
  };
}

export function buildAgentPrompt(action, chars, gaps, encounters, loreTitles = '(none yet)') {
  if (action === 'patch-fields') {
    // Phase 1 (slug selection) is handled deterministically in server.js — no AI call needed.
    // Phase 2 (writing) uses buildWritingPrompt().
  }

  if (action === 'add-encounter') {
    const existingIds = new Set(encounters.map(e => [e.slugA, e.slugB].sort().join('--')));
    const seen = new Set();
    const pairs = [];
    for (const c of chars) {
      for (const rel of (c.relations || [])) {
        const id = [c.slug, rel].sort().join('--');
        if (!existingIds.has(id) && !seen.has(id) && chars.find(x => x.slug === rel)) {
          seen.add(id);
          pairs.push({ slugA: c.slug, slugB: rel });
        }
      }
    }
    const pairLines = pairs.map(p => {
      const a = chars.find(c => c.slug === p.slugA);
      const b = chars.find(c => c.slug === p.slugB);
      return `  ${a?.role} (${p.slugA}) + ${b?.role} (${p.slugB})`;
    }).join('\n');
    const charSummaries = chars.map(c =>
      `${c.role} (${c.slug}, ${c.arcana}): ${c.essence || ''} [${(c.keywords || []).join(', ')}]`
    ).join('\n');

    return `You are writing an encounter for The Unknown Collective — 22 people in an unnamed Central European city who persist across centuries. These encounters should read like reconstructed incidents from a municipal archive, not fantasy set-pieces.

## Pairs with a relation but no encounter yet:
${pairLines}

## All characters:
${charSummaries}

${WRITING_GUIDELINES}

## Task
Choose the pair whose tension would produce the most interesting incident. Not "archetypal resonance" — an actual event. A meeting, an argument, a transaction, a silence.

The title should name what happened, not who was involved. Good: "What Was Agreed by the River, November 1923." Bad: "The Curator and the Oracle — A Meeting of Minds."

Before writing, re-read the BANNED WORDS list and the BANNED LOCATION REFERENCES list. Strip any of those terms before submitting.

Respond in this exact format:

<choice slugA="SLUG-A" slugB="SLUG-B" title="SPECIFIC TITLE — name the event">
One sentence: why this pair.
</choice>

<draft>
[2-4 paragraphs. Name a specific kind of place in the city, a season or year, a physical object. Witness/historian perspective. Short sentences. No mythology. No named real-world locations.]
</draft>`;
  }

  if (action === 'coherence-check') {
    const allSlugs = new Set(chars.map(c => c.slug));
    const broken = [];
    for (const c of chars) {
      for (const rel of (c.relations || [])) {
        if (!allSlugs.has(rel)) broken.push(`${c.slug} → ${rel} (unknown slug)`);
        else if (!(chars.find(x => x.slug === rel)?.relations || []).includes(c.slug))
          broken.push(`${c.slug} → ${rel} (one-directional)`);
      }
    }
    const charLines = chars.map(c =>
      `${c.role} (${c.slug}, ${c.arcana}, ${c.tier}): keywords=[${(c.keywords || []).join(',')}] relations=[${(c.relations || []).join(',')}]`
    ).join('\n');

    return `You are auditing The Unknown Collective database for coherence. Be precise and factual — flag specific problems with file references, not vague observations.

## Pre-computed relation issues:
${broken.length ? broken.join('\n') : '(none)'}

## All characters:
${charLines}

${WRITING_GUIDELINES}

## Task
Write a coherence report. Check:
1. Relation issues listed above (broken links, one-directional)
2. Keywords — do they align with the tarot arcana meaning, or are they generic filler?
3. Tier assignments — does the character's role match their tier definition?
4. Tone — flag any existing text that violates the voice rules (fantasy language, banned words, generic phrasing)
5. Geographic specificity — flag any use of real Munich place names or direct city naming that should be abstracted

Respond in this exact format:

<choice title="Coherence Report">
Brief summary: how many issues, severity.
</choice>

<draft>
## Broken Relations
[list each issue with both slugs]

## Keyword Audit
[per-character: are keywords derived from arcana meaning or just generic? flag mismatches]

## Tone Violations
[flag specific phrases from existing content that use banned words or fantasy language]

## Location Specificity
[flag specific phrases that name Munich or real local landmarks and suggest abstract replacements]

## Recommendations
[prioritized list of specific fixes, most impactful first]
</draft>`;
  }

  if (action === 'expand-lore') {
    const charSummaries = chars.map(c =>
      `${c.role} (${c.slug}, ${c.arcana}, ${c.tier}): ${c.essence || ''}`
    ).join('\n');

    return `You are expanding world lore for The Unknown Collective — 22 people in an unnamed Central European city who persist across centuries. Lore entries should read like academic footnotes or municipal history — not fantasy worldbuilding.

## Existing lore entries: ${loreTitles}

## All characters:
${charSummaries}

${WRITING_GUIDELINES}

## Task
Identify a gap — something multiple characters' bios imply but that has no standalone entry yet. Good topics: a recurring kind of place in the city, how induction into the Collective actually works, what The Bind is in practical terms, a recurring event or ritual, the tier structure's origin.

Write like a researcher presenting findings. Cite which characters' records support each claim. Acknowledge contradictions instead of smoothing them over.

Before writing, re-read the BANNED WORDS list and the BANNED LOCATION REFERENCES list. No fantasy language. No named real-world locations.

Respond in this exact format:

<choice title="SPECIFIC LORE TITLE">
One sentence: what gap you identified.
</choice>

<draft>
[3-5 paragraphs. Scholar tone. Name sources ("The Curator's records suggest…", "Two accounts from the 1920s…"). Do not contradict existing bios. Where facts are ambiguous, say so.]
</draft>`;
  }

  throw new Error(`Unknown action: ${action}`);
}

export function parseDraftOutput(text) {
  // Strip markdown code fences that models sometimes add
  const cleaned = text.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
  const choiceMatch = cleaned.match(/<choice([^>]*)>([\s\S]*?)<\/choice>/);
  const draftMatch = cleaned.match(/<draft>([\s\S]*?)<\/draft>/);
  if (!choiceMatch || !draftMatch) return null;
  const attrs = {};
  (choiceMatch[1] || '').replace(/(\w+)="([^"]*)"/g, (_, k, v) => { attrs[k] = v; });
  return { attrs, reasoning: choiceMatch[2].trim(), content: draftMatch[1].trim() };
}

// ─── Two-phase patch-fields ────────────────────────────────────────────────────
// Phase 1: select which character + field to work on (small, focused call)
export function buildSelectionPrompt(gaps) {
  const gapLines = gaps.map(g => {
    const content = g.issues.filter(i => !i.startsWith('broken')).join(', ');
    return `  slug: ${g.slug} | role: ${g.role} | arcana: ${g.arcana} | missing: ${content}`;
  }).join('\n');
  const validSlugs = gaps.map(g => g.slug).join(', ');

  return `You are auditing The Unknown Collective — 22 characters in an unnamed Central European city. These characters have missing or weak content:

${gapLines}

VALID SLUGS (copy one exactly, character-for-character): ${validSlugs}

Choose ONE to work on. Priority: missing both talisman+shadow > missing one > thin bio.

CRITICAL: The SLUG line must be copied EXACTLY from the VALID SLUGS list above. Do not invent, abbreviate, or alter the slug. Do not use a name — use the slug.

Reply with EXACTLY these three lines. No preamble, no explanation, nothing else:
SLUG: <copy one slug exactly from VALID SLUGS above>
FIELD: <talisman-shadow or bio>
REASON: <one sentence — what the archetype demands that the missing field should provide>`;
}

// Phase 2: write the content with full character context loaded
export function buildWritingPrompt(char, field, relatedChars, architectureEntry = null) {
  const arcanaNote = architectureEntry || ARCANA_NOTES[char.arcana] || '(no archetype note available)';

  const existingContent = field === 'talisman-shadow'
    ? `Current Talisman: ${char.talisman && char.talisman.trim().length > 30 ? char.talisman : '(missing)'}
Current Shadow: ${char.shadow && char.shadow.trim().length > 30 ? char.shadow : '(missing)'}`
    : `Current Bio: ${char.bio && char.bio.trim().length > 50 ? char.bio : '(missing or thin)'}`;

  const relatedSection = relatedChars.length > 0
    ? relatedChars.map(r => `### ${r.role} (${r.slug})
Essence: ${r.essence || '(none)'}
Bio: ${r.bio ? r.bio.slice(0, 400) + (r.bio.length > 400 ? '…' : '') : '(none)'}`).join('\n\n')
    : '(none)';

  const taskDesc = field === 'talisman-shadow'
    ? `Write BOTH ## Talisman and ## Shadow sections. Start immediately with "## Talisman". No preamble. No XML. Just the markdown.`
    : `Write a bio: 4-5 paragraphs, blank line between each. No section headers. No preamble. Start with the first paragraph.`;

  return `You are writing ${field === 'talisman-shadow' ? 'talisman and shadow sections' : 'a bio'} for ${char.role} in The Unknown Collective — 22 real-seeming people in an unnamed Central European city, not a fantasy guild.

## Character
Role: ${char.role}
Arcana: ${char.arcana}
Tier: ${char.tier}
Keywords: ${(char.keywords || []).join(', ')}
Essence: ${char.essence || '(none)'}
Artifact: ${char.artifact || '(none)'}
Quote: ${char.quote || '(none)'}
Relations: ${(char.relations || []).join(', ') || 'none'}
${existingContent}

## Archetype logic (use this as the hidden architecture for what you write)
${arcanaNote}

## Related characters (for context and consistency)
${relatedSection}

${WRITING_GUIDELINES}

## Task
${taskDesc}

Ground every sentence in the archetype logic above. Translate it into concrete behavioral or perceptual effects in the city without naming real places. Do not describe the archetype — embody it in specific, dry detail. If existing text contains named Munich references, replace them with abstract equivalents rather than preserving them.`;
}

// Parse the Phase 1 selection response
export function parseSelection(text) {
  const slug = text.match(/^SLUG:\s*(.+)$/mi)?.[1]?.trim();
  const rawField = text.match(/^FIELD:\s*(.+)$/mi)?.[1]?.trim()?.toLowerCase();
  const reason = text.match(/^REASON:\s*(.+)$/mi)?.[1]?.trim();
  if (!slug || !rawField) return null;
  const field = rawField.includes('bio') ? 'bio' : 'talisman-shadow';
  return { slug, field, reason: reason || '' };
}
