#!/usr/bin/env node
// Runs in GitHub Actions. Zero npm deps — uses Node built-ins + fetch (Node 18+).
// GITHUB_TOKEN is auto-set by Actions. AGENT_ACTION and AGENT_MODEL are workflow inputs.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeGaps, buildAgentPrompt, buildWritingPrompt, parseDraftOutput } from './agent-core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '../../src/data');
const CHARS_DIR = path.join(DATA, 'characters');
const BIOS_DIR = path.join(DATA, 'bios');
const ENCOUNTERS_DIR = path.join(DATA, 'encounters');
const LORE_DIR = path.join(DATA, 'lore');
const DRAFTS_DIR = path.join(DATA, 'drafts');

[ENCOUNTERS_DIR, LORE_DIR, DRAFTS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ─── File helpers ─────────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([\w-]+)\s*:\s*(.*)/);
    if (!m) continue;
    const [, key, val] = m;
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim();
      fm[key] = inner ? inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')) : [];
    } else if (val === 'null' || val === '') fm[key] = null;
    else if (val === 'true') fm[key] = true;
    else if (val === 'false') fm[key] = false;
    else if (/^\d+$/.test(val)) fm[key] = parseInt(val, 10);
    else fm[key] = val.replace(/^["']|["']$/g, '');
  }
  return { fm, body: match[2].trim() };
}

function parseSections(body) {
  const sections = {};
  for (const part of body.split(/^## /m).filter(Boolean)) {
    const nl = part.indexOf('\n');
    sections[part.slice(0, nl).trim().toLowerCase()] = part.slice(nl + 1).trim();
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

function readEncounters() {
  if (!fs.existsSync(ENCOUNTERS_DIR)) return [];
  return fs.readdirSync(ENCOUNTERS_DIR).filter(f => f.endsWith('.md')).map(f => {
    const id = path.basename(f, '.md');
    const { fm } = parseFrontmatter(fs.readFileSync(path.join(ENCOUNTERS_DIR, f), 'utf8'));
    const [slugA, slugB] = id.split('--');
    return { id, slugA, slugB, ...fm };
  });
}

function yamlStr(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const needs = /[:#"'\n\[\]{}]/.test(v) || v === '' || v === 'null' || v === 'true' || v === 'false';
  return needs ? JSON.stringify(v) : v;
}

// ─── GitHub Models API ────────────────────────────────────────────────────────

async function callGitHubModels(prompt, model) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');

  const r = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: 'You are a literary content writer working on a fictional world. Follow all formatting instructions exactly. Output only what is asked — no preamble or commentary outside the specified tags.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || `GitHub Models error ${r.status}`);
  return d.choices[0]?.message?.content || '';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const action = process.env.AGENT_ACTION;
  const model = process.env.AGENT_MODEL || 'gpt-4o-mini';

  if (!action) throw new Error('AGENT_ACTION env var required');
  console.log(`Running agent: action=${action} model=${model}`);

  const chars = fs.readdirSync(CHARS_DIR).filter(f => f.endsWith('.md'))
    .map(f => readChar(path.basename(f, '.md'))).filter(Boolean)
    .sort((a, b) => (a.n ?? 99) - (b.n ?? 99));

  const gaps = computeGaps(chars);
  const encounters = readEncounters();
  const loreTitles = fs.existsSync(LORE_DIR)
    ? fs.readdirSync(LORE_DIR).filter(f => f.endsWith('.md')).map(f => path.basename(f, '.md')).join(', ') || '(none yet)'
    : '(none yet)';

  console.log(`Loaded ${chars.length} characters, ${gaps.length} gaps, ${encounters.length} encounters`);

  const ts = new Date().toISOString().slice(0, 10);
  let draftId, draftFm;
  let content;

  if (action === 'patch-fields') {
    if (!gaps.length) throw new Error('No weak or missing character content found to patch');
    const top = gaps[0];
    const char = chars.find(c => c.slug === top.slug);
    const field = top.issues.some(issue => issue.startsWith('talisman') || issue.startsWith('shadow')) ? 'talisman-shadow' : 'bio';
    const relatedChars = (char.relations || []).map(r => chars.find(c => c.slug === r)).filter(Boolean);

    console.log(`Auto-selected patch target: ${char.slug} (${field})`);
    console.log('Calling GitHub Models...');
    content = await callGitHubModels(buildWritingPrompt(char, field, relatedChars), model);

    draftId = `${char.slug}-${field}-${ts}`;
    draftFm = {
      action,
      slug: char.slug,
      field,
      reasoning: `auto-selected: highest-priority weak content (${top.issues.join(', ')})`,
    };
  } else if (action === 'add-encounter') {
    const prompt = buildAgentPrompt(action, chars, gaps, encounters, loreTitles);
    console.log('Calling GitHub Models...');
    const rawOutput = await callGitHubModels(prompt, model);
    const parsed = parseDraftOutput(rawOutput);
    if (!parsed) {
      console.error('Agent output did not match expected format:\n', rawOutput);
      process.exit(1);
    }
    const { attrs, reasoning } = parsed;
    content = parsed.content;
    console.log(`Agent chose: ${JSON.stringify(attrs)}`);
    console.log(`Reasoning: ${reasoning}`);
    draftId = `encounter-${[attrs.slugA, attrs.slugB].sort().join('--')}-${ts}`;
    draftFm = { action, slugA: attrs.slugA, slugB: attrs.slugB, title: attrs.title, reasoning };
  } else if (action === 'expand-lore') {
    const prompt = buildAgentPrompt(action, chars, gaps, encounters, loreTitles);
    console.log('Calling GitHub Models...');
    const rawOutput = await callGitHubModels(prompt, model);
    const parsed = parseDraftOutput(rawOutput);
    if (!parsed) {
      console.error('Agent output did not match expected format:\n', rawOutput);
      process.exit(1);
    }
    const { attrs, reasoning } = parsed;
    content = parsed.content;
    console.log(`Agent chose: ${JSON.stringify(attrs)}`);
    console.log(`Reasoning: ${reasoning}`);
    const loreSlug = (attrs.title || 'lore').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    draftId = `lore-${loreSlug}-${ts}`;
    draftFm = { action, title: attrs.title, targetId: loreSlug, reasoning };
  } else {
    const prompt = buildAgentPrompt(action, chars, gaps, encounters, loreTitles);
    console.log('Calling GitHub Models...');
    const rawOutput = await callGitHubModels(prompt, model);
    const parsed = parseDraftOutput(rawOutput);
    if (!parsed) {
      console.error('Agent output did not match expected format:\n', rawOutput);
      process.exit(1);
    }
    const { attrs, reasoning } = parsed;
    content = parsed.content;
    console.log(`Agent chose: ${JSON.stringify(attrs)}`);
    console.log(`Reasoning: ${reasoning}`);
    draftId = `coherence-${ts}`;
    draftFm = { action: 'coherence-check', title: attrs.title || 'Coherence Report', targetId: `coherence-report-${ts}`, reasoning };
  }

  let front = '---\n';
  for (const [k, v] of Object.entries(draftFm)) front += `${k}: ${yamlStr(v)}\n`;
  front += '---\n';

  const draftFile = path.join(DRAFTS_DIR, `${draftId}.md`);
  fs.writeFileSync(draftFile, front + '\n' + content, 'utf8');
  console.log(`Draft saved: ${draftFile}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
