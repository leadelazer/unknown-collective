// One-time script: extract inline character fields → src/data/characters/<slug>.md
// Run: node src/data/extract-characters.mjs (from unknown-collective/)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CHARACTERS } from './characters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'characters');
fs.mkdirSync(outDir, { recursive: true });

function yamlVal(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    const needsQuote = v.includes(':') || v.includes('"') || v.includes("'") || v.includes('\n') || v.startsWith('#');
    if (needsQuote) return JSON.stringify(v);
    return v;
  }
  return JSON.stringify(v);
}

function buildFrontmatter(c) {
  const lines = ['---'];
  lines.push(`n: ${c.n}`);
  lines.push(`arcana: ${yamlVal(c.arcana)}`);
  lines.push(`role: ${yamlVal(c.role)}`);
  lines.push(`name: ${yamlVal(c.name || null)}`);
  lines.push(`tier: ${c.tier}`);
  lines.push(`slug: ${c.slug}`);
  lines.push(`hue: ${yamlVal(c.hue)}`);
  lines.push(`keywords: [${(c.keywords || []).map(k => yamlVal(k)).join(', ')}]`);
  lines.push(`essence: ${yamlVal(c.essence || null)}`);
  lines.push(`detail: ${c.detail === true ? 'true' : 'false'}`);
  lines.push(`artifact: ${yamlVal(c.artifact || null)}`);
  lines.push(`quote: ${yamlVal(c.quote || null)}`);
  const rels = (c.relations || []).join(', ');
  lines.push(`relations: [${rels}]`);
  if (c.stories && c.stories.length > 0) {
    lines.push('stories:');
    for (const s of c.stories) {
      lines.push(`  - src: ${yamlVal(s.src)}`);
      lines.push(`    title: ${yamlVal(s.title)}`);
      lines.push(`    caption: ${yamlVal(s.caption)}`);
    }
  } else {
    lines.push('stories: []');
  }
  lines.push(`storyLabel: ${yamlVal(c.storyLabel || null)}`);
  lines.push('---');
  return lines.join('\n');
}

let count = 0;
for (const c of CHARACTERS) {
  let content = buildFrontmatter(c) + '\n';
  if (c.talisman) content += `\n## Talisman\n\n${c.talisman}\n`;
  if (c.shadow) content += `\n## Shadow\n\n${c.shadow}\n`;
  const filePath = path.join(outDir, `${c.slug}.md`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ ${c.slug}.md`);
  count++;
}
console.log(`\nExtracted ${count} characters to src/data/characters/`);
