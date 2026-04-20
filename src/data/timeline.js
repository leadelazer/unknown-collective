import { CHARACTERS } from './characters.js';

const TIMELINE_NOTES = {
  brewer: {
    sortStart: 1884,
    sortEnd: null,
    displayDate: 'c. 1884',
    certainty: 'approx',
    eventLabel: 'Counted formally after years of supplying the room',
    summary: 'He tells older stories about himself than the archive can prove. What the record can support is this: by the mid-1880s he was already indispensable to gatherings around the estate, and the Collective eventually admitted what habit had made true.',
  },
  weavers: {
    sortStart: 1685,
    sortEnd: null,
    displayDate: 'Late 1600s',
    certainty: 'era',
    eventLabel: 'Noticed through the work itself',
    summary: 'Their textiles began carrying the city\'s private narratives before anyone bothered to separate trade from initiation.',
  },
  baker: {
    sortStart: 1690,
    sortEnd: null,
    displayDate: '1690s?',
    certainty: 'approx',
    eventLabel: 'Presence recorded before induction',
    summary: 'The bakehouse is dated. The invitation is not. The archive keeps his patience more clearly than it keeps the meeting that made him a member.',
  },
  duchess: {
    sortStart: 1700,
    sortEnd: 1720,
    displayDate: 'Baroque era',
    certainty: 'era',
    eventLabel: 'Earned her seat through observation',
    summary: 'Her habit of walking the city in disguise turns up in the record before any formal vote does. She is clearly inside the Collective by the time she secures the Curator\'s induction.',
  },
  cook: {
    sortStart: 1703,
    sortEnd: null,
    displayDate: '1703',
    certainty: 'exact',
    eventLabel: 'Invited back after one tense meeting',
    summary: 'The Duchess brings his kitchen to the Collective\'s attention in 1703. After he calms the table once, he is never really absent again.',
  },
  mapmaker: {
    sortStart: 1719,
    sortEnd: null,
    displayDate: '1719',
    certainty: 'exact',
    eventLabel: 'Joined as the city\'s survey became prophecy',
    summary: 'The record is clean here: the Mapmaker enters in 1719, recognized immediately by the Duchess as another reader of structural change.',
  },
  curator: {
    sortStart: 1720,
    sortEnd: null,
    displayDate: '1720',
    certainty: 'exact',
    eventLabel: 'Inducted into the archive proper',
    summary: 'His induction is explicitly dated. The archive makes room for him at the same moment it becomes impossible to separate knowledge from leverage.',
  },
  doorwarden: {
    sortStart: 1729,
    sortEnd: null,
    displayDate: '1729',
    certainty: 'exact',
    eventLabel: 'Finds the hidden door and is offered the post',
    summary: 'Her locksmith\'s eye leads her to a hidden threshold. The Keymaker is already waiting on the other side.',
  },
  keymaker: {
    sortStart: 1714,
    sortEnd: 1758,
    displayDate: 'c. 1714',
    certainty: 'approx',
    eventLabel: 'Accepts only after years of refusal',
    summary: 'He is present in the city before the Doorwarden finds the hidden threshold, and absent from regular record after 1758. The cleanest reading places his eventual acceptance in the mid-1710s, after function had already outrun ceremony.',
  },
  firefighter: {
    sortStart: 1745,
    sortEnd: 1750,
    displayDate: '1745-1750',
    certainty: 'range',
    eventLabel: 'Enters through a fire at the hall',
    summary: 'He becomes necessary before he becomes official. The invitation follows the rescue rather than preceding it.',
  },
  shieldbearer: {
    sortStart: 1806,
    sortEnd: null,
    displayDate: '1806?',
    certainty: 'approx',
    eventLabel: 'Emerges when the city is under threat',
    summary: 'The bio anchors her public role to 1806, though the archive offers no separate induction line. This is the earliest credible point at which the Collective would have needed her.',
  },
  mirrormaker: {
    sortStart: 1855,
    sortEnd: 1859,
    displayDate: 'Mid-1850s',
    certainty: 'approx',
    eventLabel: 'Invited once the mirrors start altering people',
    summary: 'His surrounding chronology places him in the mid-1850s. One invitation line appears misdated in the source, so this page follows the broader archive instead of the obvious typo.',
  },
  'merchant-prince': {
    sortStart: 1878,
    sortEnd: null,
    displayDate: 'Late 1870s',
    certainty: 'approx',
    eventLabel: 'Admitted as the newest Luminary',
    summary: 'He arrives with industrial expansion and joins soon after, bringing systems, ledgers, and a less inherited form of power into the room.',
  },
  'obsidian-count': {
    sortStart: 1878,
    sortEnd: null,
    displayDate: 'Industrial era',
    certainty: 'approx',
    eventLabel: 'Appears as legal counterweight',
    summary: 'The record ties his role closely to the Merchant Prince but never marks the induction itself. He enters the Collective as the argument profit cannot win on its own.',
  },
  tailor: {
    sortStart: 1883,
    sortEnd: null,
    displayDate: 'Early 1880s',
    certainty: 'approx',
    eventLabel: 'Observed at work, then invited',
    summary: 'A member watches him for an hour, sees what attention can do, and offers him a place. The timing lands shortly after his move to the city.',
  },
  lightkeeper: {
    sortStart: 1900,
    sortEnd: null,
    displayDate: 'c. 1900',
    certainty: 'approx',
    eventLabel: 'Brought fully into the record after the river years begin',
    summary: 'He had been tending lamps for years, but his Collective role coheres only once the Ferryman is in the city. The archive suggests an early-twentieth-century recognition rather than an earlier formal induction.',
  },
  oracle: {
    sortStart: 1889,
    sortEnd: null,
    displayDate: 'c. 1889',
    certainty: 'approx',
    eventLabel: 'Leaves the estate and chooses her own board',
    summary: 'The notes around 1889 place her departure and self-directed alignment with the Collective in the same phase of life, though not in a single documented ceremony.',
  },
  florist: {
    sortStart: 1891,
    sortEnd: null,
    displayDate: 'c. 1891',
    certainty: 'approx',
    eventLabel: 'Moves from the Duchess\'s estate into the network',
    summary: 'Her invitation to the city begins at the estate, but her place in the Collective seems to settle only once she starts working in her own name. The early 1890s fit the archive best: late enough to follow Frederike\'s break from the house, early enough for the old relationships to have formed.',
  },
  gardener: {
    sortStart: 1872,
    sortEnd: null,
    displayDate: 'c. 1872',
    certainty: 'approx',
    eventLabel: 'Rooted at the estate before the household notices',
    summary: 'By the time Frederike is old enough to recognize neglect, the Gardener is already part of the estate\'s internal weather. The early 1870s place her solidly before the Oracle\'s youth without forcing a theatrical origin onto someone who would have disliked one.',
  },
  ferryman: {
    sortStart: 1899,
    sortEnd: null,
    displayDate: '1899',
    certainty: 'exact',
    eventLabel: 'Joined in the year of the flood',
    summary: 'His arrival and joining are tied together. The river enters the Collective with him.',
  },
  'the-bind': {
    sortStart: 1698,
    sortEnd: null,
    displayDate: 'c. 1698',
    certainty: 'approx',
    eventLabel: 'Made rather than admitted',
    summary: 'The Bind belongs just after the Weavers and before the archive develops the language to describe what they made. It enters chronology only as a consequence: a living pattern noticed once its effects could no longer be mistaken for craft alone.',
  },
  veilwalker: {
    sortStart: 1733,
    sortEnd: null,
    displayDate: 'First marginal trace, 1733',
    certainty: 'legendary',
    eventLabel: 'Appears only in the margins',
    summary: 'This is not a true induction year, only the earliest surviving note most readers agree refers to her. The archive remains explicit that no one can reliably date her arrival; 1733 is merely when the margins begin to answer back.',
  },
};

function getCenturyLabel(year) {
  const start = Math.floor(year / 100) * 100;
  return `${start}s`;
}

function dedupeCharacters() {
  const seen = new Set();
  return CHARACTERS.filter(character => {
    if (seen.has(character.slug)) return false;
    seen.add(character.slug);
    return true;
  });
}

export const TIMELINE_ENTRIES = dedupeCharacters()
  .map(character => {
    const note = TIMELINE_NOTES[character.slug] || {
      sortStart: null,
      sortEnd: null,
      displayDate: 'Undated',
      certainty: 'undated',
      eventLabel: 'Present in the archive',
      summary: 'The character exists in the Collective, but the induction date has not been formalized into the chronology yet.',
    };

    return {
      ...character,
      ...note,
      centuryLabel: note.sortStart == null ? 'Undated' : getCenturyLabel(note.sortStart),
      hasPrecisePlacement: note.sortStart != null,
    };
  })
  .sort((left, right) => {
    if (left.sortStart == null && right.sortStart == null) {
      return left.n - right.n;
    }
    if (left.sortStart == null) return 1;
    if (right.sortStart == null) return -1;
    if (left.sortStart !== right.sortStart) return left.sortStart - right.sortStart;
    return left.n - right.n;
  });

export const TIMELINE_CENTURIES = TIMELINE_ENTRIES.reduce((centuries, entry) => {
  if (!entry.hasPrecisePlacement) return centuries;
  if (!centuries.includes(entry.centuryLabel)) centuries.push(entry.centuryLabel);
  return centuries;
}, []);

export const TIMELINE_CERTAINTY_LABELS = {
  exact: 'Exact',
  range: 'Range',
  approx: 'Approximate',
  era: 'Era',
  legendary: 'Legend',
  undated: 'Undated',
};
