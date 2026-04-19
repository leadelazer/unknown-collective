// UC Studio – local API server (port 3099)
// Reads/writes markdown source files in ../src/data/

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { computeGaps, computeContentRatings, buildAgentPrompt, parseDraftOutput, buildWritingPrompt, buildCoherenceFixPrompt, choosePatchField, getFieldLabel, normalizeTargetField } from './scripts/agent-core.js';
import { evaluateCanonicalRoster } from './scripts/evals.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '../src/data');
const CHARS_DIR = path.join(DATA, 'characters');
const BIOS_DIR = path.join(DATA, 'bios');
const ENCOUNTERS_DIR = path.join(DATA, 'encounters');
const LORE_DIR = path.join(DATA, 'lore');
const DRAFTS_DIR = path.join(DATA, 'drafts');
const CHRONICLE_DIR = path.join(DATA, 'chronicle');
const UC_ROOT = path.join(__dirname, '..');

[ENCOUNTERS_DIR, LORE_DIR, DRAFTS_DIR, CHRONICLE_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };
  const fm = {};
  const lines = match[1].split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const km = line.match(/^([\w-]+)\s*:\s*(.*)/);
    if (!km) { i++; continue; }
    const key = km[1];
    const val = km[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim();
      fm[key] = inner ? inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')) : [];
      i++; continue;
    }
    if (val === '[]') { fm[key] = []; i++; continue; }
    if (val === '') {
      const items = []; i++;
      while (i < lines.length && lines[i].startsWith('  ')) {
        if (lines[i].startsWith('  - ')) {
          const item = {};
          const f = lines[i].replace(/^\s+-\s+/, '').match(/^([\w-]+)\s*:\s*(.*)/);
          if (f) item[f[1]] = parseScalar(f[2].trim());
          i++;
          while (i < lines.length && lines[i].startsWith('    ')) {
            const s = lines[i].trim().match(/^([\w-]+)\s*:\s*(.*)/);
            if (s) item[s[1]] = parseScalar(s[2].trim());
            i++;
          }
          items.push(item);
        } else { i++; }
      }
      fm[key] = items; continue;
    }
    fm[key] = parseScalar(val);
    i++;
  }
  return { fm, body: match[2].trim() };
}

function parseScalar(v) {
  if (!v || v === 'null') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    try { return JSON.parse(v.startsWith('"') ? v : `"${v.slice(1, -1)}"`); } catch { return v; }
  }
  return v;
}

function parseSections(body) {
  const sections = {};
  const parts = body.split(/^## /m).filter(Boolean);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const heading = part.slice(0, nl).trim().toLowerCase();
    sections[heading] = part.slice(nl + 1).trim();
  }
  return sections;
}

function parsePalette(sectionBody) {
  return (sectionBody || '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function parseRelationNotes(sectionBody) {
  return (sectionBody || '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.match(/^-\s*([^:]+):\s*(.+)$/))
    .filter(Boolean)
    .map(([, slug, note]) => ({ slug: slug.trim(), note: note.trim() }));
}

function readChar(slug) {
  const charFile = path.join(CHARS_DIR, `${slug}.md`);
  const bioFile = path.join(BIOS_DIR, `${slug}.md`);
  if (!fs.existsSync(charFile)) return null;
  const { fm, body } = parseFrontmatter(fs.readFileSync(charFile, 'utf8'));
  const sections = parseSections(body);
  return {
    ...fm,
    talisman: sections.talisman || null,
    shadow: sections.shadow || null,
    bio: fs.existsSync(bioFile) ? fs.readFileSync(bioFile, 'utf8').trim() : '',
  };
}

function writeChar(slug, data) {
  // Write characters/<slug>.md
  const { bio, talisman, shadow, ...fm } = data;
  let front = '---\n';
  for (const [k, v] of Object.entries(fm)) {
    if (k === 'img') continue; // derived
    if (Array.isArray(v)) {
      if (v.length && typeof v[0] === 'object') {
        front += `${k}:\n`;
        for (const item of v) {
          const entries = Object.entries(item);
          front += `  - ${entries[0][0]}: ${yamlStr(entries[0][1])}\n`;
          for (const [ik, iv] of entries.slice(1)) front += `    ${ik}: ${yamlStr(iv)}\n`;
        }
      } else {
        front += `${k}: [${v.map(yamlStr).join(', ')}]\n`;
      }
    } else {
      front += `${k}: ${yamlStr(v)}\n`;
    }
  }
  front += '---\n';
  let body = '';
  if (talisman) body += `\n## Talisman\n\n${talisman}\n`;
  if (shadow) body += `\n## Shadow\n\n${shadow}\n`;
  fs.writeFileSync(path.join(CHARS_DIR, `${slug}.md`), front + body, 'utf8');

  // Write bios/<slug>.md
  if (bio !== undefined) {
    fs.writeFileSync(path.join(BIOS_DIR, `${slug}.md`), bio, 'utf8');
  }
}

function yamlStr(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    const needsQuote = /[:#"'\n\[\]{}]/.test(v) || v === '' || v === 'null' || v === 'true' || v === 'false';
    return needsQuote ? JSON.stringify(v) : v;
  }
  return JSON.stringify(v);
}

function readArchitectureEntry(role) {
  try {
    const archPath = path.join(LORE_DIR, 'arcana-architecture.md');
    if (!fs.existsSync(archPath)) return null;
    const archDoc = fs.readFileSync(archPath, 'utf8');
    const match = archDoc.match(new RegExp(`## \\d+\.\\s+${role.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}[\\s\\S]*?(?=\n---\n## |$)`));
    return match ? match[0].trim() : null;
  } catch {
    return null;
  }
}

function readEncounters() {
  if (!fs.existsSync(ENCOUNTERS_DIR)) return [];
  return fs.readdirSync(ENCOUNTERS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const id = path.basename(f, '.md');
      const raw = fs.readFileSync(path.join(ENCOUNTERS_DIR, f), 'utf8');
      const { fm, body } = parseFrontmatter(raw);
      const participants = id.split('--').map(part => part.trim()).filter(Boolean);
      const [a, b = null] = participants;
      return { id, slugA: a, slugB: b, participants, ...fm, body: body.trim() };
    });
}

function readLore() {
  if (!fs.existsSync(LORE_DIR)) return [];
  return fs.readdirSync(LORE_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const id = path.basename(f, '.md');
      const raw = fs.readFileSync(path.join(LORE_DIR, f), 'utf8');
      const { fm, body } = parseFrontmatter(raw);
      return { id, ...fm, body: body.trim() };
    });
}

// ─── Chronicle helpers ────────────────────────────────────────────────────────

const DEFAULT_MODEL_SYSTEM_PROMPT = 'You write like a journalist covering strange municipal history — dry, specific, observational. Short sentences. Physical details. No fantasy language, no superlatives, no self-help tone. You are documenting real-seeming people, not mythological figures. The city is NEVER named — do not write Munich, Munchen, Eisbach, Marienplatz, Isar, or any real landmark; use abstract spatial language (the river, the central square, the northern district). Follow all formatting instructions exactly. Output only what is asked — no preamble or commentary outside the specified tags.';
const CHRONICLE_SYSTEM_PROMPT = 'You are writing an agent field note after approving an edit. The note must sound like an editorial log, not a character monologue and not fiction. First-person singular is allowed and preferred when describing reasoning. State what was weak, what evidence guided the revision, and why particular details were kept or added. Keep the character at arm\'s length: they can answer back briefly, but they are not the narrator. No mention of AI, prompts, or hidden process. No fantasy language. Output only the requested note body.';

// Max tokens for a chronicle field note: enough room for editorial reasoning plus a short line of dialogue.
const CHRONICLE_NOTE_MAX_TOKENS = 420;

function formatDateStr(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const romanYears = { 2024: 'MMXXIV', 2025: 'MMXXV', 2026: 'MMXXVI', 2027: 'MMXXVII', 2028: 'MMXXVIII', 2029: 'MMXXIX', 2030: 'MMXXX' };
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const year = romanYears[d.getUTCFullYear()] || String(d.getUTCFullYear());
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hh}:${mm}`;
}

function formatFileDate(d) {
  const YYYY = d.getUTCFullYear();
  const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}-${hh}${mm}${ss}`;
}

function snippet(text, maxChars = 240) {
  if (!text) return '(none)';
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  if (!normalized) return '(none)';
  if (normalized.length <= maxChars) return normalized;
  return normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
}

function getFieldLabel(field) {
  if (field === 'talisman-shadow') return 'talisman and shadow';
  return field || 'bio';
}

function getFieldGapDescription(char, field) {
  if (field === 'talisman-shadow') {
    const missing = [];
    if (!char.talisman || char.talisman.trim().length < 40) missing.push('talisman');
    if (!char.shadow || char.shadow.trim().length < 40) missing.push('shadow');
    if (!missing.length) return 'the card text was thin and needed sharper archetypal logic';
    if (missing.length === 2) return 'both card sections were missing or too thin';
    return `the ${missing[0]} section was missing or too thin`;
  }

  if (!char.bio || char.bio.trim().length < 80) return 'the bio was missing or too thin';
  return `${field} needed a more grounded shape`;
}

function buildChroniclePrompt(char, field, previousContent, draftContent, relatedChars = []) {
  const fieldLabel = getFieldLabel(field);
  const gapDesc = getFieldGapDescription(char, field);
  const previousPreview = snippet(previousContent, 260);
  const updatedPreview = snippet(draftContent, 320);
  const flowerLine = char.flower ? `\n- Flower: ${char.flower}${char.flowerMeaning ? ` (${char.flowerMeaning})` : ''}` : '';
  const relationLine = relatedChars.length
    ? relatedChars.map(c => `${c.role} (${c.slug})`).join(', ')
    : '(none listed)';

  return `You are writing a field note after patching this character record.

Voice: agent commentary. Editorial, candid, specific. The note should sound like a working log from the agent who made the change.
Length: 3–5 sentences.
The focus is reasoning, not summary.
Use first person when it helps: "I kept", "I cut", "I anchored", "I left the mystery intact" are all acceptable.
Include at most one brief line of dialogue or reported speech from the character if it clarifies why the edit landed the way it did.
Do not use: "I explored", "I delved", "I crafted", "I generated", "fascinating", "intricate", "tapestry", "nuanced".
Do not mention: AI, language model, or prompt.
Do not write as the character.
Do not summarize the draft paragraph by paragraph.
Do not start with scene-setting or atmospheric filler.

Character context:
- Name: ${char.name || char.role}
- Role: ${char.role}
- Arcana: ${char.arcana}
- Keywords: ${(char.keywords || []).join(', ')}
- Essence: ${char.essence || '(none)'}${flowerLine}
- Relations in play: ${relationLine}

Field patched: ${fieldLabel}
Gap found: ${gapDesc}.
Previous content snapshot: ${previousPreview}
Updated content snapshot: ${updatedPreview}

Structure:
Sentence 1: identify the editorial problem.
Sentence 2: name the evidence or character logic that guided the revision.
Sentence 3: explain one or two choices you made in the new copy.
Sentence 4 or 5: optional brief exchange or resistance from the character, if useful.

Write only the field note body. No preamble, no sign-off, no quotation marks.`;
}

function buildEncounterChroniclePrompt(chars, title, previousContent, draftContent) {
  const charLines = chars.map(char => {
    if (!char) return '(missing character record)';
    return `${char.role} (${char.slug}, ${char.arcana}): ${snippet(char.essence, 100)} [${(char.keywords || []).join(', ')}]`;
  }).join('\n');

  return `You are writing a field note after approving an encounter entry.

Voice: agent commentary. Editorial, candid, specific.
Length: 3–5 sentences.
Focus on why this pair and this event were worth recording, what tension or evidence from the character records supported the scene, and why the title or framing was shaped this way.
Include at most one brief reported line from one of the characters if it clarifies the choice.
Do not mention AI, prompts, or hidden process.
Do not write the note as fiction.

Encounter title: ${title || '(untitled)'}
Characters in play:
${charLines}

Previous encounter snapshot: ${snippet(previousContent, 260)}
Approved encounter snapshot: ${snippet(draftContent, 340)}

Structure:
Sentence 1: identify the editorial gap or opportunity.
Sentence 2: name the character tension that justified the encounter.
Sentence 3: explain one choice in the title or scene framing.
Sentence 4 or 5: optional brief resistance or reply from one character.

Write only the field note body. No preamble, no sign-off, no quotation marks.`;
}

function buildLoreChroniclePrompt(action, title, previousContent, draftContent) {
  const subject = action === 'coherence-check' ? 'coherence report' : 'lore entry';
  return `You are writing a field note after approving a ${subject}.

Voice: agent commentary. Editorial, candid, specific.
Length: 3–5 sentences.
Focus on why this topic needed a standalone entry or audit, what evidence in the archive made it necessary, and how the approved draft was shaped.
Do not mention AI, prompts, or hidden process.
Do not write the note as fiction.

Approved title: ${title || '(untitled)'}
Previous snapshot: ${snippet(previousContent, 260)}
Approved snapshot: ${snippet(draftContent, 340)}

Structure:
Sentence 1: identify the gap, contradiction, or need.
Sentence 2: name the evidence base or archive logic.
Sentence 3: explain one decision in scope or framing.
Sentence 4 or 5: optional note about ambiguity left in place.

Write only the field note body. No preamble, no sign-off, no quotation marks.`;
}

function writeChronicleEntry(metadata, text) {
  const now = new Date();
  const content = ['---'];
  const fileId = `${metadata.idBase}-${formatFileDate(now)}`;
  const frontmatter = {
    id: fileId,
    type: 'agent-note',
    model: metadata.model || 'gpt-4o-mini',
    action: metadata.action || 'patch-fields',
    field: metadata.field || '',
    slug: metadata.slug || '',
    slugA: metadata.slugA || '',
    slugB: metadata.slugB || '',
    title: metadata.title || '',
    targetId: metadata.targetId || '',
    date: now.toISOString(),
    dateStr: formatDateStr(now),
    persona: metadata.persona || metadata.slug || '',
  };

  for (const [key, value] of Object.entries(frontmatter)) {
    content.push(`${key}: ${yamlStr(value)}`);
  }

  content.push('---', '', text.trim());
  fs.writeFileSync(path.join(CHRONICLE_DIR, `${fileId}.md`), content.join('\n'), 'utf8');
  execSync('node src/data/sync-chronicle.js', { cwd: UC_ROOT, encoding: 'utf8' });
}

function mergeEncounterContent(existingEncounter, title, additionBody) {
  const existingTitle = existingEncounter?.title?.trim();
  const nextTitle = existingTitle || title || '(untitled)';
  const existingBody = existingEncounter?.body?.trim() || '';
  const incomingBody = (additionBody || '').trim();

  if (!existingBody) {
    return { title: nextTitle, body: incomingBody };
  }

  if (!incomingBody || existingBody === incomingBody || existingBody.includes(incomingBody)) {
    return { title: nextTitle, body: existingBody };
  }

  return {
    title: nextTitle,
    body: `${existingBody}\n\n${incomingBody}`,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/characters', (req, res) => {
  const chars = fs.readdirSync(CHARS_DIR).filter(f => f.endsWith('.md')).map(f => {
    const slug = path.basename(f, '.md');
    return readChar(slug);
  }).filter(Boolean).sort((a, b) => (a.n ?? 99) - (b.n ?? 99));
  res.json(chars);
});

// Get single character
app.get('/api/characters/:slug', (req, res) => {
  const c = readChar(req.params.slug);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

// Save character
app.put('/api/characters/:slug', (req, res) => {
  try {
    writeChar(req.params.slug, req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Encounters
app.get('/api/encounters', (req, res) => res.json(readEncounters()));

app.get('/api/encounters/:id', (req, res) => {
  const file = path.join(ENCOUNTERS_DIR, `${req.params.id}.md`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  const raw = fs.readFileSync(file, 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  const [a, b] = req.params.id.split('--');
  res.json({ id: req.params.id, slugA: a, slugB: b, ...fm, body: body.trim() });
});

app.put('/api/encounters/:id', (req, res) => {
  try {
    const { body, ...fm } = req.body;
    let content = '---\n';
    for (const [k, v] of Object.entries(fm)) {
      if (k === 'id' || k === 'slugA' || k === 'slugB') continue;
      content += `${k}: ${yamlStr(v)}\n`;
    }
    content += '---\n\n' + (body || '');
    fs.writeFileSync(path.join(ENCOUNTERS_DIR, `${req.params.id}.md`), content, 'utf8');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/encounters', (req, res) => {
  const { slugA, slugB } = req.body;
  if (!slugA || !slugB) return res.status(400).json({ error: 'slugA and slugB required' });
  const id = [slugA, slugB].sort().join('--');
  const file = path.join(ENCOUNTERS_DIR, `${id}.md`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `---\ntitle: ${slugA} & ${slugB}\n---\n\n`, 'utf8');
  }
  res.json({ id });
});

app.delete('/api/encounters/:id', (req, res) => {
  const file = path.join(ENCOUNTERS_DIR, `${req.params.id}.md`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

// Lore
app.get('/api/lore', (req, res) => res.json(readLore()));

app.get('/api/lore/:id', (req, res) => {
  const file = path.join(LORE_DIR, `${req.params.id}.md`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  const raw = fs.readFileSync(file, 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  res.json({ id: req.params.id, ...fm, body: body.trim() });
});

app.put('/api/lore/:id', (req, res) => {
  try {
    const { body, id: _id, ...fm } = req.body;
    let content = '---\n';
    for (const [k, v] of Object.entries(fm)) content += `${k}: ${yamlStr(v)}\n`;
    content += '---\n\n' + (body || '');
    fs.writeFileSync(path.join(LORE_DIR, `${req.params.id}.md`), content, 'utf8');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/lore', (req, res) => {
  const { title } = req.body;
  const id = (title || 'untitled').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const file = path.join(LORE_DIR, `${id}.md`);
  fs.writeFileSync(file, `---\ntitle: ${title || 'Untitled'}\n---\n\n`, 'utf8');
  res.json({ id });
});

app.delete('/api/lore/:id', (req, res) => {
  const file = path.join(LORE_DIR, `${req.params.id}.md`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

// Sync → rebuild characters.js + bios.js
app.post('/api/sync', (req, res) => {
  try {
    const out = execSync('node src/data/sync-all.js', { cwd: UC_ROOT, encoding: 'utf8' });
    res.json({ ok: true, output: out });
  } catch (e) {
    res.status(500).json({ error: e.message, output: e.stdout });
  }
});

// ─── GitHub Models ────────────────────────────────────────────────────────────

async function callGitHubModels(prompt, model = 'gpt-4o-mini', maxTokens = 2000, systemPrompt = DEFAULT_MODEL_SYSTEM_PROMPT) {
  let token = process.env.GITHUB_TOKEN;
  if (!token) {
    try { token = execSync('gh auth token', { encoding: 'utf8' }).trim(); }
    catch (e) {
      throw new Error(
        'GitHub authentication required.\n\n' +
        'Option 1: gh CLI (recommended)\n' +
        '  1. Run: gh auth login\n' +
        '  2. Approve the device flow in your browser\n' +
        '  3. Restart Studio (npm run dev)\n\n' +
        'Option 2: Direct token (for testing)\n' +
        '  Export your PAT: export GITHUB_TOKEN="ghp_..."\n' +
        '  Then restart Studio.\n\n' +
        'Error details: ' + e.message
      );
    }
  }
  prompt = fitPromptToModel(prompt, model);
  const r = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      model, max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const contentType = r.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await r.text();
    throw new Error(`GitHub Models API returned a non-JSON response (HTTP ${r.status}). Your token may be invalid or lack model access.\n\nResponse preview: ${text.slice(0, 120)}`);
  }
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || `GitHub Models error ${r.status}`);
  return d.choices[0]?.message?.content || '';
}

function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function inputTokenLimit(model) {
  if ((model || '').startsWith('gpt-4.1')) return 7600;
  return 12000;
}

function fitPromptToModel(prompt, model) {
  const limit = inputTokenLimit(model);
  if (estimateTokens(prompt) <= limit) return prompt;

  const notice = '\n\n[Context truncated to fit the model input limit. Use only the remaining instructions and context.]';
  const maxChars = Math.max(1000, limit * 4 - notice.length);
  return prompt.slice(0, maxChars).trimEnd() + notice;
}

function getGitHubRepo() {
  try {
    const remote = execSync('git remote get-url origin', { cwd: UC_ROOT, encoding: 'utf8' }).trim();
    const m = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
    if (m) return { owner: m[1], repo: m[2], full: `${m[1]}/${m[2]}` };
  } catch {}
  return null;
}

// ─── Gap analysis ─────────────────────────────────────────────────────────────

app.get('/api/gaps', (req, res) => {
  const chars = fs.readdirSync(CHARS_DIR).filter(f => f.endsWith('.md'))
    .map(f => readChar(path.basename(f, '.md'))).filter(Boolean)
    .sort((a, b) => (a.n ?? 99) - (b.n ?? 99));
  const gaps = computeGaps(chars);
  res.json({
    gaps,
    ratings: computeContentRatings(chars),
    evals: evaluateCanonicalRoster(chars),
    total: chars.length,
    encounterCount: readEncounters().length,
    loreCount: readLore().length,
  });
});

// ─── Drafts ───────────────────────────────────────────────────────────────────

app.get('/api/drafts', (req, res) => {
  const drafts = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md')).map(f => {
    const id = path.basename(f, '.md');
    const raw = fs.readFileSync(path.join(DRAFTS_DIR, f), 'utf8');
    const { fm, body } = parseFrontmatter(raw);
    const stat = fs.statSync(path.join(DRAFTS_DIR, f));
    return { id, ...fm, content: body, created: stat.mtimeMs };
  }).sort((a, b) => b.created - a.created);
  res.json(drafts);
});

app.delete('/api/drafts/:id', (req, res) => {
  const file = path.join(DRAFTS_DIR, `${req.params.id}.md`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

app.post('/api/characters/:slug/fix-relation', (req, res) => {
  const { relatedSlug } = req.body || {};
  if (!relatedSlug) return res.status(400).json({ error: 'relatedSlug required' });
  try {
    const left = readChar(req.params.slug);
    const right = readChar(relatedSlug);
    if (!left || !right) return res.status(404).json({ error: 'Character not found' });

    const leftRelations = new Set(left.relations || []);
    const rightRelations = new Set(right.relations || []);
    leftRelations.add(relatedSlug);
    rightRelations.add(req.params.slug);

    writeChar(req.params.slug, { ...left, relations: Array.from(leftRelations) });
    writeChar(relatedSlug, { ...right, relations: Array.from(rightRelations) });

    try {
      execSync('node src/data/sync-all.js', { cwd: UC_ROOT, encoding: 'utf8' });
    } catch {}

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/fix-coherence', async (req, res) => {
  const { slug, issueText, preferredField = null, model = 'gpt-4o-mini' } = req.body || {};
  if (!slug || !issueText) return res.status(400).json({ error: 'slug and issueText required' });
  try {
    const char = readChar(slug);
    if (!char) return res.status(404).json({ error: `Character ${slug} not found` });

    const relatedChars = (char.relations || []).map(rel => readChar(rel)).filter(Boolean);
    const architectureEntry = readArchitectureEntry(char.role);
    const rawOutput = await callGitHubModels(
      buildCoherenceFixPrompt(char, issueText, relatedChars, architectureEntry, preferredField),
      model,
      1400,
    );
    const parsed = parseDraftOutput(rawOutput);
    if (!parsed) return res.status(422).json({ error: 'Agent output did not match expected format', raw: rawOutput });

    const field = parsed.attrs.field || preferredField || 'keywords';
    const draftId = `coherence-fix-${slug}-${field}-${new Date().toISOString().slice(0, 10)}`;
    const draftFm = {
      action: 'coherence-fix',
      model,
      slug,
      field,
      reasoning: parsed.reasoning,
      issueText,
    };

    let front = '---\n';
    for (const [k, v] of Object.entries(draftFm)) front += `${k}: ${yamlStr(v)}\n`;
    front += '---\n';
    fs.writeFileSync(path.join(DRAFTS_DIR, `${draftId}.md`), front + '\n' + parsed.content, 'utf8');

    res.json({ ok: true, draftId, field, reasoning: parsed.reasoning });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/drafts/:id/approve', async (req, res) => {
  const file = path.join(DRAFTS_DIR, `${req.params.id}.md`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Draft not found' });
  const raw = fs.readFileSync(file, 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  let charForChronicle = null;
  let encounterForChronicle = null;
  let loreForChronicle = null;
  try {
    if ((fm.action === 'patch-fields' || fm.action === 'targeted-update') && fm.slug) {
      const char = readChar(fm.slug);
      if (!char) return res.status(404).json({ error: `Character ${fm.slug} not found` });
      charForChronicle = char;
      if (fm.field === 'talisman-shadow') {
        const sections = parseSections(body);
        writeChar(fm.slug, { ...char, talisman: sections.talisman || char.talisman, shadow: sections.shadow || char.shadow });
      } else if (fm.field === 'talisman') {
        const sections = parseSections(body);
        writeChar(fm.slug, { ...char, talisman: sections.talisman || body.trim() || char.talisman });
      } else if (fm.field === 'shadow') {
        const sections = parseSections(body);
        writeChar(fm.slug, { ...char, shadow: sections.shadow || body.trim() || char.shadow });
      } else if (fm.field === 'floriography-palette') {
        const sections = parseSections(body);
        const palette = parsePalette(sections.palette);
        writeChar(fm.slug, {
          ...char,
          flower: sections.flower || char.flower,
          flowerMeaning: sections['flower meaning'] || char.flowerMeaning,
          palette: palette.length > 0 ? palette : char.palette,
        });
      } else if (fm.field === 'relation-notes') {
        const sections = parseSections(body);
        const relationNotes = parseRelationNotes(sections['relation notes'] || body);
        writeChar(fm.slug, { ...char, relationNotes: relationNotes.length > 0 ? relationNotes : char.relationNotes });
      } else if (['artifact', 'quote', 'essence'].includes(fm.field)) {
        writeChar(fm.slug, { ...char, [fm.field]: body.trim() || char[fm.field] });
      } else {
        writeChar(fm.slug, { ...char, bio: body });
      }
    } else if (fm.action === 'coherence-fix' && fm.slug) {
      const char = readChar(fm.slug);
      if (!char) return res.status(404).json({ error: `Character ${fm.slug} not found` });
      charForChronicle = char;
      if (fm.field === 'keywords') {
        const keywords = body.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
        writeChar(fm.slug, { ...char, keywords });
      } else if (fm.field === 'essence') {
        writeChar(fm.slug, { ...char, essence: body.trim() });
      } else if (fm.field === 'talisman-shadow') {
        const sections = parseSections(body);
        writeChar(fm.slug, { ...char, talisman: sections.talisman || char.talisman, shadow: sections.shadow || char.shadow });
      } else {
        writeChar(fm.slug, { ...char, bio: body });
      }
    } else if (fm.action === 'add-encounter' && fm.slugA && fm.slugB) {
      const id = [fm.slugA, fm.slugB].sort().join('--');
      const previousEncounter = readEncounters().find(entry => entry.id === id) || null;
      const mergedEncounter = mergeEncounterContent(previousEncounter, fm.title || id, body);
      fs.writeFileSync(path.join(ENCOUNTERS_DIR, `${id}.md`), `---\ntitle: ${yamlStr(mergedEncounter.title)}\n---\n\n${mergedEncounter.body}`, 'utf8');
      encounterForChronicle = {
        id,
        title: mergedEncounter.title,
        previous: previousEncounter,
        chars: [readChar(fm.slugA), readChar(fm.slugB)].filter(Boolean),
      };
    } else if (fm.action === 'expand-lore' || fm.action === 'coherence-check') {
      const loreId = fm.targetId || req.params.id;
      const previousLore = readLore().find(entry => entry.id === loreId) || null;
      fs.writeFileSync(path.join(LORE_DIR, `${loreId}.md`), `---\ntitle: ${yamlStr(fm.title || loreId)}\n---\n\n${body}`, 'utf8');
      loreForChronicle = {
        id: loreId,
        title: fm.title || loreId,
        previous: previousLore,
      };
    }
    fs.unlinkSync(file);

    // Run sync-all to rebuild generated JS files
    try {
      execSync('node src/data/sync-all.js', { cwd: UC_ROOT, encoding: 'utf8' });
    } catch (syncErr) {
      console.error('sync-all failed after approve:', syncErr.message);
    }

    // Generate chronicle entry for approvals (best-effort)
    if ((fm.action === 'patch-fields' || fm.action === 'targeted-update') && fm.slug && charForChronicle) {
      try {
        const field = fm.field || 'bio';
        const model = fm.model || 'gpt-4o-mini';
        const relatedChars = (charForChronicle.relations || [])
          .map(slug => readChar(slug))
          .filter(Boolean);
        const previousContent = field === 'talisman-shadow'
          ? `Talisman: ${charForChronicle.talisman || '(missing)'}\nShadow: ${charForChronicle.shadow || '(missing)'}`
          : charForChronicle.bio || '(missing)';
        const noteText = await callGitHubModels(
          buildChroniclePrompt(charForChronicle, field, previousContent, body, relatedChars),
          model,
          CHRONICLE_NOTE_MAX_TOKENS,
          CHRONICLE_SYSTEM_PROMPT,
        );
        writeChronicleEntry({
          idBase: `${fm.slug}-${field}`,
          model,
          action: fm.action,
          field,
          slug: fm.slug,
          persona: fm.slug,
        }, noteText);
      } catch (chronicleErr) {
        console.error('Chronicle generation failed:', chronicleErr.message);
      }
    } else if (fm.action === 'add-encounter' && encounterForChronicle) {
      try {
        const model = fm.model || 'gpt-4o-mini';
        const previousContent = encounterForChronicle.previous
          ? `Title: ${encounterForChronicle.previous.title || '(untitled)'}\n${encounterForChronicle.previous.body || ''}`
          : '(no previous encounter entry)';
        const noteText = await callGitHubModels(
          buildEncounterChroniclePrompt(encounterForChronicle.chars, encounterForChronicle.title, previousContent, body),
          model,
          CHRONICLE_NOTE_MAX_TOKENS,
          CHRONICLE_SYSTEM_PROMPT,
        );
        writeChronicleEntry({
          idBase: `${encounterForChronicle.id}-encounter`,
          model,
          action: fm.action,
          field: 'encounter',
          slugA: fm.slugA,
          slugB: fm.slugB,
          title: encounterForChronicle.title,
        }, noteText);
      } catch (chronicleErr) {
        console.error('Chronicle generation failed:', chronicleErr.message);
      }
    } else if ((fm.action === 'expand-lore' || fm.action === 'coherence-check') && loreForChronicle) {
      try {
        const model = fm.model || 'gpt-4o-mini';
        const previousContent = loreForChronicle.previous
          ? `Title: ${loreForChronicle.previous.title || '(untitled)'}\n${loreForChronicle.previous.body || ''}`
          : '(no previous lore entry)';
        const noteText = await callGitHubModels(
          buildLoreChroniclePrompt(fm.action, loreForChronicle.title, previousContent, body),
          model,
          CHRONICLE_NOTE_MAX_TOKENS,
          CHRONICLE_SYSTEM_PROMPT,
        );
        writeChronicleEntry({
          idBase: `${loreForChronicle.id}-${fm.action}`,
          model,
          action: fm.action,
          field: fm.action === 'coherence-check' ? 'coherence-report' : 'lore',
          title: loreForChronicle.title,
          targetId: loreForChronicle.id,
        }, noteText);
      } catch (chronicleErr) {
        console.error('Chronicle generation failed:', chronicleErr.message);
      }
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Agent: run locally via GitHub Models ─────────────────────────────────────

app.post('/api/agent/run', async (req, res) => {
  const { action, model = 'gpt-4o-mini', target = null } = req.body;
  try {
    const chars = fs.readdirSync(CHARS_DIR).filter(f => f.endsWith('.md'))
      .map(f => readChar(path.basename(f, '.md'))).filter(Boolean)
      .sort((a, b) => (a.n ?? 99) - (b.n ?? 99));
    const gaps = computeGaps(chars);
    const encounters = readEncounters();
    const loreTitles = fs.readdirSync(LORE_DIR).filter(f => f.endsWith('.md'))
      .map(f => path.basename(f, '.md')).join(', ') || '(none yet)';

    const ts = new Date().toISOString().slice(0, 10);
    let draftId, draftFm, content;

    if (action === 'patch-fields') {
      // Phase 1: deterministically pick the highest-priority gap (no AI call — models hallucinate slugs)
      if (!gaps.length) return res.status(422).json({ error: 'No gaps to patch' });
      const top = gaps[0];
      const selection = {
        slug: top.slug,
        field: choosePatchField(top.issues),
        reason: `auto-selected: highest-priority gap (${top.issues.filter(i => !i.startsWith('broken')).join(', ')})`
      };

      // Phase 2: load full context and write
      const char = chars.find(c => c.slug === selection.slug);
      const relatedChars = (char.relations || []).map(r => chars.find(c => c.slug === r)).filter(Boolean);
      const architectureEntry = readArchitectureEntry(char.role);
      content = await callGitHubModels(buildWritingPrompt(char, selection.field, relatedChars, architectureEntry), model, 2000);

      draftId = `${char.slug}-${selection.field}-${ts}`;
      draftFm = { action, model, slug: char.slug, field: selection.field, reasoning: selection.reason };
    } else if (action === 'targeted-update') {
      if (!target?.slug) return res.status(400).json({ error: 'target.slug is required' });
      const field = normalizeTargetField(target.field);
      const char = chars.find(c => c.slug === target.slug);
      if (!char) return res.status(404).json({ error: `Character ${target.slug} not found` });

      const relatedChars = (char.relations || []).map(r => chars.find(c => c.slug === r)).filter(Boolean);
      const architectureEntry = readArchitectureEntry(char.role);
      const instructions = String(target.instructions || '').trim();
      content = await callGitHubModels(buildWritingPrompt(char, field, relatedChars, architectureEntry, instructions), model, 2000);

      draftId = `${char.slug}-${field}-${ts}`;
      draftFm = {
        action,
        model,
        slug: char.slug,
        field,
        reasoning: instructions ? `targeted update: ${instructions}` : `targeted update for ${getFieldLabel(field).toLowerCase()}`,
      };
    } else if (action === 'add-encounter') {
      const prompt = buildAgentPrompt(action, chars, gaps, encounters, loreTitles);
      const rawOutput = await callGitHubModels(prompt, model);
      const parsed = parseDraftOutput(rawOutput);
      if (!parsed) return res.status(422).json({ error: 'Agent output did not match expected format', raw: rawOutput });
      const { attrs, reasoning } = parsed;
      content = parsed.content;
      draftId = `encounter-${[attrs.slugA, attrs.slugB].sort().join('--')}-${ts}`;
      draftFm = { action, slugA: attrs.slugA, slugB: attrs.slugB, title: attrs.title, reasoning };
    } else if (action === 'expand-lore') {
      const prompt = buildAgentPrompt(action, chars, gaps, encounters, loreTitles);
      const rawOutput = await callGitHubModels(prompt, model);
      const parsed = parseDraftOutput(rawOutput);
      if (!parsed) return res.status(422).json({ error: 'Agent output did not match expected format', raw: rawOutput });
      const { attrs, reasoning } = parsed;
      content = parsed.content;
      const loreSlug = (attrs.title || 'lore').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      draftId = `lore-${loreSlug}-${ts}`;
      draftFm = { action, title: attrs.title, targetId: loreSlug, reasoning };
    } else {
      // coherence-check
      const prompt = buildAgentPrompt(action, chars, gaps, encounters, loreTitles);
      const rawOutput = await callGitHubModels(prompt, model);
      const parsed = parseDraftOutput(rawOutput);
      if (!parsed) return res.status(422).json({ error: 'Agent output did not match expected format', raw: rawOutput });
      const { attrs, reasoning } = parsed;
      content = parsed.content;
      draftId = `coherence-${ts}`;
      draftFm = { action: 'coherence-check', title: attrs.title || 'Coherence Report', targetId: `coherence-report-${ts}`, reasoning };
    }

    let front = '---\n';
    for (const [k, v] of Object.entries(draftFm)) front += `${k}: ${yamlStr(v)}\n`;
    front += '---\n';
    fs.writeFileSync(path.join(DRAFTS_DIR, `${draftId}.md`), front + '\n' + content, 'utf8');
    res.json({ ok: true, draftId, reasoning: draftFm.reasoning, content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Agent: dispatch to GitHub Actions ────────────────────────────────────────

app.get('/api/repo', (req, res) => {
  const r = getGitHubRepo();
  res.json(r || { error: 'No GitHub remote configured' });
});

app.post('/api/agent/dispatch', (req, res) => {
  const { action, model = 'gpt-4o-mini' } = req.body;
  const ghRepo = getGitHubRepo();
  if (!ghRepo) return res.status(400).json({ error: 'No GitHub remote. Push the repo to GitHub first.' });
  try {
    execSync(
      `gh workflow run agent-run.yml --repo ${ghRepo.full} --field action=${action} --field model=${model}`,
      { cwd: UC_ROOT, encoding: 'utf8' }
    );
    // Wait briefly for the run to register, then fetch its ID
    const runs = JSON.parse(execSync(
      `gh run list --repo ${ghRepo.full} --workflow agent-run.yml --limit 1 --json databaseId,status,createdAt`,
      { cwd: UC_ROOT, encoding: 'utf8' }
    ));
    res.json({ ok: true, runId: runs[0]?.databaseId, status: runs[0]?.status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/agent/status/:runId', (req, res) => {
  const ghRepo = getGitHubRepo();
  if (!ghRepo) return res.status(400).json({ error: 'No GitHub remote' });
  try {
    const run = JSON.parse(execSync(
      `gh run view ${req.params.runId} --repo ${ghRepo.full} --json status,conclusion,updatedAt`,
      { encoding: 'utf8' }
    ));
    res.json(run);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/pull', (req, res) => {
  try {
    execSync('git pull --rebase', { cwd: UC_ROOT, encoding: 'utf8' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3099, () => console.log('UC Studio API → http://localhost:3099'));
