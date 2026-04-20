#!/usr/bin/env node
// Sync encounters from markdown files to encounters.js
// Run: node src/data/sync-encounters.js  (from unknown-collective/)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const encountersDir = path.join(__dirname, 'encounters');
const charsDir = path.join(__dirname, 'characters');
const outputFile = path.join(__dirname, 'encounters.js');

// ─── Collect valid slugs from character frontmatter ───────────────────────────

function getValidSlugs() {
  const slugs = new Set();
  if (!fs.existsSync(charsDir)) return slugs;
  for (const f of fs.readdirSync(charsDir).filter(f => f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(charsDir, f), 'utf-8');
    const match = content.match(/^slug:\s*(\S+)/m);
    if (match) slugs.add(match[1].trim());
  }
  return slugs;
}

// ─── Parse participant slugs from filename segment ────────────────────────────
// Handles simple slugs ("curator") and compound names ("curator-oracle")
// by greedily matching known slugs left-to-right

function findSlugsInSegment(segment, validSlugs) {
  if (validSlugs.has(segment)) return [segment];
  const parts = segment.split('-');
  const found = [];
  let i = 0;
  while (i < parts.length) {
    let matched = false;
    for (let len = parts.length - i; len > 0; len--) {
      const candidate = parts.slice(i, i + len).join('-');
      if (validSlugs.has(candidate)) {
        found.push(candidate);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) i++;
  }
  return found;
}

function parseParticipants(basename, validSlugs) {
  const segments = basename.split('--');
  const all = segments.flatMap(seg => findSlugsInSegment(seg, validSlugs));
  return [...new Set(all)]; // deduplicate preserving order
}

// ─── Parse frontmatter + body ─────────────────────────────────────────────────

function parseMd(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { title: null, image: null, body: raw.trim() };
  const fm = match[1];
  const titleMatch = fm.match(/^title:\s*(.+)$/m);
  const imageMatch = fm.match(/^image:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, '') : null;
  const image = imageMatch ? imageMatch[1].trim().replace(/^["']|["']$/g, '') : null;
  return { title, image, body: match[2].trim() };
}

// ─── Build encounters array ───────────────────────────────────────────────────

const validSlugs = getValidSlugs();
const encounters = [];

if (fs.existsSync(encountersDir)) {
  const files = fs.readdirSync(encountersDir).filter(f => f.endsWith('.md')).sort();
  for (const file of files) {
    const basename = path.basename(file, '.md');
    const raw = fs.readFileSync(path.join(encountersDir, file), 'utf-8');
    const { title, image, body } = parseMd(raw);
    const participants = parseParticipants(basename, validSlugs);

    encounters.push({
      id: basename,
      title: title || basename,
      image: image || null,
      participants,
      body,
      hasContent: body.length > 0,
    });
  }
}

// ─── Write output ─────────────────────────────────────────────────────────────

const output = `// Auto-generated – run: node src/data/sync-all.js
// Do not edit directly – edit source files in src/data/encounters/<id>.md

export const ENCOUNTERS = ${JSON.stringify(encounters, null, 2)};
`;

fs.writeFileSync(outputFile, output);
console.log(`✓ Synced ${encounters.length} encounters to encounters.js`);
if (encounters.some(e => !e.hasContent)) {
  console.warn(`  ⚠  ${encounters.filter(e => !e.hasContent).length} encounter(s) have no body content`);
}
