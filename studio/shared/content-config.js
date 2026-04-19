export const AGENT_ACTIONS = [
  { id: 'patch-fields', label: 'Patch Weak Content', description: 'Agent picks the highest-priority weak content and rewrites it. You review before anything is applied.' },
  { id: 'add-encounter', label: 'Add Encounter', description: 'Agent picks two related characters with no encounter yet and writes their shared narrative.' },
  { id: 'coherence-check', label: 'Coherence Check', description: 'Audits all characters for broken relations, keyword misalignment, and tier logic. Writes a report.' },
  { id: 'expand-lore', label: 'Expand Lore', description: 'Agent identifies a gap in world lore - a place, ritual, or systemic element - and writes a new entry.' },
];

export const TARGETED_FIELD_OPTIONS = [
  { value: 'bio', label: 'Bio', description: 'Rewrite the biography paragraphs.' },
  { value: 'talisman', label: 'Talisman', description: 'Rewrite only the talisman section.' },
  { value: 'shadow', label: 'Shadow', description: 'Rewrite only the shadow section.' },
  { value: 'talisman-shadow', label: 'Talisman + Shadow', description: 'Rewrite both card sections together.' },
  { value: 'artifact', label: 'Artifact', description: 'Rewrite the artifact line in frontmatter.' },
  { value: 'quote', label: 'Quote', description: 'Rewrite the quote in frontmatter.' },
  { value: 'essence', label: 'Essence', description: 'Rewrite the short atmospheric essence.' },
  { value: 'relation-notes', label: 'Relationship Summaries', description: 'Write or revise the relation note block.' },
  { value: 'floriography-palette', label: 'Flower + Palette', description: 'Write flower, flower meaning, and the palette.' },
];

export const FIELD_LABELS = {
  bio: 'Bio',
  talisman: 'Talisman',
  shadow: 'Shadow',
  'talisman-shadow': 'Talisman + Shadow',
  artifact: 'Artifact',
  quote: 'Quote',
  essence: 'Essence',
  'relation-notes': 'Relationship Summaries',
  'floriography-palette': 'Flower + Palette',
};

export const CANONICAL_CHARACTER_ROSTER = [
  { n: 0, arcana: 'The Fool', role: 'The Florist', slug: 'florist', tier: 'custodians' },
  { n: 1, arcana: 'The Magician', role: 'The Curator', slug: 'curator', tier: 'luminaries' },
  { n: 2, arcana: 'The High Priestess', role: 'The Oracle', slug: 'oracle', tier: 'luminaries' },
  { n: 3, arcana: 'The Empress', role: 'The Gardener', slug: 'gardener', tier: 'grounded' },
  { n: 4, arcana: 'The Emperor', role: 'The Merchant Prince', slug: 'merchant-prince', tier: 'luminaries' },
  { n: 5, arcana: 'The Hierophant', role: 'The Duchess', slug: 'duchess', tier: 'luminaries' },
  { n: 6, arcana: 'The Lovers', role: 'The Weavers', slug: 'weavers', tier: 'grounded' },
  { n: 7, arcana: 'The Chariot', role: 'The Shieldbearer', slug: 'shieldbearer', tier: 'guardians' },
  { n: 8, arcana: 'Strength', role: 'The Firefighter', slug: 'firefighter', tier: 'guardians' },
  { n: 9, arcana: 'The Hermit', role: 'The Ferryman', slug: 'ferryman', tier: 'guardians' },
  { n: 10, arcana: 'Wheel of Fortune', role: 'The Mapmaker', slug: 'mapmaker', tier: 'custodians' },
  { n: 11, arcana: 'Justice', role: 'The Obsidian Count', slug: 'obsidian-count', tier: 'luminaries' },
  { n: 12, arcana: 'The Hanged Man', role: 'The Baker', slug: 'baker', tier: 'grounded' },
  { n: 13, arcana: 'Death', role: 'The Bind', slug: 'the-bind', tier: 'guides' },
  { n: 14, arcana: 'Temperance', role: 'The Cook', slug: 'cook', tier: 'grounded' },
  { n: 15, arcana: 'The Devil', role: 'The Mirrormaker', slug: 'mirrormaker', tier: 'custodians' },
  { n: 16, arcana: 'The Tower', role: 'The Doorwarden', slug: 'doorwarden', tier: 'guardians' },
  { n: 17, arcana: 'The Star', role: 'The Lightkeeper', slug: 'lightkeeper', tier: 'guides' },
  { n: 18, arcana: 'The Moon', role: 'The Tailor', slug: 'tailor', tier: 'grounded' },
  { n: 19, arcana: 'The Sun', role: 'The Brewer', slug: 'brewer', tier: 'grounded' },
  { n: 20, arcana: 'Judgment', role: 'The Keymaker', slug: 'keymaker', tier: 'custodians' },
  { n: 21, arcana: 'The World', role: 'The Timekeeper', slug: 'timekeeper', tier: 'guides' },
];

export function getFieldLabel(field) {
  return FIELD_LABELS[field] || field || 'Bio';
}

export function normalizeTargetField(field) {
  const value = String(field || 'bio').trim().toLowerCase();
  if (FIELD_LABELS[value]) return value;
  if (value === 'card' || value === 'card-text') return 'talisman-shadow';
  return 'bio';
}

export function choosePatchField(issues = []) {
  if (issues.includes('talisman') || issues.includes('shadow')) return 'talisman-shadow';
  if (issues.includes('bio') || issues.includes('bio-structure')) return 'bio';
  if (issues.some(issue => issue === 'flower' || issue === 'flower-meaning' || issue === 'palette')) return 'floriography-palette';
  if (issues.some(issue => issue.startsWith('relation-notes'))) return 'relation-notes';
  if (issues.includes('bio-thin')) return 'bio';
  if (issues.includes('talisman-thin') || issues.includes('shadow-thin')) return 'talisman-shadow';
  return 'bio';
}