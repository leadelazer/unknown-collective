#!/usr/bin/env node
// Rebuild characters.js + bios.js from source markdown files
// Run: node src/data/sync-all.js  (from unknown-collective/)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const charsDir = path.join(__dirname, 'characters');
const biosDir = path.join(__dirname, 'bios');
const charsOut = path.join(__dirname, 'characters.js');
const biosOut = path.join(__dirname, 'bios.js');

// ─── Parse frontmatter ────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter found');
  const fm = {};
  const yamlLines = match[1].split('\n');
  let i = 0;
  while (i < yamlLines.length) {
    const line = yamlLines[i];
    const keyMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
    if (!keyMatch) { i++; continue; }
    const key = keyMatch[1];
    const rawVal = keyMatch[2].trim();

    // Array value like: [a, b, c]
    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      const inner = rawVal.slice(1, -1).trim();
      fm[key] = inner ? inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')) : [];
      i++; continue;
    }
    // Empty array
    if (rawVal === '[]') { fm[key] = []; i++; continue; }
    // Block array (stories)
    if (rawVal === '') {
      const items = [];
      i++;
      while (i < yamlLines.length && yamlLines[i].startsWith('  - ')) {
        const item = {};
        const firstField = yamlLines[i].replace(/^\s+-\s+/, '').match(/^(\w+)\s*:\s*(.*)/);
        if (firstField) item[firstField[1]] = parseScalar(firstField[2].trim());
        i++;
        while (i < yamlLines.length && yamlLines[i].startsWith('    ')) {
          const subMatch = yamlLines[i].trim().match(/^(\w+)\s*:\s*(.*)/);
          if (subMatch) item[subMatch[1]] = parseScalar(subMatch[2].trim());
          i++;
        }
        items.push(item);
      }
      fm[key] = items;
      continue;
    }
    fm[key] = parseScalar(rawVal);
    i++;
  }
  return { fm, body: match[2] };
}

function parseScalar(v) {
  if (v === 'null' || v === '') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return JSON.parse(v.startsWith('"') ? v : `"${v.slice(1, -1)}"`);
  }
  return v;
}

// ─── Parse talisman/shadow from body ─────────────────────────────────────────

function parseBodySections(body) {
  const sections = {};
  const parts = body.split(/^## /m).filter(Boolean);
  for (const part of parts) {
    const nlIdx = part.indexOf('\n');
    const heading = part.slice(0, nlIdx).trim().toLowerCase();
    const content = part.slice(nlIdx + 1).trim();
    sections[heading] = content;
  }
  return sections;
}

// ─── Sync bios ───────────────────────────────────────────────────────────────

const bios = {};
if (fs.existsSync(biosDir)) {
  for (const file of fs.readdirSync(biosDir).filter(f => f.endsWith('.md')).sort()) {
    const slug = path.basename(file, '.md');
    const content = fs.readFileSync(path.join(biosDir, file), 'utf-8');
    const paragraphs = content.trim().split(/\n\n+/).filter(p => p.trim());
    bios[slug] = paragraphs.length === 1 ? paragraphs[0] : paragraphs;
  }
}

// ─── Sync characters ─────────────────────────────────────────────────────────

const characters = [];
const charFiles = fs.readdirSync(charsDir).filter(f => f.endsWith('.md')).sort();

for (const file of charFiles) {
  const raw = fs.readFileSync(path.join(charsDir, file), 'utf-8');
  const { fm, body } = parseFrontmatter(raw);
  const sections = parseBodySections(body);
  const slug = fm.slug;

  const char = {
    n: fm.n,
    arcana: fm.arcana,
    role: fm.role,
  };
  if (fm.name) char.name = fm.name;
  char.tier = fm.tier;
  char.slug = slug;
  char.img = `/assets/echos/${slug}.png`;
  char.hue = fm.hue;
  char.keywords = fm.keywords || [];
  char.essence = fm.essence;
  if (fm.detail) {
    char.detail = true;
    char.bio = bios[slug] || [];
    if (sections.talisman) char.talisman = sections.talisman;
    if (sections.shadow) char.shadow = sections.shadow;
    if (fm.relations && fm.relations.length > 0) char.relations = fm.relations;
    if (fm.artifact) char.artifact = fm.artifact;
    if (fm.quote) char.quote = fm.quote;
    if (fm.stories && fm.stories.length > 0) {
      char.stories = fm.stories;
      if (fm.storyLabel) char.storyLabel = fm.storyLabel;
    }
  }

  characters.push(char);
}

// Sort by n
characters.sort((a, b) => a.n - b.n);

// ─── Write outputs ────────────────────────────────────────────────────────────

const biosOutput = `// Auto-generated – run: node src/data/sync-all.js
// Do not edit directly

export const bios = ${JSON.stringify(bios, null, 2)};
`;
fs.writeFileSync(biosOut, biosOutput);

const charsOutput = `// Auto-generated – run: node src/data/sync-all.js
// Edit source files in src/data/characters/<slug>.md and src/data/bios/<slug>.md

import { bios } from './bios.js';

export const CHARACTERS = ${JSON.stringify(characters, null, 2)
  .replace(/"bio": \[\]/g, '"bio": []')
  // Replace bio arrays with bios reference
  .replace(/"bio": (\[[\s\S]*?\])(,?)\n/g, (_, _arr, comma, offset, str) => {
    // find which slug this is
    return `"bio": [],${comma}\n`; // fallback, we patch below
  })
};
`;

// Patch: replace "bio": [...actual array...] with bios.slug reference
// We need to do this properly by serializing with bios references
const charsArr = characters.map(c => {
  const copy = { ...c };
  if (copy.bio !== undefined) copy.__biosRef = c.slug;
  return copy;
});

// Manual serialization to inject bios references
function serializeChar(c) {
  const parts = [];
  const keys = Object.keys(c).filter(k => k !== '__biosRef');
  for (const k of keys) {
    if (k === 'bio') {
      parts.push(`    bio: bios[${JSON.stringify(c.slug)}]`);
    } else {
      parts.push(`    ${k}: ${JSON.stringify(c[k], null, 6).replace(/\n/g, '\n    ')}`);
    }
  }
  return `  {\n${parts.join(',\n')},\n  }`;
}

const finalCharsOutput = `// Auto-generated – run: node src/data/sync-all.js
// Edit source files in src/data/characters/<slug>.md and src/data/bios/<slug>.md

import { bios } from './bios.js';

export const CHARACTERS = [
${characters.map(serializeChar).join(',\n')}
];
`;

fs.writeFileSync(charsOut, finalCharsOutput);

console.log(`✓ Synced ${charFiles.length} characters → characters.js`);
console.log(`✓ Synced ${Object.keys(bios).length} bios → bios.js`);

// ─── Sync chronicle ────────────────────────────────────────────────────────────

const chronicleDir = path.join(__dirname, 'chronicle');
if (fs.existsSync(chronicleDir)) {
  try {
    execSync('node src/data/sync-chronicle.js', { cwd: path.join(__dirname, '../..'), encoding: 'utf8' });
    console.log('✓ Synced chronicle entries → chronicle.js');
  } catch (e) {
    console.error('Warning: chronicle sync failed:', e.message);
  }
}
