#!/usr/bin/env node
// Reads src/data/chronicle/*.md → writes src/data/chronicle.js
// Run: node src/data/sync-chronicle.js  (from unknown-collective/)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chronicleDir = path.join(__dirname, 'chronicle');
const outputFile = path.join(__dirname, 'chronicle.js');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw.trim() };
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([\w-]+)\s*:\s*(.*)/);
    if (!m) continue;
    fm[m[1]] = m[2].trim();
  }
  return { fm, body: match[2].trim() };
}

const entries = [];

if (fs.existsSync(chronicleDir)) {
  for (const file of fs.readdirSync(chronicleDir).filter(f => f.endsWith('.md')).sort()) {
    try {
      const raw = fs.readFileSync(path.join(chronicleDir, file), 'utf8');
      const { fm, body } = parseFrontmatter(raw);
      if (!fm.id) continue;
      entries.push({
        id: fm.id,
        type: fm.type || 'agent-note',
        model: fm.model || '',
        action: fm.action || 'patch-fields',
        field: fm.field || '',
        slug: fm.slug || '',
        date: fm.date || '',
        dateStr: fm.dateStr || '',
        persona: fm.persona || fm.slug || '',
        text: body,
      });
    } catch { /* skip malformed files */ }
  }
}

// Sort by date descending (newest first)
entries.sort((a, b) => b.date.localeCompare(a.date));

const output = `// AUTO-GENERATED — do not edit
export const CHRONICLE = ${JSON.stringify(entries, null, 2)};
`;

fs.writeFileSync(outputFile, output);
console.log(`✓ Synced ${entries.length} chronicle entries → chronicle.js`);
