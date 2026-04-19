export const TIER_CHROMA = {
  grounded: {
    title: 'Grounded Chroma',
    description: 'Physical processes, handled materials, grain, clay, dye, heat. The colors should feel made and touched.',
    accent: '#B48A56',
    glow: '#D8BB8D',
    deep: '#4C3928',
  },
  custodians: {
    title: 'Custodian Chroma',
    description: 'Threshold tools and coded objects: brass, paper, obsidian, unfinished gold, archive residue.',
    accent: '#C5A062',
    glow: '#E4D0A3',
    deep: '#34271A',
  },
  guardians: {
    title: 'Guardian Chroma',
    description: 'Endurance materials under pressure: steel, slate, smoke, ember, char, weathered mineral tones.',
    accent: '#6E8496',
    glow: '#A7B8C4',
    deep: '#23303A',
  },
  luminaries: {
    title: 'Luminary Chroma',
    description: 'Institutional authority and controlled knowledge: velvet, ink, ledger parchment, judicial blue, ecclesiastical saturation.',
    accent: '#86669A',
    glow: '#CBBAD8',
    deep: '#261C32',
  },
  guides: {
    title: 'Guide Chroma',
    description: 'Terminal and orienting states: dusk, lamp-glow, bruise violet, midnight, signal in darkness.',
    accent: '#A28B60',
    glow: '#DACDA8',
    deep: '#231F32',
  },
};

const PALETTE_ANCHORS = {
  parchment: '#C7A07A',
  steel: '#98A2B1',
  flour: '#D8C8AC',
  char: '#231813',
  obsidian: '#1F1414',
  moonwash: '#AAB6C9',
  stress: '#B16442',
  ember: '#E7AA74',
  honey: '#8C6D2C',
  mourning: '#736276',
};

const ARCANA_PALETTE_RULES = {
  florist: { secondary: 'glow', tertiary: 'root' },
  curator: { secondary: 'ink', tertiary: 'patina' },
  oracle: { secondary: 'veil', tertiary: 'midnight' },
  gardener: { secondary: 'root', tertiary: 'harvest' },
  'merchant-prince': { secondary: 'ledger', tertiary: 'parchment' },
  duchess: { secondary: 'soften', tertiary: 'midnight' },
  weavers: { secondary: 'wash', tertiary: 'walnut' },
  shieldbearer: { secondary: 'smoke', tertiary: 'steel-light' },
  firefighter: { secondary: 'ember-dark', tertiary: 'ember-glow' },
  ferryman: { secondary: 'midnight', tertiary: 'fog' },
  mapmaker: { secondary: 'brass-glow', tertiary: 'oxide' },
  'obsidian-count': { secondary: 'ink', tertiary: 'steel-light' },
  baker: { secondary: 'root', tertiary: 'flour' },
  'the-bind': { secondary: 'midnight', tertiary: 'mourning' },
  cook: { secondary: 'temper', tertiary: 'spice' },
  mirrormaker: { secondary: 'flush', tertiary: 'obsidian' },
  doorwarden: { secondary: 'stress', tertiary: 'char' },
  lightkeeper: { secondary: 'signal', tertiary: 'surrounding-dark' },
  tailor: { secondary: 'moonwash', tertiary: 'midnight' },
  brewer: { secondary: 'signal', tertiary: 'honey-dark' },
  keymaker: { secondary: 'brass-glow', tertiary: 'lock-shadow' },
  veilwalker: { secondary: 'dusk-lift', tertiary: 'midnight' },
};

const CHARACTER_PALETTE_NOTES = {
  florist: {
    arcanaRole: 'The arcana drives this palette: The Fool starts in unprocessed possibility, and the tier keeps that possibility material and tool-adjacent.',
    entries: [
      { label: 'Primary', meaning: 'Warm gold of unprocessed potential.' },
      { label: 'Secondary', meaning: 'Bright space before shadows have formed.' },
      { label: 'Tertiary', meaning: 'Earthy ground the archetype does not stop to study.' },
    ],
  },
  curator: {
    arcanaRole: 'The Magician arranges what already exists; the luminary register turns that power into polished gold, indigo reserve, and institutional patina.',
    entries: [
      { label: 'Primary', meaning: 'Polished intent, already worked into purpose.' },
      { label: 'Secondary', meaning: 'Concentrated archive indigo, knowledge held back until used.' },
      { label: 'Tertiary', meaning: 'Tarnish from sustained focus and repeated handling.' },
    ],
  },
  oracle: {
    arcanaRole: 'The High Priestess works at the threshold of admission; the luminary tier keeps the palette quiet, controlled, and withheld.',
    entries: [
      { label: 'Primary', meaning: 'Twilight mauve, a threshold rather than a destination.' },
      { label: 'Secondary', meaning: 'Bleached edge-of-perception lavender.' },
      { label: 'Tertiary', meaning: 'The violet depth behind the gate.' },
    ],
  },
  gardener: {
    arcanaRole: 'The Empress is generative overflow; the grounded tier translates abundance into actual soil, chlorophyll, and ripening yield.',
    entries: [
      { label: 'Primary', meaning: 'Living green, growth in active process.' },
      { label: 'Secondary', meaning: 'Compost and root depth where generation starts.' },
      { label: 'Tertiary', meaning: 'The gold of ripeness after growth has matured.' },
    ],
  },
  'merchant-prince': {
    arcanaRole: 'The Emperor imposes order; the luminary layer makes that order look expensive, recorded, and owed.',
    entries: [
      { label: 'Primary', meaning: 'Oxidized authority, like dried blood in a ledger.' },
      { label: 'Secondary', meaning: 'Accumulated obligation darkened into weight.' },
      { label: 'Tertiary', meaning: 'Parchment where the rules are written down.' },
    ],
  },
  duchess: {
    arcanaRole: 'The Hierophant transmits structure; the luminary register gives that transmission ceremonial purple, softened familiarity, and inherited depth.',
    entries: [
      { label: 'Primary', meaning: 'Institutional purple, authority carried forward.' },
      { label: 'Secondary', meaning: 'Tradition softened by repeated use.' },
      { label: 'Tertiary', meaning: 'The absorbed weight of old institutions.' },
    ],
  },
  weavers: {
    arcanaRole: 'The Lovers bind through irreversible choice; the grounded tier makes that choice tactile through thread, dye, and fixed cloth.',
    entries: [
      { label: 'Primary', meaning: 'Raw linen before the pattern locks in.' },
      { label: 'Secondary', meaning: 'Thread after commitment has been washed into it.' },
      { label: 'Tertiary', meaning: 'Walnut dye once the color can no longer be taken back.' },
    ],
  },
  shieldbearer: {
    arcanaRole: 'The Chariot is aligned force through opposition; the guardian register makes it metallic, weathered, and impact-ready.',
    entries: [
      { label: 'Primary', meaning: 'Steel blue, functional rather than ornamental.' },
      { label: 'Secondary', meaning: 'Slate weight behind the shield.' },
      { label: 'Tertiary', meaning: 'Light striking metal already in motion.' },
    ],
  },
  firefighter: {
    arcanaRole: 'Strength stays close to danger without matching it; the guardian register turns that into ember states instead of theatrical flame.',
    entries: [
      { label: 'Primary', meaning: 'Structurally active ember rather than decorative fire.' },
      { label: 'Secondary', meaning: 'The darker heat left after the blaze has passed through.' },
      { label: 'Tertiary', meaning: 'Residual warmth the next morning.' },
    ],
  },
  ferryman: {
    arcanaRole: 'The Hermit reduces interference to access direct perception; the guardian tier keeps that solitude river-bound, cold, and navigable.',
    entries: [
      { label: 'Primary', meaning: 'River slate under uncertain light.' },
      { label: 'Secondary', meaning: 'Deep ink where outside noise falls away.' },
      { label: 'Tertiary', meaning: 'Fog, reduced visibility chosen on purpose.' },
    ],
  },
  mapmaker: {
    arcanaRole: 'Wheel of Fortune tracks patterned recurrence; the custodian tier expresses that through measuring instruments and aged survey metals.',
    entries: [
      { label: 'Primary', meaning: 'Aged brass from a tool that has seen many turns.' },
      { label: 'Secondary', meaning: 'Freshly cast brass at the cycle\'s high point.' },
      { label: 'Tertiary', meaning: 'Oxidized dark at the cycle\'s low point.' },
    ],
  },
  'obsidian-count': {
    arcanaRole: 'Justice measures consequence; the luminary register hardens that measurement into stone, annotation ink, and steel.',
    entries: [
      { label: 'Primary', meaning: 'Obsidian reflection with a cutting edge.' },
      { label: 'Secondary', meaning: 'Formal legal blue, written and difficult to revoke.' },
      { label: 'Tertiary', meaning: 'Polished steel, the non-negotiable instrument of balance.' },
    ],
  },
  baker: {
    arcanaRole: 'The Hanged Man gains perspective through suspension; the grounded register makes that waiting visible in crust, crock, and flour dust.',
    entries: [
      { label: 'Primary', meaning: 'Bread transformed by heat and time.' },
      { label: 'Secondary', meaning: 'Old clay holding the slow process in place.' },
      { label: 'Tertiary', meaning: 'Suspended flour, the medium of patient work.' },
    ],
  },
  'the-bind': {
    arcanaRole: 'Death ends so something else can continue; the guide tier turns that ending into transition-state colors rather than spectacle.',
    entries: [
      { label: 'Primary', meaning: 'Bruise purple at the point of transition.' },
      { label: 'Secondary', meaning: 'Near-black finality.' },
      { label: 'Tertiary', meaning: 'Grief after the first shock has settled into form.' },
    ],
  },
  cook: {
    arcanaRole: 'Temperance calibrates unlike things in real time; the grounded register keeps that calibration in vessel, mixture, and concentrate.',
    entries: [
      { label: 'Primary', meaning: 'Warm clay, the container that holds the ratios.' },
      { label: 'Secondary', meaning: 'Ingredients beginning to integrate.' },
      { label: 'Tertiary', meaning: 'Dark spice after reduction has intensified it.' },
    ],
  },
  mirrormaker: {
    arcanaRole: 'The Devil exposes voluntary bondage; the custodian register makes the diagnosis tactile through obsidian, blush, and near-black red.',
    entries: [
      { label: 'Primary', meaning: 'Obsidian reflection warmed by threat.' },
      { label: 'Secondary', meaning: 'The flush of uncomfortable recognition.' },
      { label: 'Tertiary', meaning: 'Depth that absorbs more than it returns.' },
    ],
  },
  doorwarden: {
    arcanaRole: 'The Tower reveals structural failure; the guardian register pushes the palette into scorched, heated, and charred building matter.',
    entries: [
      { label: 'Primary', meaning: 'Scorched brick after stress has changed it.' },
      { label: 'Secondary', meaning: 'Material at the moment of critical load.' },
      { label: 'Tertiary', meaning: 'Char left after everything burnable is gone.' },
    ],
  },
  lightkeeper: {
    arcanaRole: 'The Star is orientation after loss; the guide tier turns that into lamp-light and the darkness that makes it usable.',
    entries: [
      { label: 'Primary', meaning: 'Lantern light filtered through brass and glass.' },
      { label: 'Secondary', meaning: 'Glow dispersed to the edge of its reach.' },
      { label: 'Tertiary', meaning: 'Surrounding dark that gives the signal purpose.' },
    ],
  },
  tailor: {
    arcanaRole: 'The Moon distorts edges and categories; the grounded register keeps that ambiguity in fabric, dye drift, and twilight blue.',
    entries: [
      { label: 'Primary', meaning: 'Twilight blue where the eye starts compensating badly.' },
      { label: 'Secondary', meaning: 'Moonwashed certainty drained into ambiguity.' },
      { label: 'Tertiary', meaning: 'Dark cloth when navy and black become indistinguishable.' },
    ],
  },
  brewer: {
    arcanaRole: 'The Sun is full exposure and shared energy; the grounded register gives that exposure the warmth of fermentation and public ritual.',
    entries: [
      { label: 'Primary', meaning: 'Aged amber held openly to light.' },
      { label: 'Secondary', meaning: 'Gold at maximum output, almost too direct.' },
      { label: 'Tertiary', meaning: 'Honey darkened by process rather than shadow.' },
    ],
  },
  keymaker: {
    arcanaRole: 'Judgment reviews and releases; the custodian register makes that reckoning mechanical through brass, polish, and lock shadow.',
    entries: [
      { label: 'Primary', meaning: 'Used brass carrying the record of earlier openings.' },
      { label: 'Secondary', meaning: 'New polish, the future mechanism not yet entered.' },
      { label: 'Tertiary', meaning: 'The darkness inside the lock before the turn.' },
    ],
  },
  veilwalker: {
    arcanaRole: 'The World integrates the full sequence; the guide register renders that closure in dusk, midnight, and restart-ready darkness.',
    entries: [
      { label: 'Primary', meaning: 'Twilight between one cycle and the next.' },
      { label: 'Secondary', meaning: 'Completion made visible and perceivable.' },
      { label: 'Tertiary', meaning: 'Midnight just before the cycle restarts.' },
    ],
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wrapHue(value) {
  return ((value % 360) + 360) % 360;
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map(channel => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness * 100 };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  switch (max) {
    case red:
      hue = 60 * (((green - blue) / delta) % 6);
      break;
    case green:
      hue = 60 * ((blue - red) / delta + 2);
      break;
    default:
      hue = 60 * ((red - green) / delta + 4);
      break;
  }

  return {
    h: wrapHue(hue),
    s: saturation * 100,
    l: lightness * 100,
  };
}

function hslToRgb({ h, s, l }) {
  const hue = wrapHue(h);
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment >= 0 && segment < 1) {
    red = chroma; green = x;
  } else if (segment < 2) {
    red = x; green = chroma;
  } else if (segment < 3) {
    green = chroma; blue = x;
  } else if (segment < 4) {
    green = x; blue = chroma;
  } else if (segment < 5) {
    red = x; blue = chroma;
  } else {
    red = chroma; blue = x;
  }

  return {
    r: (red + match) * 255,
    g: (green + match) * 255,
    b: (blue + match) * 255,
  };
}

function mix(hexA, hexB, amount) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const ratio = clamp(amount, 0, 1);

  return rgbToHex({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  });
}

function tune(hex, { h = 0, s = 0, l = 0 }) {
  const hsl = rgbToHsl(hexToRgb(hex));

  return rgbToHex(hslToRgb({
    h: hsl.h + h,
    s: clamp(hsl.s + s, 0, 100),
    l: clamp(hsl.l + l, 0, 100),
  }));
}

function applyPaletteMode(baseHex, tierKey, mode) {
  const tier = TIER_CHROMA[tierKey] || TIER_CHROMA.custodians;

  switch (mode) {
    case 'glow':
      return tune(mix(baseHex, tier.glow, 0.62), { s: -4, l: 4 });
    case 'root':
      return tune(mix(baseHex, tier.deep, 0.48), { s: -10, l: -10 });
    case 'ink':
      return tune(mix(baseHex, tier.deep, 0.72), { h: 10, s: -8, l: -8 });
    case 'patina':
      return tune(baseHex, { s: -18, l: -12 });
    case 'veil':
      return tune(mix(baseHex, '#D8D1DE', 0.58), { s: -10, l: 6 });
    case 'harvest':
      return tune(mix(baseHex, tier.glow, 0.4), { h: -18, s: 4, l: 0 });
    case 'ledger':
      return tune(mix(baseHex, tier.deep, 0.62), { s: -6, l: -18 });
    case 'parchment':
      return tune(mix(baseHex, PALETTE_ANCHORS.parchment, 0.72), { s: -4, l: 6 });
    case 'soften':
      return tune(mix(baseHex, tier.glow, 0.46), { s: -2, l: 2 });
    case 'wash':
      return tune(mix(baseHex, tier.glow, 0.56), { s: -10, l: 8 });
    case 'walnut':
      return tune(mix(baseHex, '#3C2418', 0.5), { s: -4, l: -14 });
    case 'smoke':
      return tune(mix(baseHex, tier.deep, 0.52), { h: 12, s: -16, l: -6 });
    case 'steel-light':
      return tune(mix(baseHex, PALETTE_ANCHORS.steel, 0.58), { s: -10, l: 4 });
    case 'ember-dark':
      return tune(mix(baseHex, tier.deep, 0.5), { h: -2, s: -4, l: -10 });
    case 'ember-glow':
      return tune(mix(baseHex, PALETTE_ANCHORS.ember, 0.6), { s: 4, l: 6 });
    case 'midnight':
      return tune(mix(baseHex, tier.deep, 0.72), { h: 8, s: -12, l: -12 });
    case 'fog':
      return tune(mix(baseHex, '#A5A9B7', 0.54), { s: -18, l: 8 });
    case 'brass-glow':
      return tune(mix(baseHex, tier.glow, 0.42), { h: -6, s: 6, l: 6 });
    case 'oxide':
      return tune(mix(baseHex, tier.deep, 0.46), { s: -12, l: -18 });
    case 'flour':
      return tune(mix(baseHex, PALETTE_ANCHORS.flour, 0.72), { s: -10, l: 10 });
    case 'mourning':
      return tune(mix(baseHex, PALETTE_ANCHORS.mourning, 0.5), { s: -10, l: -2 });
    case 'temper':
      return tune(mix(baseHex, tier.glow, 0.48), { s: -6, l: 2 });
    case 'spice':
      return tune(mix(baseHex, tier.deep, 0.42), { h: -6, s: -4, l: -12 });
    case 'flush':
      return tune(mix(baseHex, '#B07171', 0.4), { s: 2, l: 2 });
    case 'obsidian':
      return tune(mix(baseHex, PALETTE_ANCHORS.obsidian, 0.7), { s: -6, l: -16 });
    case 'stress':
      return tune(mix(baseHex, PALETTE_ANCHORS.stress, 0.52), { s: 6, l: 2 });
    case 'char':
      return tune(mix(baseHex, PALETTE_ANCHORS.char, 0.74), { s: -8, l: -12 });
    case 'signal':
      return tune(mix(baseHex, tier.glow, 0.62), { h: -4, s: 8, l: 8 });
    case 'surrounding-dark':
      return tune(mix(baseHex, tier.deep, 0.56), { s: -6, l: -14 });
    case 'moonwash':
      return tune(mix(baseHex, PALETTE_ANCHORS.moonwash, 0.6), { s: -16, l: 4 });
    case 'honey-dark':
      return tune(mix(baseHex, PALETTE_ANCHORS.honey, 0.5), { s: -4, l: -8 });
    case 'lock-shadow':
      return tune(mix(baseHex, tier.deep, 0.58), { h: -4, s: -10, l: -18 });
    case 'dusk-lift':
      return tune(mix(baseHex, tier.glow, 0.38), { h: 6, s: -12, l: 4 });
    default:
      return baseHex;
  }
}

export function getTierChroma(tierKey) {
  return TIER_CHROMA[tierKey] || TIER_CHROMA.custodians;
}

export function generatePaletteFromCharacter(character) {
  const baseHex = character.hue;
  const rules = ARCANA_PALETTE_RULES[character.slug];
  const tierKey = character.tier;

  if (!baseHex || !rules) {
    return [baseHex, baseHex, baseHex].filter(Boolean);
  }

  return [
    baseHex,
    applyPaletteMode(baseHex, tierKey, rules.secondary),
    applyPaletteMode(baseHex, tierKey, rules.tertiary),
  ];
}

export function resolveCharacterPalette(character, options = {}) {
  const { preferGenerated = false } = options;
  const manualPalette = Array.isArray(character.palette) && character.palette.length === 3
    ? character.palette
    : null;

  if (!preferGenerated && manualPalette) {
    return manualPalette;
  }

  const generated = generatePaletteFromCharacter(character);

  if (preferGenerated) {
    return generated;
  }

  return generated.length === 3 ? generated : [character.hue, character.hue, character.hue];
}

export function getCharacterPaletteMeta(character) {
  const notes = CHARACTER_PALETTE_NOTES[character.slug];
  if (!notes) return null;

  const palette = resolveCharacterPalette(character);

  return {
    tier: TIER_CHROMA[character.tier] || null,
    arcanaRole: notes.arcanaRole,
    entries: notes.entries.map((entry, index) => ({
      ...entry,
      hex: palette[index] || (index === 0 ? character.hue : null),
    })),
  };
}