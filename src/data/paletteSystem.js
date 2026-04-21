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
    arcanaRole: "An untested variable. Her spectrum reflects potential before it hits the ground — raw gold, zero sharp shadows, no structural friction.",
    entries: [
      { label: 'Primary', meaning: "Base gold, unprocessed and open." },
      { label: 'Secondary', meaning: "High albedo, unshadowed brightness." },
      { label: 'Tertiary', meaning: "Terrestrial baseline, heavy ignored earth." },
    ],
  },
  curator: {
    arcanaRole: "He works with existing assets. His spectrum is exact and deliberate — structural gold, reserve indigo, and the inevitable patina of long-term handling.",
    entries: [
      { label: 'Primary', meaning: "Calibrated gold deployed with intent." },
      { label: 'Secondary', meaning: "Archival indigo, withheld information." },
      { label: 'Tertiary', meaning: "Procedural tarnish from historical operations." },
    ],
  },
  oracle: {
    arcanaRole: "A closed-loop system. She only reflects what is presented to her. The spectrum refuses to resolve, functioning purely as a threshold.",
    entries: [
      { label: 'Primary', meaning: "Threshold mauve, never a conclusion." },
      { label: 'Secondary', meaning: "Dissipated lavender, perimeter signal decay." },
      { label: 'Tertiary', meaning: "Sub-surface density behind the gate." },
    ],
  },
  gardener: {
    arcanaRole: "Biological output over aesthetics. Her spectrum is the unromantic machinery of agriculture — active synthesis, origin soil, and terminal yield.",
    entries: [
      { label: 'Primary', meaning: "Active chlorophyll, functional growth." },
      { label: 'Secondary', meaning: "Subterranean dark, unlit origin." },
      { label: 'Tertiary', meaning: "Yield gold, terminal ripeness." },
    ],
  },
  'merchant-prince': {
    arcanaRole: "Authority converted to permanent debt. His spectrum is essentially a financial ledger — desiccated, expensive, and unalterable.",
    entries: [
      { label: 'Primary', meaning: "Oxidized iron, dried contract ink." },
      { label: 'Secondary', meaning: "Accumulated mass of leveraged power." },
      { label: 'Tertiary', require: true, meaning: "Vellum, substrate of obligation." },
    ],
  },
  duchess: {
    arcanaRole: "Hardware inheritance. She operates on legacy code. Her spectrum relies on institutional frequency and an absolute, unquestioned underlying mass.",
    entries: [
      { label: 'Primary', meaning: "Ceremonial wavelength, strictly functional purple." },
      { label: 'Secondary', meaning: "Degraded frequency, practically invisible." },
      { label: 'Tertiary', meaning: "Sub-basement gravity, unspoken centuries' weight." },
    ],
  },
  weavers: {
    arcanaRole: "The vector is officially locked. Their spectrum wastes zero bandwidth on alternatives — uncommitted fiber, post-decision saturation, and an absolute terminal stain.",
    entries: [
      { label: 'Primary', meaning: "Unprocessed filament, reversible choice." },
      { label: 'Secondary', meaning: "Saturated fiber, locked decision." },
      { label: 'Tertiary', meaning: "Terminal stain, point of no return." },
    ],
  },
  shieldbearer: {
    arcanaRole: "A structural countermeasure. Her spectrum is heavy industry — functional alloy, kinetic dampening, and the friction of operation.",
    entries: [
      { label: 'Primary', meaning: "Industrial alloy optimized for stress." },
      { label: 'Secondary', meaning: "Kinetic dampener absorbing impact." },
      { label: 'Tertiary', meaning: "Surface reflection on moving armor." },
    ],
  },
  firefighter: {
    arcanaRole: "Thermal containment. His spectrum tracks structural heat, not flash — residual energy, post-combustion void, and the slow thermal half-life of trauma.",
    entries: [
      { label: 'Primary', meaning: "Core thermal output, amber with zero flash." },
      { label: 'Secondary', meaning: "Post-combustion vacuum." },
      { label: 'Tertiary', meaning: "Thermal half-life, the glow of survival." },
    ],
  },
  ferryman: {
    arcanaRole: "He facilitates one-way transit. His spectrum operates entirely off the radar — fluid density, acoustic dampening, and deliberate obfuscation.",
    entries: [
      { label: 'Primary', meaning: "Fluid density trapping light and sound." },
      { label: 'Secondary', meaning: "Acoustic void ending the signal." },
      { label: 'Tertiary', meaning: "Atmospheric noise, intentional cover." },
    ],
  },
  mapmaker: {
    arcanaRole: "Cyclical redundancy tracking. His spectrum is the surveyor's kit — ink carried in the glass, paper held against the wall, stone under the chain.",
    entries: [
      { label: 'Primary', meaning: "Indigo ink, the mark that outlives the street." },
      { label: 'Secondary', meaning: "Sand and parchment, the substrate of every revision." },
      { label: 'Tertiary', meaning: "Stone grey, the city as it sits beneath the drawing." },
    ],
  },
  'obsidian-count': {
    arcanaRole: "The architecture of consequence. His spectrum is punitive geometry — zero-albedo mass, unalterable documentation, and a cold kinetic edge.",
    entries: [
      { label: 'Primary', meaning: "Zero-albedo mass, reflecting before it severs." },
      { label: 'Secondary', meaning: "Indelible compound locking the ledger." },
      { label: 'Tertiary', meaning: "Kinetic edge, polished enforcement steel." },
    ],
  },
  baker: {
    arcanaRole: "Mastery of temporal mechanics. His spectrum visualizes waiting as an active process — applied thermodynamics, containment protocols, and suspended particles.",
    entries: [
      { label: 'Primary', meaning: "Thermal residue of time and heat." },
      { label: 'Secondary', meaning: "Containment matrix holding the reaction." },
      { label: 'Tertiary', meaning: "Suspended particulate delay." },
    ],
  },
  'the-bind': {
    arcanaRole: "A sudden system halt. Her spectrum maps rapid deceleration — traumatic hematoma, absolute zero, and the cold reality of baseline stabilization.",
    entries: [
      { label: 'Primary', meaning: "Traumatic hematoma mapping kinetic shock." },
      { label: 'Secondary', meaning: "Absolute zero, cessation of movement." },
      { label: 'Tertiary', meaning: "Baseline stabilization, grey-violet equilibrium." },
    ],
  },
  cook: {
    arcanaRole: "Real-time calibration of chaos. Her spectrum is an active reaction chamber — systemic container, chemical synthesis, and a ruthless base extract.",
    entries: [
      { label: 'Primary', meaning: "Systemic container built for the boil." },
      { label: 'Secondary', meaning: "Chemical synthesis at critical mass." },
      { label: 'Tertiary', meaning: "Base extract, burned-down concentrate." },
    ],
  },
  mirrormaker: {
    arcanaRole: "Provider of unwelcome telemetry. His spectrum creates a hostile feedback loop — unsparing reflection, visceral biological response, and an infinite data sink.",
    entries: [
      { label: 'Primary', meaning: "Hostile reflection, uncomfortable warmth." },
      { label: 'Secondary', meaning: "Biological response, capillary flush of truth." },
      { label: 'Tertiary', meaning: "Infinite sink trapping data." },
    ],
  },
  doorwarden: {
    arcanaRole: "Structural patience. Her spectrum is the threshold held in green — lichen on the jamb, moss in the seam, the long damp of a wall that has not moved.",
    entries: [
      { label: 'Primary', meaning: "Fir green, the colour of a door that waits." },
      { label: 'Secondary', meaning: "Deep pine, shadow at the lintel before entry." },
      { label: 'Tertiary', meaning: "Sage highlight, the breath of air once the latch gives." },
    ],
  },
  lightkeeper: {
    arcanaRole: "Maintenance of signal isolation. Her spectrum is a localized flare within a dead zone — directed energy, maximum dispersal range, and the surrounding absolute void.",
    entries: [
      { label: 'Primary', meaning: "Directed energy filtered through metal housing." },
      { label: 'Secondary', meaning: "Maximum dispersal, signal decay." },
      { label: 'Tertiary', meaning: "Absolute void required for legibility." },
    ],
  },
  tailor: {
    arcanaRole: "Specialist in what the fabric already knows. His spectrum is the workroom at dusk — worn wool, silver thread caught in the lamp, the shadow under the cutting table.",
    entries: [
      { label: 'Primary', meaning: "Dusky mauve-brown, the register of handled cloth." },
      { label: 'Secondary', meaning: "Silver-dust, a moon whisper in the weave." },
      { label: 'Tertiary', meaning: "Dark earth, the fitting that happens before the mirror." },
    ],
  },
  brewer: {
    arcanaRole: "Operation at maximum output. Her spectrum resembles unshielded emotional radiation — unmitigated exposure, peak wavelength, and biological byproduct.",
    entries: [
      { label: 'Primary', meaning: "Unmitigated exposure, direct amber hit." },
      { label: 'Secondary', meaning: "Peak wavelength, blindingly direct gold." },
      { label: 'Tertiary', meaning: "Biological byproduct, permanent honey residue." },
    ],
  },
  keymaker: {
    arcanaRole: "Practitioner of predictive geometry. His spectrum maps the architecture of future access — friction memory, untouched precision, and the strictly unmapped interior.",
    entries: [
      { label: 'Primary', meaning: "Friction memory logging previous access." },
      { label: 'Secondary', meaning: "Untouched precision, un-fired vector." },
      { label: 'Tertiary', meaning: "Unmapped interior darkness." },
    ],
  },
  veilwalker: {
    arcanaRole: "The complete systemic loop. Her spectrum represents the absolute terminal boundary — transition phase, absolute limit, and the pristine pre-initialization void.",
    entries: [
      { label: 'Primary', meaning: "Transition phase, twilight decay." },
      { label: 'Secondary', meaning: "Absolute limit at the final border wall." },
      { label: 'Tertiary', meaning: "Pre-initialization state, midnight before reboot." },
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