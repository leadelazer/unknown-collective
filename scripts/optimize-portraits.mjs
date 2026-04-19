import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { CHARACTERS } from '../src/data/characters.js';

const ROOT = process.cwd();
const widths = [480, 960];

const settings = {
  avif: { quality: 52, effort: 5 },
  webp: { quality: 84, effort: 5 },
};

function getBaseName(imgPath) {
  const file = path.basename(String(imgPath || ''));
  const ext = path.extname(file);
  return ext ? file.slice(0, -ext.length) : null;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function optimizeOne(slug) {
  const sourcePath = path.join(ROOT, 'public', 'assets', 'echos', `${slug}.png`);
  const outputDir = path.join(ROOT, 'public', 'assets', 'echos', 'optimized');

  try {
    await fs.access(sourcePath);
  } catch {
    return { slug, skipped: true, reason: 'missing source' };
  }

  await ensureDir(outputDir);

  const image = sharp(sourcePath, { failOn: 'none' });
  const metadata = await image.metadata();
  const sourceWidth = metadata.width || 0;

  if (!sourceWidth) {
    return { slug, skipped: true, reason: 'invalid image' };
  }

  let generated = 0;

  for (const width of widths) {
    const targetWidth = Math.min(width, sourceWidth);

    const avifOut = path.join(outputDir, `${slug}-${targetWidth}.avif`);
    await sharp(sourcePath)
      .resize({ width: targetWidth, fit: 'inside', withoutEnlargement: true })
      .avif(settings.avif)
      .toFile(avifOut);
    generated += 1;

    const webpOut = path.join(outputDir, `${slug}-${targetWidth}.webp`);
    await sharp(sourcePath)
      .resize({ width: targetWidth, fit: 'inside', withoutEnlargement: true })
      .webp(settings.webp)
      .toFile(webpOut);
    generated += 1;
  }

  return { slug, generated };
}

async function main() {
  const slugs = Array.from(new Set(
    CHARACTERS
      .map(c => getBaseName(c.img))
      .filter(Boolean)
  ));

  const results = [];
  for (const slug of slugs) {
    // Keep this sequential so memory stays stable with large source PNGs.
    results.push(await optimizeOne(slug));
  }

  const generated = results.reduce((sum, r) => sum + (r.generated || 0), 0);
  const skipped = results.filter(r => r.skipped);

  console.log(`Optimized portraits: ${generated} files generated for ${slugs.length} characters.`);
  if (skipped.length > 0) {
    console.log('Skipped:');
    for (const r of skipped) {
      console.log(`- ${r.slug}: ${r.reason}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
