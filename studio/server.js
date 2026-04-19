// UC Studio – local API server (port 3099)
// Reads/writes markdown source files in ../src/data/

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { computeGaps, computeContentRatings, buildAgentPrompt, parseDraftOutput, buildWritingPrompt } from './scripts/agent-core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '../src/data');
const CHARS_DIR = path.join(DATA, 'characters');
const BIOS_DIR = path.join(DATA, 'bios');
const ENCOUNTERS_DIR = path.join(DATA, 'encounters');
const LORE_DIR = path.join(DATA, 'lore');
const DRAFTS_DIR = path.join(DATA, 'drafts');
const UC_ROOT = path.join(__dirname, '..');

[ENCOUNTERS_DIR, LORE_DIR, DRAFTS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

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

function readEncounters() {
  if (!fs.existsSync(ENCOUNTERS_DIR)) return [];
  return fs.readdirSync(ENCOUNTERS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const id = path.basename(f, '.md');
      const raw = fs.readFileSync(path.join(ENCOUNTERS_DIR, f), 'utf8');
      const { fm, body } = parseFrontmatter(raw);
      const [a, b] = id.split('--');
      return { id, slugA: a, slugB: b, ...fm, body: body.trim() };
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

// ─── Routes ───────────────────────────────────────────────────────────────────

// List all characters (index)
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

async function callGitHubModels(prompt, model = 'gpt-4o-mini', maxTokens = 2000) {
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
  const r = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      model, max_tokens: maxTokens,
      messages: [
        { role: 'system', content: 'You write like a journalist covering strange municipal history — dry, specific, observational. Short sentences. Physical details. No fantasy language, no superlatives, no self-help tone. You are documenting real-seeming people, not mythological figures. Follow all formatting instructions exactly. Output only what is asked — no preamble or commentary outside the specified tags.' },
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

app.post('/api/drafts/:id/approve', (req, res) => {
  const file = path.join(DRAFTS_DIR, `${req.params.id}.md`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Draft not found' });
  const raw = fs.readFileSync(file, 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  try {
    if (fm.action === 'patch-fields' && fm.slug) {
      const char = readChar(fm.slug);
      if (!char) return res.status(404).json({ error: `Character ${fm.slug} not found` });
      if (fm.field === 'talisman-shadow') {
        const sections = parseSections(body);
        writeChar(fm.slug, { ...char, talisman: sections.talisman || char.talisman, shadow: sections.shadow || char.shadow });
      } else {
        writeChar(fm.slug, { ...char, bio: body });
      }
    } else if (fm.action === 'add-encounter' && fm.slugA && fm.slugB) {
      const id = [fm.slugA, fm.slugB].sort().join('--');
      fs.writeFileSync(path.join(ENCOUNTERS_DIR, `${id}.md`), `---\ntitle: ${yamlStr(fm.title || id)}\n---\n\n${body}`, 'utf8');
    } else if (fm.action === 'expand-lore' || fm.action === 'coherence-check') {
      const loreId = fm.targetId || req.params.id;
      fs.writeFileSync(path.join(LORE_DIR, `${loreId}.md`), `---\ntitle: ${yamlStr(fm.title || loreId)}\n---\n\n${body}`, 'utf8');
    }
    fs.unlinkSync(file);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Agent: run locally via GitHub Models ─────────────────────────────────────

app.post('/api/agent/run', async (req, res) => {
  const { action, model = 'gpt-4o-mini' } = req.body;
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
        field: top.issues.includes('talisman') || top.issues.includes('shadow') ? 'talisman-shadow' : 'bio',
        reason: `auto-selected: highest-priority gap (${top.issues.filter(i => !i.startsWith('broken')).join(', ')})`
      };

      // Phase 2: load full context and write
      const char = chars.find(c => c.slug === selection.slug);
      const relatedChars = (char.relations || []).map(r => chars.find(c => c.slug === r)).filter(Boolean);
      // Load the full Opus architecture entry for this character
      let architectureEntry = null;
      try {
        const archPath = path.join(LORE_DIR, 'arcana-architecture.md');
        if (fs.existsSync(archPath)) {
          const archDoc = fs.readFileSync(archPath, 'utf8');
          const match = archDoc.match(new RegExp(`## \\d+\.\\s+${char.role.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}[\\s\\S]*?(?=\n---\n## |$)`));
          if (match) architectureEntry = match[0].trim();
        }
      } catch { /* ignore — falls back to ARCANA_NOTES */ }
      content = await callGitHubModels(buildWritingPrompt(char, selection.field, relatedChars, architectureEntry), model, 2000);

      draftId = `${char.slug}-${selection.field}-${ts}`;
      draftFm = { action, slug: char.slug, field: selection.field, reasoning: selection.reason };
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
