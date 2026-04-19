import { CANONICAL_CHARACTER_ROSTER } from '../shared/content-config.js';

function finding(severity, code, slug, message) {
  return { severity, code, slug, message };
}

export function evaluateCanonicalRoster(chars) {
  const items = [];
  const bySlug = new Map(chars.map(char => [char.slug, char]));

  for (const expected of CANONICAL_CHARACTER_ROSTER) {
    const actual = bySlug.get(expected.slug);
    if (!actual) {
      items.push(finding('critical', 'missing-slug', expected.slug, `Missing canonical character slug ${expected.slug} (${expected.role}).`));
      continue;
    }

    if (Number(actual.n) !== expected.n) {
      items.push(finding('critical', 'number-mismatch', expected.slug, `${expected.slug} should be arcana ${expected.n}, found ${actual.n}.`));
    }
    if (actual.role !== expected.role) {
      items.push(finding('critical', 'role-mismatch', expected.slug, `${expected.slug} should be ${expected.role}, found ${actual.role}.`));
    }
    if (actual.arcana !== expected.arcana) {
      items.push(finding('critical', 'arcana-mismatch', expected.slug, `${expected.slug} should map to ${expected.arcana}, found ${actual.arcana}.`));
    }
    if (actual.tier !== expected.tier) {
      items.push(finding('warning', 'tier-mismatch', expected.slug, `${expected.slug} should be tier ${expected.tier}, found ${actual.tier}.`));
    }
  }

  for (const char of chars) {
    if (!CANONICAL_CHARACTER_ROSTER.find(expected => expected.slug === char.slug)) {
      items.push(finding('warning', 'unexpected-slug', char.slug, `Unexpected character slug ${char.slug} is present in source data.`));
    }
  }

  const summary = {
    critical: items.filter(item => item.severity === 'critical').length,
    warning: items.filter(item => item.severity === 'warning').length,
    total: items.length,
  };

  return { ok: summary.critical === 0, summary, items };
}