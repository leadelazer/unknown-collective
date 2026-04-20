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

async function isUpToDate(sourcePath, outputDir, slug) {
  try {
    const srcStat = await fs.stat(sourcePath);
    const outputs = widths.flatMap(w => [
      path.join(outputDir, `${slug}-${w}.avif`),
      path.join(outputDir, `${slug}-${w}.webp`),
    ]);
    const stats = await Promise.all(outputs.map(p => fs.stat(p)));
    return stats.every(s => s.mtimeMs >= srcStat.mtimeMs);
  } catch {
    return false;
  }
}

async function optimizeOne(slug) {
  const sourcePath = path.join(ROOT, 'public', 'assets', 'echos', `${slug}.png`);
  const outputDir = path.join(ROOT, 'public', 'assets', 'echos', 'optimized');

  try {
    await fs.access(sourcePath);
  } catch {
    return { slug, skipped: true, reason: 'missing source' };
  }

  if (await isUpToDate(sourcePath, outputDir, slug)) {
    return { slug, skipped: true, reason: 'up to date' };
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
  const upToDate = results.filter(r => r.skipped && r.reason === 'up to date');
  const missing = results.filter(r => r.skipped && r.reason !== 'up to date');

  if (generated > 0) {
    console.log(`Optimized portraits: ${generated} files generated for ${slugs.length - upToDate.length - missing.length} characters.`);
  } else {
    console.log(`Optimized portraits: all ${upToDate.length} characters already up to date.`);
  }
  if (missing.length > 0) {
    console.log('Skipped (missing source):');
    for (const r of missing) {
      console.log(`  - ${r.slug}: ${r.reason}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
