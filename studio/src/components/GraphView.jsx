import React, { useMemo, useRef, useState } from 'react';

const W = 1000;
const H = 640;
const INITIAL_VIEWBOX = { x: -90, y: -60, w: 1180, h: 760 };
const MIN_VIEWBOX_WIDTH = 620;
const MAX_VIEWBOX_WIDTH = 1800;
const PAN_MARGIN = 260;

const TIER_RINGS = {
  guides: { r: 90, color: '#fce4ec', label: 'Guides' },
  luminaries: { r: 195, color: '#f3e5f5', label: 'Luminaries' },
  guardians: { r: 290, color: '#e3f2fd', label: 'Guardians' },
  custodians: { r: 380, color: '#fff3e0', label: 'Custodians' },
  grounded: { r: 465, color: '#e8f5e9', label: 'Grounded' },
};

const EDGE_MODES = [
  { id: 'all', label: 'All links' },
  { id: 'relations', label: 'Relations' },
  { id: 'encounters', label: 'Encounters' },
  { id: 'mismatches', label: 'Gaps' },
];

const ISSUE_FILTERS = [
  { id: 'all', label: 'All nodes' },
  { id: 'content', label: 'Thin content' },
  { id: 'coverage', label: 'Coverage gaps' },
  { id: 'asymmetry', label: 'One-way links' },
  { id: 'isolated', label: 'Isolated' },
];

function pairKey(a, b) {
  return [a, b].sort().join('--');
}

function encounterParticipants(encounter) {
  const participants = Array.isArray(encounter.participants) && encounter.participants.length > 0
    ? encounter.participants
    : [encounter.slugA, encounter.slugB].filter(Boolean);
  return [...new Set(participants)];
}

function buildLayout(characters) {
  const byTier = {};
  characters.forEach(character => {
    if (!byTier[character.tier]) byTier[character.tier] = [];
    byTier[character.tier].push(character);
  });

  const positions = {};
  Object.entries(TIER_RINGS).forEach(([tier, { r }]) => {
    const tierCharacters = (byTier[tier] || []).slice().sort((left, right) => (left.n ?? 99) - (right.n ?? 99));
    tierCharacters.forEach((character, index) => {
      const angle = (index / tierCharacters.length) * 2 * Math.PI - Math.PI / 2;
      positions[character.slug] = {
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
      };
    });
  });

  return positions;
}

function buildAdjacency(edges) {
  const adjacency = new Map();
  edges.forEach(edge => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source).add(edge.target);
    adjacency.get(edge.target).add(edge.source);
  });
  return adjacency;
}

function collectNeighborhood(seedSlugs, adjacency, depth) {
  const queue = seedSlugs.filter(Boolean).map(slug => ({ slug, depth: 0 }));
  const visited = new Set(queue.map(item => item.slug));

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.depth >= depth) continue;
    const neighbors = adjacency.get(current.slug) || new Set();
    neighbors.forEach(neighbor => {
      if (visited.has(neighbor)) return;
      visited.add(neighbor);
      queue.push({ slug: neighbor, depth: current.depth + 1 });
    });
  }

  return visited;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampViewBox(viewBox) {
  const nextWidth = clamp(viewBox.w, MIN_VIEWBOX_WIDTH, MAX_VIEWBOX_WIDTH);
  const nextHeight = (nextWidth / W) * H;
  const minX = -PAN_MARGIN;
  const minY = -PAN_MARGIN;
  const maxX = W - nextWidth + PAN_MARGIN;
  const maxY = H - nextHeight + PAN_MARGIN;

  return {
    x: clamp(viewBox.x, minX, maxX),
    y: clamp(viewBox.y, minY, maxY),
    w: nextWidth,
    h: nextHeight,
  };
}

function zoomViewBox(viewBox, factor, anchorX = W / 2, anchorY = H / 2) {
  const nextWidth = clamp(viewBox.w * factor, MIN_VIEWBOX_WIDTH, MAX_VIEWBOX_WIDTH);
  const scale = nextWidth / viewBox.w;
  const nextHeight = (nextWidth / W) * H;
  const nextX = anchorX - (anchorX - viewBox.x) * scale;
  const nextY = anchorY - (anchorY - viewBox.y) * scale;
  return clampViewBox({ x: nextX, y: nextY, w: nextWidth, h: nextHeight });
}

function graphGapScore(issues) {
  return issues.reduce((score, issue) => {
    if (issue === 'bio-structure') return score + 6;
    if (issue === 'bio-thin') return score + 5;
    if (issue === 'talisman' || issue === 'shadow') return score + 5;
    if (issue === 'talisman-thin' || issue === 'shadow-thin') return score + 3;
    if (issue === 'relation-notes') return score + 3;
    if (issue === 'relation-notes-incomplete') return score + 2;
    if (issue === 'flower' || issue === 'palette') return score + 2;
    if (issue === 'flower-meaning') return score + 1;
    return 1;
  }, 0);
}

function bioParagraphCount(bio) {
  if (!bio || !bio.trim()) return 0;
  return bio.trim().split(/\n\n+/).filter(Boolean).length;
}

function computeGraphGaps(characters) {
  const allSlugs = new Set(characters.map(character => character.slug));
  return characters.map(character => {
    const issues = [];
    const talismanLength = character.talisman?.trim().length || 0;
    const shadowLength = character.shadow?.trim().length || 0;
    const bioLength = character.bio?.trim().length || 0;
    const paragraphs = bioParagraphCount(character.bio);
    const relationSlugs = (character.relations || []).filter(slug => allSlugs.has(slug));
    const relationNotes = Array.isArray(character.relationNotes) ? character.relationNotes.filter(note => note?.slug && note?.note?.trim()) : [];

    if (talismanLength < 30) issues.push('talisman');
    else if (talismanLength < 340) issues.push('talisman-thin');

    if (shadowLength < 30) issues.push('shadow');
    else if (shadowLength < 340) issues.push('shadow-thin');

    if (bioLength < 150) issues.push('bio');
    else {
      if (paragraphs < 4) issues.push('bio-structure');
      if (bioLength < 900) issues.push('bio-thin');
    }

    if (!character.flower?.trim()) issues.push('flower');
    if (!character.flowerMeaning?.trim()) issues.push('flower-meaning');
    if (!Array.isArray(character.palette) || character.palette.filter(Boolean).length < 3) issues.push('palette');

    if (relationSlugs.length > 0) {
      if (relationNotes.length === 0) issues.push('relation-notes');
      else if (relationNotes.length < relationSlugs.length) issues.push('relation-notes-incomplete');
    }

    const brokenRelations = (character.relations || []).filter(slug => !allSlugs.has(slug));
    if (brokenRelations.length > 0) issues.push(`broken-relations(${brokenRelations.join(',')})`);

    return {
      slug: character.slug,
      issues,
      score: graphGapScore(issues),
    };
  }).filter(gap => gap.issues.length > 0);
}

function issueLabel(issue) {
  return issue
    .replace(/\(.+\)/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, match => match.toUpperCase());
}

function SectionTitle({ children, meta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)' }}>
        {children}
      </div>
      {meta ? <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{meta}</div> : null}
    </div>
  );
}

function StatChip({ label, value, tone = 'default' }) {
  const background = tone === 'accent'
    ? 'var(--accent-soft)'
    : tone === 'warning'
      ? '#fff4eb'
      : 'var(--surface-2)';
  const color = tone === 'accent'
    ? 'var(--accent)'
    : tone === 'warning'
      ? '#9a3412'
      : 'var(--text-2)';

  return (
    <div style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background, minWidth: 82 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color }}>{label}</div>
    </div>
  );
}

function CollapsibleSection({ title, meta, defaultOpen = true, children, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: open ? 10 : 0, cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-3)', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'rotate(0)', display: 'inline-block' }}>{"\u25B6"}</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)' }}>{title}</span>
          {count != null ? <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>({count})</span> : null}
        </div>
        {meta ? <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{meta}</div> : null}
      </div>
      {open ? children : null}
    </div>
  );
}

const EDGE_LEGEND = [
  { label: 'Relation + encounter', color: '#4a4540', dash: undefined, width: 2 },
  { label: 'Relation only', color: '#c8a856', dash: undefined, width: 1.5 },
  { label: 'Encounter only', color: '#4a7fbd', dash: '5 3', width: 1.5 },
  { label: 'Gap (in Gaps mode)', color: '#c45a2d', dash: '4 3', width: 2 },
];

function PartnerRow({ character, statuses, onFocus, onCompare, onOpenEditor, onEncounterAction, encounterLabel }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: character.hue, flexShrink: 0, marginTop: 4 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{character.role}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{character.arcana}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {statuses.map(status => (
              <span
                key={status}
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: status === 'missing encounter' ? '#fff4eb' : 'var(--surface-2)',
                  color: status === 'missing encounter' ? '#9a3412' : 'var(--text-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                {status}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={onFocus}>Focus</button>
        <button className="btn btn-ghost btn-sm" onClick={onCompare}>Compare</button>
        <button className="btn btn-ghost btn-sm" onClick={onOpenEditor}>Open Editor</button>
        {onEncounterAction ? <button className="btn btn-primary btn-sm" onClick={onEncounterAction}>{encounterLabel}</button> : null}
      </div>
    </div>
  );
}

function EmptyInspector({ hoveredCharacter, relationCount, encounterCount, issueCount, totalCharacters }) {
  return (
    <div style={{ width: 360, borderLeft: '1px solid var(--border)', background: 'var(--surface)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>Relationship graph</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16 }}>
        Click a character to inspect their connections. Click a second to compare a pair.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatChip label="Characters" value={totalCharacters} />
        <StatChip label="Relations" value={relationCount} tone="accent" />
        <StatChip label="Encounters" value={encounterCount} />
        {issueCount > 0 ? <StatChip label="With issues" value={issueCount} tone="warning" /> : null}
      </div>
      {hoveredCharacter ? (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: hoveredCharacter.hue }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{hoveredCharacter.role}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{hoveredCharacter.arcana}</div>
            </div>
          </div>
          {hoveredCharacter.essence ? <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, fontStyle: 'italic' }}>{hoveredCharacter.essence}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function GraphView({
  characters,
  encounters,
  selectedCharacterSlug,
  graphState,
  onGraphStateChange,
  onOpenCharacter,
  onOpenEncounter,
  onCreateEncounter,
  showToast,
}) {
  const [hovered, setHovered] = useState(null);
  const [viewBox, setViewBox] = useState(INITIAL_VIEWBOX);
  const [isPanning, setIsPanning] = useState(false);
  const svgRef = useRef(null);
  const panStateRef = useRef(null);

  const bySlug = useMemo(() => new Map(characters.map(character => [character.slug, character])), [characters]);
  const positions = useMemo(() => buildLayout(characters), [characters]);
  const gaps = useMemo(() => computeGraphGaps(characters), [characters]);
  const gapMap = useMemo(() => new Map(gaps.map(gap => [gap.slug, gap])), [gaps]);

  const { edges, encountersByPair } = useMemo(() => {
    const pairMap = new Map();
    const slugSet = new Set(characters.map(character => character.slug));

    characters.forEach(character => {
      (character.relations || []).forEach(target => {
        if (!slugSet.has(target) || target === character.slug) return;
        const key = pairKey(character.slug, target);
        const [source, edgeTarget] = [character.slug, target].sort();
        const edge = pairMap.get(key) || { source, target: edgeTarget, relation: false, encounter: false, encounterId: null, encounterTitle: null };
        edge.relation = true;
        pairMap.set(key, edge);
      });
    });

    encounters.forEach(encounter => {
      const participants = encounterParticipants(encounter).filter(slug => slugSet.has(slug));
      if (participants.length < 2) return;

      for (let index = 0; index < participants.length; index += 1) {
        for (let nextIndex = index + 1; nextIndex < participants.length; nextIndex += 1) {
          const sourceSlug = participants[index];
          const targetSlug = participants[nextIndex];
          if (sourceSlug === targetSlug) continue;
          const key = pairKey(sourceSlug, targetSlug);
          const [source, edgeTarget] = [sourceSlug, targetSlug].sort();
          const edge = pairMap.get(key) || { source, target: edgeTarget, relation: false, encounter: false, encounterId: null, encounterTitle: null };
          edge.encounter = true;
          edge.encounterId = edge.encounterId || encounter.id;
          edge.encounterTitle = edge.encounterTitle || encounter.title || encounter.id;
          pairMap.set(key, edge);
        }
      }
    });

    const allEdges = Array.from(pairMap.values()).map(edge => ({
      ...edge,
      kind: edge.relation && edge.encounter ? 'both' : edge.relation ? 'relation' : 'encounter',
      mismatch: edge.relation !== edge.encounter,
    }));

    const encounterMap = new Map();
    encounters.forEach(encounter => {
      const participants = encounterParticipants(encounter);
      for (let index = 0; index < participants.length; index += 1) {
        for (let nextIndex = index + 1; nextIndex < participants.length; nextIndex += 1) {
          const key = pairKey(participants[index], participants[nextIndex]);
          if (!encounterMap.has(key)) encounterMap.set(key, encounter);
        }
      }
    });

    return { edges: allEdges, encountersByPair: encounterMap };
  }, [characters, encounters]);

  const analysisBySlug = useMemo(() => {
    const analysis = new Map();

    characters.forEach(character => {
      const declared = (character.relations || []).filter(slug => bySlug.has(slug));
      const referencedBy = characters
        .filter(other => other.slug !== character.slug && other.relations?.includes(character.slug))
        .map(other => other.slug);
      const encounterPartners = edges
        .filter(edge => edge.encounter && (edge.source === character.slug || edge.target === character.slug))
        .map(edge => edge.source === character.slug ? edge.target : edge.source);
      const missingEncounterPartners = declared.filter(slug => !encounterPartners.includes(slug));
      const encounterOnlyPartners = encounterPartners.filter(slug => !declared.includes(slug));
      const oneWayOutgoing = declared.filter(slug => !bySlug.get(slug)?.relations?.includes(character.slug));
      const oneWayIncoming = referencedBy.filter(slug => !declared.includes(slug));

      analysis.set(character.slug, {
        declared,
        referencedBy,
        encounterPartners,
        missingEncounterPartners,
        encounterOnlyPartners,
        oneWayOutgoing,
        oneWayIncoming,
      });
    });

    return analysis;
  }, [bySlug, characters, edges]);

  const matchesIssueFilter = useMemo(() => {
    return slug => {
      const analysis = analysisBySlug.get(slug);
      const gap = gapMap.get(slug);
      const connectivity = (analysis?.declared.length || 0) + (analysis?.encounterOnlyPartners.length || 0);

      switch (graphState.issueFilter) {
        case 'content':
          return Boolean(gap);
        case 'coverage':
          return Boolean(analysis?.missingEncounterPartners.length || analysis?.encounterOnlyPartners.length);
        case 'asymmetry':
          return Boolean(analysis?.oneWayOutgoing.length || analysis?.oneWayIncoming.length);
        case 'isolated':
          return connectivity === 0;
        default:
          return true;
      }
    };
  }, [analysisBySlug, gapMap, graphState.issueFilter]);

  const visibleCharacters = useMemo(() => {
    return characters.filter(character => {
      if (graphState.tierFilter && character.tier !== graphState.tierFilter) return false;
      return matchesIssueFilter(character.slug);
    });
  }, [characters, graphState.tierFilter, matchesIssueFilter]);

  const visibleSlugs = useMemo(() => new Set(visibleCharacters.map(character => character.slug)), [visibleCharacters]);

  const visibleEdges = useMemo(() => {
    return edges.filter(edge => {
      if (!visibleSlugs.has(edge.source) || !visibleSlugs.has(edge.target)) return false;
      if (graphState.edgeMode === 'relations') return edge.relation;
      if (graphState.edgeMode === 'encounters') return edge.encounter;
      if (graphState.edgeMode === 'mismatches') return edge.mismatch;
      return true;
    });
  }, [edges, graphState.edgeMode, visibleSlugs]);

  const visibleAdjacency = useMemo(() => buildAdjacency(visibleEdges), [visibleEdges]);

  const highlightSeeds = graphState.pinnedSlug
    ? [graphState.pinnedSlug, graphState.compareSlug].filter(Boolean)
    : hovered
      ? [hovered]
      : selectedCharacterSlug
        ? [selectedCharacterSlug]
        : [];
  const highlightedSet = highlightSeeds.length > 0
    ? collectNeighborhood(highlightSeeds, visibleAdjacency, graphState.neighborhoodDepth)
    : null;

  const totalConnections = useMemo(() => {
    const counts = {};
    edges.forEach(edge => {
      counts[edge.source] = (counts[edge.source] || 0) + 1;
      counts[edge.target] = (counts[edge.target] || 0) + 1;
    });
    return counts;
  }, [edges]);

  const pinnedCharacter = graphState.pinnedSlug ? bySlug.get(graphState.pinnedSlug) : null;
  const compareCharacter = graphState.compareSlug ? bySlug.get(graphState.compareSlug) : null;
  const hoveredCharacter = hovered ? bySlug.get(hovered) : null;
  const pinnedAnalysis = pinnedCharacter ? analysisBySlug.get(pinnedCharacter.slug) : null;
  const pinnedGap = pinnedCharacter ? gapMap.get(pinnedCharacter.slug) : null;
  const pair = pinnedCharacter && compareCharacter ? edges.find(edge => pairKey(edge.source, edge.target) === pairKey(pinnedCharacter.slug, compareCharacter.slug)) : null;
  const sharedNeighbors = pinnedCharacter && compareCharacter
    ? [...(visibleAdjacency.get(pinnedCharacter.slug) || new Set())]
        .filter(slug => slug !== compareCharacter.slug && (visibleAdjacency.get(compareCharacter.slug) || new Set()).has(slug))
        .map(slug => bySlug.get(slug))
        .filter(Boolean)
    : [];
  const issueCount = gaps.filter(gap => gap.issues.some(issue => !issue.startsWith('broken-relations'))).length;

  function updateGraphState(updater) {
    onGraphStateChange(current => (typeof updater === 'function' ? updater(current) : updater));
  }

  function getSvgCoordinates(clientX, clientY, box = viewBox) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: box.x + ((clientX - rect.left) / rect.width) * box.w,
      y: box.y + ((clientY - rect.top) / rect.height) * box.h,
    };
  }

  function focusNode(slug) {
    updateGraphState(state => ({ ...state, pinnedSlug: slug, compareSlug: null }));
  }

  function toggleCompare(slug) {
    updateGraphState(state => ({ ...state, compareSlug: state.compareSlug === slug ? null : slug }));
  }

  function handleNodeClick(slug) {
    setHovered(null);
    updateGraphState(state => {
      if (!state.pinnedSlug) return { ...state, pinnedSlug: slug, compareSlug: null };
      if (state.pinnedSlug === slug) {
        if (state.compareSlug) return { ...state, compareSlug: null };
        return { ...state, pinnedSlug: null };
      }
      if (state.compareSlug === slug) return { ...state, compareSlug: null };
      return { ...state, compareSlug: slug };
    });
  }

  function handleWheel(event) {
    event.preventDefault();
    const anchor = getSvgCoordinates(event.clientX, event.clientY);
    const factor = event.deltaY > 0 ? 1.12 : 0.88;
    setViewBox(current => zoomViewBox(current, factor, anchor?.x, anchor?.y));
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return;
    if (event.target.closest?.('[data-graph-node="true"]')) return;
    const anchor = getSvgCoordinates(event.clientX, event.clientY);
    if (!anchor) return;
    panStateRef.current = {
      pointerId: event.pointerId,
      origin: anchor,
      startViewBox: viewBox,
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!panStateRef.current || panStateRef.current.pointerId !== event.pointerId) return;
    const currentPoint = getSvgCoordinates(event.clientX, event.clientY, panStateRef.current.startViewBox);
    if (!currentPoint) return;
    const dx = currentPoint.x - panStateRef.current.origin.x;
    const dy = currentPoint.y - panStateRef.current.origin.y;
    setViewBox(clampViewBox({
      ...panStateRef.current.startViewBox,
      x: panStateRef.current.startViewBox.x - dx,
      y: panStateRef.current.startViewBox.y - dy,
    }));
  }

  function endPan(event) {
    if (event && panStateRef.current?.pointerId !== event.pointerId) return;
    panStateRef.current = null;
    setIsPanning(false);
  }

  function edgeStyle(edge, active) {
    const gapsMode = graphState.edgeMode === 'mismatches';
    // In gaps mode, show the mismatch highlight. In all other modes, render by structural type.
    if (gapsMode && edge.mismatch) {
      return { color: active ? '#c45a2d' : '#e09070', dash: '4 3', width: active ? 2.5 : 1.4 };
    }
    if (edge.encounter && edge.relation) {
      return { color: active ? '#4a4540' : '#9a9088', dash: undefined, width: active ? 2.4 : 1.6 };
    }
    if (edge.encounter && !edge.relation) {
      return { color: active ? '#4a7fbd' : '#8ab0d8', dash: '5 3', width: active ? 1.8 : 1.1 };
    }
    // relation only
    return { color: active ? '#b8964e' : '#c8a856', dash: undefined, width: active ? 1.8 : 1.1 };
  }

  function nodeRadius(character) {
    const base = 19;
    const bonus = Math.min((totalConnections[character.slug] || 0) * 1.4, 7);
    return base + bonus;
  }

  async function handlePairEncounterAction(slugA, slugB) {
    const existing = encountersByPair.get(pairKey(slugA, slugB));
    if (existing) {
      onOpenEncounter(existing.id);
      return;
    }
    const result = await onCreateEncounter(slugA, slugB);
    if (!result && showToast) showToast('Unable to create encounter', 'error');
  }

  const inspector = !pinnedCharacter ? (
    <EmptyInspector
      hoveredCharacter={hoveredCharacter}
      relationCount={edges.filter(edge => edge.relation).length}
      encounterCount={edges.filter(edge => edge.encounter).length}
      issueCount={issueCount}
      totalCharacters={characters.length}
    />
  ) : (
    <div style={{ width: 360, borderLeft: '1px solid var(--border)', background: 'var(--surface)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
      {/* Character header — always visible */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: pinnedCharacter.hue, flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.15 }}>{pinnedCharacter.role}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{pinnedCharacter.arcana}{pinnedCharacter.name ? ` · ${pinnedCharacter.name}` : ''}</div>
        </div>
      </div>

      {pinnedCharacter.essence ? <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 12 }}>{pinnedCharacter.essence}</div> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <StatChip label="Relations" value={pinnedAnalysis?.declared.length || 0} tone="accent" />
        <StatChip label="Encounters" value={pinnedAnalysis?.encounterPartners.length || 0} />
        {(pinnedGap?.issues.length || 0) > 0 ? <StatChip label="Issues" value={pinnedGap.issues.length} tone="warning" /> : null}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onOpenCharacter(pinnedCharacter.slug)}>Open Editor</button>
        <button className="btn btn-ghost btn-sm" onClick={() => updateGraphState(state => ({ ...state, pinnedSlug: null, compareSlug: null }))}>Clear</button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>

        {/* Compare mode — always open when active */}
        {compareCharacter ? (
          <CollapsibleSection title="Compare" meta={pair ? `${pair.relation ? 'rel' : '—'} / ${pair.encounter ? 'enc' : '—'}` : 'no link'}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: compareCharacter.hue, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{compareCharacter.role}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{compareCharacter.arcana}</div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => updateGraphState(state => ({ ...state, compareSlug: null }))}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onOpenCharacter(compareCharacter.slug)}>Editor</button>
                <button className="btn btn-primary btn-sm" onClick={() => handlePairEncounterAction(pinnedCharacter.slug, compareCharacter.slug)}>{pair?.encounter ? 'Open Encounter' : 'Create Encounter'}</button>
              </div>
              {sharedNeighbors.length > 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  Shared: {sharedNeighbors.map(character => character.role).join(', ')}
                </div>
              ) : null}
            </div>
          </CollapsibleSection>
        ) : null}

        {/* Content issues — collapsed by default unless there are issues */}
        {pinnedGap ? (
          <CollapsibleSection title="Content gaps" count={pinnedGap.issues.length} defaultOpen={pinnedGap.issues.length <= 4}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {pinnedGap.issues.map(issue => <span key={issue} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, border: '1px solid #f2d7bf', background: '#fff4eb', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '.05em' }}>{issueLabel(issue)}</span>)}
            </div>
          </CollapsibleSection>
        ) : null}

        {/* Relations — the main section people want to see */}
        {(pinnedAnalysis?.declared.length || 0) > 0 ? (
          <CollapsibleSection title="Relations" count={pinnedAnalysis.declared.length}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pinnedAnalysis.declared.map(slug => {
                const partner = bySlug.get(slug);
                if (!partner) return null;
                const statuses = [];
                if (pinnedAnalysis.encounterPartners.includes(slug)) statuses.push('encounter');
                if (pinnedAnalysis.oneWayOutgoing.includes(slug)) statuses.push('one-way');
                if (pinnedAnalysis.missingEncounterPartners.includes(slug)) statuses.push('no encounter');
                return <PartnerRow key={slug} character={partner} statuses={statuses} onFocus={() => focusNode(slug)} onCompare={() => toggleCompare(slug)} onOpenEditor={() => onOpenCharacter(slug)} onEncounterAction={() => handlePairEncounterAction(pinnedCharacter.slug, slug)} encounterLabel={encountersByPair.get(pairKey(pinnedCharacter.slug, slug)) ? 'Open Encounter' : 'Create Encounter'} />;
              })}
            </div>
          </CollapsibleSection>
        ) : null}

        {/* Missing encounters — collapsed by default */}
        {(pinnedAnalysis?.missingEncounterPartners.length || 0) > 0 ? (
          <CollapsibleSection title="Missing encounters" count={pinnedAnalysis.missingEncounterPartners.length} defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pinnedAnalysis.missingEncounterPartners.map(slug => {
                const partner = bySlug.get(slug);
                if (!partner) return null;
                return <PartnerRow key={slug} character={partner} statuses={['no encounter']} onFocus={() => focusNode(slug)} onCompare={() => toggleCompare(slug)} onOpenEditor={() => onOpenCharacter(slug)} onEncounterAction={() => handlePairEncounterAction(pinnedCharacter.slug, slug)} encounterLabel="Create Encounter" />;
              })}
            </div>
          </CollapsibleSection>
        ) : null}

        {/* Encounter-only — collapsed by default */}
        {(pinnedAnalysis?.encounterOnlyPartners.length || 0) > 0 ? (
          <CollapsibleSection title="Encounter-only links" count={pinnedAnalysis.encounterOnlyPartners.length} defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pinnedAnalysis.encounterOnlyPartners.map(slug => {
                const partner = bySlug.get(slug);
                if (!partner) return null;
                return <PartnerRow key={slug} character={partner} statuses={['no relation']} onFocus={() => focusNode(slug)} onCompare={() => toggleCompare(slug)} onOpenEditor={() => onOpenCharacter(slug)} onEncounterAction={() => handlePairEncounterAction(pinnedCharacter.slug, slug)} encounterLabel="Open Encounter" />;
              })}
            </div>
          </CollapsibleSection>
        ) : null}

        {/* One-way incoming — collapsed by default */}
        {(pinnedAnalysis?.oneWayIncoming.length || 0) > 0 ? (
          <CollapsibleSection title="Reverse references" count={pinnedAnalysis.oneWayIncoming.length} defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pinnedAnalysis.oneWayIncoming.map(slug => {
                const partner = bySlug.get(slug);
                if (!partner) return null;
                return <PartnerRow key={slug} character={partner} statuses={['incoming only']} onFocus={() => focusNode(slug)} onCompare={() => toggleCompare(slug)} onOpenEditor={() => onOpenCharacter(slug)} />;
              })}
            </div>
          </CollapsibleSection>
        ) : null}

      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar row 1: Filters */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 16, borderRight: '1px solid var(--border)', marginRight: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Tier</span>
          <button className={`btn btn-sm ${!graphState.tierFilter ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateGraphState(state => ({ ...state, tierFilter: null }))}>All</button>
          {Object.entries(TIER_RINGS).map(([tier, { label }]) => <button key={tier} className={`btn btn-sm ${graphState.tierFilter === tier ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateGraphState(state => ({ ...state, tierFilter: state.tierFilter === tier ? null : tier }))}>{label}</button>)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 16, borderRight: '1px solid var(--border)', marginRight: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Edges</span>
          {EDGE_MODES.map(mode => <button key={mode.id} className={`btn btn-sm ${graphState.edgeMode === mode.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateGraphState(state => ({ ...state, edgeMode: mode.id }))}>{mode.label}</button>)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 16, borderRight: '1px solid var(--border)', marginRight: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Filter</span>
          <select className="field-input" style={{ width: 140, paddingTop: 4, paddingBottom: 4, fontSize: 12, background: 'var(--surface)' }} value={graphState.issueFilter} onChange={event => updateGraphState(state => ({ ...state, issueFilter: event.target.value }))}>
            {ISSUE_FILTERS.map(filter => <option key={filter.id} value={filter.id}>{filter.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Depth</span>
          <button className={`btn btn-sm ${graphState.neighborhoodDepth === 1 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateGraphState(state => ({ ...state, neighborhoodDepth: 1 }))}>1</button>
          <button className={`btn btn-sm ${graphState.neighborhoodDepth === 2 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateGraphState(state => ({ ...state, neighborhoodDepth: 2 }))}>2</button>
          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
          <button className="btn btn-sm btn-ghost" onClick={() => setViewBox(current => zoomViewBox(current, 0.9))}>+</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setViewBox(current => zoomViewBox(current, 1.1))}>&minus;</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setViewBox(INITIAL_VIEWBOX)}>Reset</button>
          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{visibleCharacters.length} nodes &middot; {visibleEdges.length} edges</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <svg
            ref={svgRef}
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            style={{ flex: 1, height: '100%', background: '#fafaf8', cursor: isPanning ? 'grabbing' : 'grab', touchAction: 'none' }}
            onMouseLeave={() => setHovered(null)}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
          >
            {Object.entries(TIER_RINGS).reverse().map(([tier, { r, color }]) => <circle key={tier} cx={W / 2} cy={H / 2} r={r + 40} fill={color} opacity={graphState.tierFilter && graphState.tierFilter !== tier ? 0.08 : 0.35} />)}

            {Object.entries(TIER_RINGS).map(([tier, { r, label }]) => (
              <text key={tier} x={W / 2 + r + 20} y={H / 2 + 4} textAnchor="start" fontSize={9} fill="#aaa" fontFamily="Inter, sans-serif" fontWeight={500} letterSpacing={0.5} opacity={graphState.tierFilter && graphState.tierFilter !== tier ? 0.3 : 0.7}>
                {label}
              </text>
            ))}

            {visibleEdges.map(edge => {
              const sourcePosition = positions[edge.source];
              const targetPosition = positions[edge.target];
              if (!sourcePosition || !targetPosition) return null;
              const active = highlightedSet ? highlightedSet.has(edge.source) && highlightedSet.has(edge.target) : false;
              const dimmed = highlightedSet && !active;
              const es = edgeStyle(edge, active);
              return <line key={`${edge.source}--${edge.target}`} x1={sourcePosition.x} y1={sourcePosition.y} x2={targetPosition.x} y2={targetPosition.y} stroke={es.color} strokeWidth={es.width} opacity={dimmed ? 0.08 : active ? 1 : 0.55} strokeDasharray={es.dash} />;
            })}

            {visibleCharacters.map(character => {
              const position = positions[character.slug];
              if (!position) return null;
              const radius = nodeRadius(character);
              const isPinned = graphState.pinnedSlug === character.slug;
              const isCompare = graphState.compareSlug === character.slug;
              const isHovered = hovered === character.slug;
              const isSelected = selectedCharacterSlug === character.slug;
              const isHighlighted = highlightedSet ? highlightedSet.has(character.slug) : true;
              const dimmed = highlightedSet && !isHighlighted;
              const nodeIssues = gapMap.get(character.slug)?.issues.length || 0;

              return (
                <g key={character.slug} data-graph-node="true" transform={`translate(${position.x},${position.y})`} style={{ cursor: 'pointer' }} onClick={() => handleNodeClick(character.slug)} onMouseEnter={() => setHovered(character.slug)}>
                  {isSelected && !isPinned ? <circle r={radius + 8} fill="none" stroke="#7f766d" strokeWidth={1} opacity={0.45} /> : null}
                  {isPinned ? <circle r={radius + 8} fill="none" stroke="var(--text)" strokeWidth={2.2} /> : null}
                  {isCompare ? <circle r={radius + 12} fill="none" stroke={character.hue} strokeWidth={2.2} strokeDasharray="5 4" /> : null}
                  {isHovered && !isPinned && !isCompare ? <circle r={radius + 5} fill="none" stroke={character.hue} strokeWidth={1.4} opacity={0.6} /> : null}
                  <circle r={radius} fill={character.hue} opacity={dimmed ? 0.2 : 1} stroke="white" strokeWidth={1.6} />
                  {nodeIssues > 0 ? <circle cx={radius - 4} cy={-radius + 4} r={6} fill="#fff4eb" stroke="#9a3412" strokeWidth={1} /> : null}
                  {nodeIssues > 0 ? <text x={radius - 4} y={-radius + 7} textAnchor="middle" fontSize={8} fill="#9a3412" fontFamily="Inter, sans-serif" fontWeight={700}>{Math.min(nodeIssues, 9)}</text> : null}
                  <text textAnchor="middle" dy={4} fontSize={10} fill="white" fontFamily="Inter, sans-serif" fontWeight={700} opacity={dimmed ? 0.32 : 1}>{character.n}</text>
                  <text textAnchor="middle" dy={radius + 13} fontSize={isPinned || isCompare || isHovered ? 11 : 10} fontWeight={isPinned ? 700 : isCompare ? 600 : isHighlighted ? 500 : 400} fill={isPinned ? 'var(--text)' : isCompare ? character.hue : 'var(--text-2)'} fontFamily="Inter, sans-serif" opacity={dimmed ? 0.24 : 1}>{character.role?.replace('The ', '')}</text>
                </g>
              );
            })}
          </svg>

          <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,253,0.92)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 11, lineHeight: 1, backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 8 }}>Edge types</div>
            {EDGE_LEGEND.map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <svg width={28} height={6} style={{ flexShrink: 0 }}>
                  <line x1={0} y1={3} x2={28} y2={3} stroke={item.color} strokeWidth={item.width} strokeDasharray={item.dash} />
                </svg>
                <span style={{ color: 'var(--text-2)' }}>{item.label}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, color: 'var(--text-3)', fontSize: 10 }}>
              Click to pin &middot; click second to compare &middot; drag to pan
            </div>
          </div>
        </div>

        {inspector}
      </div>
    </div>
  );
}
