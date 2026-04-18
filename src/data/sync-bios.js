#!/usr/bin/env node
/**
 * Sync bios from markdown files to bios.js
 * Usage: node sync-bios.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const biosDir = path.join(__dirname, 'bios');
const outputFile = path.join(__dirname, 'bios.js');

// Read all markdown files from bios directory
const files = fs.readdirSync(biosDir).filter(f => f.endsWith('.md'));

const bios = {};

files.forEach(file => {
  const slug = path.basename(file, '.md');
  const content = fs.readFileSync(path.join(biosDir, file), 'utf-8');

  // Split by double newlines to separate paragraphs
  const paragraphs = content
    .trim()
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0);

  // If single paragraph, store as string; multiple paragraphs as array
  bios[slug] = paragraphs.length === 1 ? paragraphs[0] : paragraphs;
});

// Generate bios.js
const output = `// Auto-generated from markdown files in ./bios/
// Do not edit directly – run: node src/data/sync-bios.js

export const bios = ${JSON.stringify(bios, null, 2)};
`;

fs.writeFileSync(outputFile, output);
console.log(`✓ Synced ${files.length} bios to bios.js`);
