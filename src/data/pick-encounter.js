#!/usr/bin/env node
/**
 * pick-encounter.js
 * ─────────────────
 * Game-like random encounter generator.
 * Selects 2–5 characters who could plausibly meet, picks a type and setting,
 * respects the optional `era` frontmatter field for timeline consistency,
 * and outputs a ready-to-use encounter writer prompt + file stub.
 *
 * Usage:
 *   node src/data/pick-encounter.js
 *   node src/data/pick-encounter.js --year 1930
 *   node src/data/pick-encounter.js --count 3 --year 1920
 *   node src/data/pick-encounter.js --type argument
 *   node src/data/pick-encounter.js --seed oracle,florist
 *
 * Flags:
 *   --year <n>        Set the encounter year (otherwise random 1880–1970)
 *   --count <n>       Force exactly n participants (2–5)
 *   --type <slug>     Force encounter type (see TYPES below)
 *   --seed <slugs>    Comma-separated slugs that MUST be included
 *   --write           Create the .md stub file in src/data/encounters/
 *   --dry             Show output without creating file (default)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const charsDir  = path.join(__dirname, 'characters');
const encDir    = path.join(__dirname, 'encounters');

// ─── Parse CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
}
const forceYear  = flag('year')  ? parseInt(flag('year'), 10)  : null;
const forceCount = flag('count') ? parseInt(flag('count'), 10) : null;
const forceType  = flag('type')  ?? null;
const seedSlugs  = flag('seed')  ? flag('seed').split(',').map(s => s.trim()) : [];
const doWrite    = args.includes('--write');

// ─── Encounter types ───────────────────────────────────────────────────────────
//
// Each entry: { id, label, verb, prompt }
//   verb   – how to describe what happened in one phrase
//   prompt – instruction fragment for the writer agent

const TYPES = [
  {
    id: 'argument',
    label: 'A Dispute',
    verb: 'a dispute between',
    prompt: 'Write this as a dispute or tension — not necessarily a shouting match, but a fundamental disagreement over something specific. The reader should understand both positions. The outcome should be ambiguous or unresolved.',
  },
  {
    id: 'gathering',
    label: 'A Collective Gathering',
    verb: 'a collective gathering involving',
    prompt: 'Write this as a formal or semi-formal gathering of the Collective — a ritual, a vote, a rare convening. Something is decided or acknowledged, though the full weight of it may not be known immediately.',
  },
  {
    id: 'chance',
    label: 'A Chance Meeting',
    verb: 'a chance meeting between',
    prompt: 'Write this as an unplanned encounter — two or more figures converging by accident. The meeting is brief. Something small passes between them that neither expected.',
  },
  {
    id: 'negotiation',
    label: 'A Negotiation',
    verb: 'a private negotiation between',
    prompt: 'Write this as a closed exchange — a deal, a request, a favour offered or withheld. The terms are not written down. At least one party is not entirely satisfied with the outcome.',
  },
  {
    id: 'observation',
    label: 'An Observation',
    verb: 'an observation of',
    prompt: 'Write this from a witness perspective — one or more figures observing another without making contact. What is seen may be interpreted differently by different observers. The subject may or may not be aware.',
  },
  {
    id: 'reckoning',
    label: 'A Reckoning',
    verb: 'a reckoning between',
    prompt: 'Write this as a confrontation with something unfinished from the past — a debt, a silence, a decision that was never revisited. The encounter does not resolve cleanly. Something is named that was previously unsaid.',
  },
  {
    id: 'convergence',
    label: 'An Unexpected Convergence',
    verb: 'an unexpected convergence of',
    prompt: 'Write this as a moment where normally separate figures end up in the same place at the same time. The significance is in the pattern, not the drama. What does it mean that these particular people were here at once?',
  },
  {
    id: 'commission',
    label: 'A Commission or Request',
    verb: 'a commission between',
    prompt: 'Write this as a transaction of some kind — not purely financial, but something is being asked for and something is being given. The nature of the exchange reveals something about both parties.',
  },
];

// ─── Settings/contexts ─────────────────────────────────────────────────────────

const SETTINGS = [
  'the central square, in early morning',
  'the cold archive\'s reading room',
  'a market stall, late afternoon',
  'the ferry embankment, before crossing',
  'a funeral reception, unattributed',
  'the old exchange building',
  'a correspondence that became a visit',
  'the lower registry, after hours',
  'a café at the corner of the square',
  'a private garden, unannounced',
  'a winter ceremony of the Collective',
  'the library steps',
  'a doorway in the old district',
  'the bakehouse courtyard, early morning',
  'the supply entrance of the market hall',
  'a ceremony whose name has not been recorded',
  'the weavers\' workroom, during a fitting',
  'the brewer\'s yard, harvest season',
];

// ─── Topic seeds (optional flavour injected into prompt) ──────────────────────

const TOPICS = [
  'a piece of correspondence that was misattributed',
  'access to something only one of them holds',
  'a debt that was never formally acknowledged',
  'a name that appears in multiple records inconsistently',
  'an object that should not be where it is',
  'a death in the city and what it means for the Collective',
  'the question of who was present at a founding event',
  'an interpretation of something that happened years earlier',
  'a commission that cannot be undone',
  'the silence that followed a previous encounter',
  'a key that opens the wrong door',
  'something overheard that was not meant to be',
  'the boundaries of the Collective\'s territory',
  'a record that contradicts lived memory',
  'an alliance that others are not meant to know about',
];

// ─── Load characters ───────────────────────────────────────────────────────────

function readFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
    if (!m) continue;
    const k = m[1], v = m[2].trim();
    if (v === 'null' || v === '') { fm[k] = null; continue; }
    if (/^\d+$/.test(v)) { fm[k] = parseInt(v, 10); continue; }
    fm[k] = v.replace(/^["']|["']$/g, '');
  }
  return fm;
}

const characters = fs.readdirSync(charsDir)
  .filter(f => f.endsWith('.md'))
  .map(f => readFrontmatter(path.join(charsDir, f)))
  .filter(Boolean)
  .filter(c => c.slug);

// ─── Random helpers ────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ─── Timeline filtering ────────────────────────────────────────────────────────
// Characters with no `era` field are considered always present (timeless guides,
// eternal presences). Characters with an era can only appear in/after their era year.

function isActive(char, year) {
  if (!char.era) return true; // timeless or unspecified
  return char.era <= year;
}

// ─── Generate encounter ────────────────────────────────────────────────────────

// 1. Determine year
const year = forceYear ?? rand(1880, 1970);

// 2. Filter eligible characters
const eligible = characters.filter(c => isActive(c, year));
if (eligible.length < 2) {
  console.error(`Only ${eligible.length} characters are active in ${year}. Try a later year.`);
  process.exit(1);
}

// 3. Validate and anchor seed characters
const seeded = seedSlugs
  .map(s => eligible.find(c => c.slug === s))
  .filter(Boolean);

const unknownSeeds = seedSlugs.filter(s => !eligible.find(c => c.slug === s));
if (unknownSeeds.length) {
  console.warn(`Warning: seed slug(s) not found or not active in ${year}: ${unknownSeeds.join(', ')}`);
}

// 4. Determine count (2–5)
const minCount = Math.max(2, seeded.length);
const maxCount = 5;
const count = forceCount
  ? Math.min(Math.max(forceCount, minCount), maxCount)
  : rand(minCount, Math.min(3, eligible.length, maxCount)); // bias toward smaller groups

// 5. Pick participants
const remaining = eligible.filter(c => !seeded.find(s => s.slug === c.slug));
const additional = pickN(remaining, count - seeded.length);
const participants = [...seeded, ...additional];

// Sort by n for canonical filename
participants.sort((a, b) => a.n - b.n);
const slugs = participants.map(c => c.slug);

// 6. Pick type + setting + topic
const type    = forceType ? (TYPES.find(t => t.id === forceType) ?? pick(TYPES)) : pick(TYPES);
const setting = pick(SETTINGS);
const topic   = pick(TOPICS);

// 7. Build filename
const candidateId = slugs.join('--');
const existingIds = fs.readdirSync(encDir)
  .filter(f => f.endsWith('.md'))
  .map(f => path.basename(f, '.md'));

if (existingIds.includes(candidateId)) {
  console.warn(`⚠  An encounter file for ${candidateId} already exists.`);
}

// 8. Generate prompt for encounter writer agent
const roles = participants.map(c => `${c.role} (${c.slug})`).join(', ');
const prompt = `Read the following character files and their bios:
${slugs.map(s => `  unknown-collective/src/data/characters/${s}.md`).join('\n')}
${slugs.map(s => `  unknown-collective/src/data/bios/${s}.md`).join('\n')}

Write an encounter document and save it to:
  unknown-collective/src/data/encounters/${candidateId}.md

FORMAT:
---
title: [A specific, evocative title for this event — name the occasion, not just the people]
---

[Body: 2–4 paragraphs. Prose style: restrained, specific, as if reconstructed from records.
Third-person. Witness or archivist perspective. Do not name the city.
Do not resolve the encounter cleanly. End on ambiguity or implication.]

ENCOUNTER PARAMETERS:
- Type: ${type.label}
- Year: approximately ${year}
- Setting: ${setting}
- Central tension or subject: ${topic}
- Participants: ${roles}

WRITER INSTRUCTION:
${type.prompt}

Match the prose style of the Curator and Oracle bios. Quiet, specific, literary.
Specific detail beats general description. Sentences that feel like evidence.`;

// ─── Output ────────────────────────────────────────────────────────────────────

console.log('\n── ENCOUNTER PICK ────────────────────────────────────────────────');
console.log(`  File:    ${candidateId}.md`);
console.log(`  Year:    ${year}`);
console.log(`  Type:    ${type.label}`);
console.log(`  Setting: ${setting}`);
console.log(`  Topic:   ${topic}`);
console.log(`\n  Participants (${participants.length}):`);
for (const c of participants) {
  console.log(`    · ${c.role.padEnd(24)} [${c.slug}]${c.era ? `  era: ${c.era}` : ''}`);
}
console.log('\n── WRITER PROMPT ─────────────────────────────────────────────────');
console.log(prompt);
console.log('──────────────────────────────────────────────────────────────────\n');

// ─── Optional: write stub file ────────────────────────────────────────────────

if (doWrite) {
  const outputPath = path.join(encDir, `${candidateId}.md`);
  if (fs.existsSync(outputPath)) {
    console.warn(`⚠  ${candidateId}.md already exists – not overwriting. Remove it first.`);
  } else {
    const stub = `---
title: [title – replace this]
---

[Write encounter body here, or run via agent with the prompt above]
`;
    fs.writeFileSync(outputPath, stub, 'utf-8');
    console.log(`✓ Stub written to src/data/encounters/${candidateId}.md`);
    console.log(`  Run node src/data/sync-all.js to register it.`);
  }
}
