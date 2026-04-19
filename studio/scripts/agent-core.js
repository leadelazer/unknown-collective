// Shared agent logic — used by both studio/server.js (local) and studio/scripts/run-agent.js (GitHub Actions).
// Pure functions only: no file I/O, no API calls.

export const WRITING_GUIDELINES = `Writing guidelines:
- Talisman: What does holding this card activate in the carrier? Address the reader directly ("you may find…", "those who carry…"). 3-5 sentences. Specific, not generic.
- Shadow: The danger or blindspot of this card's energy. Mirror the talisman, reveal the cost. 3-5 sentences.
- Bio: 4-5 paragraphs, blank line between each. Structure: arrival in Munich → role → key relationships → current state. Quiet, specific, literary.
- Tone: restrained, specific. Avoid superlatives. Sentences that feel like evidence rather than description.
- Munich setting. Characters exist across centuries.`;

export function computeGaps(chars) {
  const allSlugs = new Set(chars.map(c => c.slug));
  return chars.map(c => {
    const issues = [];
    if (!c.talisman || c.talisman.trim().length < 30) issues.push('talisman');
    if (!c.shadow || c.shadow.trim().length < 30) issues.push('shadow');
    if (!c.bio || c.bio.trim().length < 150) issues.push('bio');
    const broken = (c.relations || []).filter(r => !allSlugs.has(r));
    if (broken.length) issues.push(`broken-relations(${broken.join(',')})`);
    return issues.length ? { slug: c.slug, role: c.role, arcana: c.arcana, n: c.n, issues } : null;
  }).filter(Boolean);
}

export function buildAgentPrompt(action, chars, gaps, encounters, loreTitles = '(none yet)') {
  if (action === 'patch-fields') {
    const gapLines = gaps.map(g => `  ${g.role} (${g.slug}): missing ${g.issues.join(', ')}`).join('\n');
    const withGaps = chars.filter(c => gaps.some(g => g.slug === c.slug));
    const charDetails = withGaps.map(c => `### ${c.role} — ${c.arcana} (${c.slug})
Tier: ${c.tier} | Keywords: ${(c.keywords || []).join(', ')}
Essence: ${c.essence || '(none)'}
Relations: ${(c.relations || []).join(', ') || 'none'}
Bio: ${c.bio && c.bio.trim().length > 50 ? c.bio.slice(0, 300) + '…' : '(missing or thin)'}
Talisman: ${c.talisman && c.talisman.trim().length > 30 ? '✓ present' : '(missing)'}
Shadow: ${c.shadow && c.shadow.trim().length > 30 ? '✓ present' : '(missing)'}`).join('\n\n');

    return `You are writing content for The Unknown Collective — 22 archetypal characters in Munich mapped to Major Arcana tarot.

## Characters with missing content:
${gapLines}

## Details:
${charDetails}

${WRITING_GUIDELINES}

## Task
Choose ONE character that most needs attention. Priority: missing both talisman+shadow > missing one > thin bio.

Respond in this exact format — nothing before <choice>:

<choice slug="THE-SLUG" field="talisman-shadow OR bio">
One sentence: why you chose this character.
</choice>

<draft>
[If talisman-shadow:]
## Talisman

[3-5 sentences]

## Shadow

[3-5 sentences]

[If bio: 4-5 paragraphs separated by blank lines]
</draft>`;
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

    return `You are writing an encounter for The Unknown Collective — 22 archetypal characters in Munich mapped to Major Arcana tarot.

## Pairs with a relation but no encounter yet:
${pairLines}

## All characters:
${charSummaries}

${WRITING_GUIDELINES}

## Task
Choose the pair with the most interesting archetypal tension or resonance.

Respond in this exact format:

<choice slugA="SLUG-A" slugB="SLUG-B" title="SPECIFIC EVOCATIVE TITLE — name the event, not just the characters">
One sentence: why this pair.
</choice>

<draft>
[2-4 paragraphs. Witness/historian perspective, as if reconstructed from records.]
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

    return `You are auditing The Unknown Collective database for coherence.

## Pre-computed relation issues:
${broken.length ? broken.join('\n') : '(none)'}

## All characters:
${charLines}

${WRITING_GUIDELINES}

## Task
Write a coherence report. Check: keyword alignment with tarot arcana, tier logic, relation issues above.

Respond in this exact format:

<choice title="Coherence Report">
Brief summary of what you found.
</choice>

<draft>
## Broken Relations
[list issues]

## Keyword Audit
[per-character notes on keyword alignment with arcana meaning]

## Recommendations
[prioritized list of fixes]
</draft>`;
  }

  if (action === 'expand-lore') {
    const charSummaries = chars.map(c =>
      `${c.role} (${c.slug}, ${c.arcana}, ${c.tier}): ${c.essence || ''}`
    ).join('\n');

    return `You are expanding world lore for The Unknown Collective — 22 archetypal characters in Munich mapped to Major Arcana tarot.

## Existing lore entries: ${loreTitles}

## All characters:
${charSummaries}

${WRITING_GUIDELINES}

## Task
Identify a gap in the world lore — something multiple characters imply but that isn't written. Good topics: The Bind's nature, how characters join the Collective, a recurring Munich location, a ritual, tier history.

Respond in this exact format:

<choice title="SPECIFIC LORE TITLE">
One sentence: what gap you identified.
</choice>

<draft>
[3-5 paragraphs. Scholar/witness tone. Does not contradict existing bios.]
</draft>`;
  }

  throw new Error(`Unknown action: ${action}`);
}

export function parseDraftOutput(text) {
  const choiceMatch = text.match(/<choice([^>]*)>([\s\S]*?)<\/choice>/);
  const draftMatch = text.match(/<draft>([\s\S]*?)<\/draft>/);
  if (!choiceMatch || !draftMatch) return null;
  const attrs = {};
  (choiceMatch[1] || '').replace(/(\w+)="([^"]*)"/g, (_, k, v) => { attrs[k] = v; });
  return { attrs, reasoning: choiceMatch[2].trim(), content: draftMatch[1].trim() };
}
