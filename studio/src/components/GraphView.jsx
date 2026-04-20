import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow, ReactFlowProvider,
  useNodesState, useEdgesState,
  Background, Controls,
  BaseEdge, getStraightPath,
  Handle, Position,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const EDGE_MODES = [
  { id: 'all',        label: 'All links' },
  { id: 'relations',  label: 'Relations' },
  { id: 'encounters', label: 'Encounters' },
  { id: 'mismatches', label: 'Gaps' },
];

const ISSUE_FILTERS = [
  { id: 'all',       label: 'All nodes' },
  { id: 'content',   label: 'Thin content' },
  { id: 'coverage',  label: 'Coverage gaps' },
  { id: 'asymmetry', label: 'One-way links' },
  { id: 'isolated',  label: 'Isolated' },
];

const TIER_ORDER = ['guides', 'luminaries', 'guardians', 'custodians', 'grounded'];
const TIER_META  = {
  guides:      { label: 'Guides' },
  luminaries:  { label: 'Luminaries' },
  guardians:   { label: 'Guardians' },
  custodians:  { label: 'Custodians' },
  grounded:    { label: 'Grounded' },
};

const EDGE_LEGEND = [
  { label: 'Relation + encounter', color: '#4a4540', dash: undefined },
  { label: 'Relation only',        color: '#c8a856', dash: undefined },
  { label: 'Encounter only',       color: '#4a7fbd', dash: '6 3' },
  { label: 'Gap (Gaps mode only)', color: '#c45a2d', dash: '4 3' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pairKey(a, b) { return [a, b].sort().join('--'); }

function encounterParticipants(enc) {
  const p = Array.isArray(enc.participants) && enc.participants.length > 0
    ? enc.participants : [enc.slugA, enc.slugB].filter(Boolean);
  return [...new Set(p)];
}

function buildAdjacency(edges) {
  const adj = new Map();
  edges.forEach(e => {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source).add(e.target);
    adj.get(e.target).add(e.source);
  });
  return adj;
}

function collectNeighborhood(seeds, adj, depth) {
  const queue = seeds.filter(Boolean).map(s => ({ slug: s, d: 0 }));
  const visited = new Set(seeds.filter(Boolean));
  while (queue.length) {
    const cur = queue.shift();
    if (cur.d >= depth) continue;
    (adj.get(cur.slug) || new Set()).forEach(n => {
      if (visited.has(n)) return;
      visited.add(n);
      queue.push({ slug: n, d: cur.d + 1 });
    });
  }
  return visited;
}

function bioParagraphCount(bio) {
  if (!bio || !bio.trim()) return 0;
  return bio.trim().split(/\n\n+/).filter(Boolean).length;
}

function graphGapScore(issues) {
  return issues.reduce((s, i) => {
    if (i === 'bio-structure') return s + 6;
    if (i === 'bio-thin') return s + 5;
    if (i === 'talisman' || i === 'shadow') return s + 5;
    if (i === 'talisman-thin' || i === 'shadow-thin') return s + 3;
    if (i === 'relation-notes') return s + 3;
    if (i === 'relation-notes-incomplete') return s + 2;
    if (i === 'flower' || i === 'palette') return s + 2;
    return s + 1;
  }, 0);
}

function computeGraphGaps(characters) {
  const allSlugs = new Set(characters.map(c => c.slug));
  return characters.map(c => {
    const issues = [];
    const tLen = c.talisman?.trim().length || 0;
    const sLen = c.shadow?.trim().length || 0;
    const bLen = c.bio?.trim().length || 0;
    const paras = bioParagraphCount(c.bio);
    const relSlugs = (c.relations || []).filter(s => allSlugs.has(s));
    const relNotes = (Array.isArray(c.relationNotes) ? c.relationNotes : []).filter(n => n?.slug && n?.note?.trim());
    if (tLen < 30) issues.push('talisman'); else if (tLen < 340) issues.push('talisman-thin');
    if (sLen < 30) issues.push('shadow');   else if (sLen < 340) issues.push('shadow-thin');
    if (bLen < 150) issues.push('bio');
    else { if (paras < 4) issues.push('bio-structure'); if (bLen < 900) issues.push('bio-thin'); }
    if (!c.flower?.trim()) issues.push('flower');
    if (!c.flowerMeaning?.trim()) issues.push('flower-meaning');
    if (!Array.isArray(c.palette) || c.palette.filter(Boolean).length < 3) issues.push('palette');
    if (relSlugs.length > 0) {
      if (relNotes.length === 0) issues.push('relation-notes');
      else if (relNotes.length < relSlugs.length) issues.push('relation-notes-incomplete');
    }
    const broken = (c.relations || []).filter(r => !allSlugs.has(r));
    if (broken.length) issues.push('broken-relations(' + broken.join(',') + ')');
    return issues.length ? { slug: c.slug, issues, score: graphGapScore(issues) } : null;
  }).filter(Boolean);
}

function issueLabel(i) {
  return i.replace(/\(.+\)/, '').replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
}

// ─── Concentric tier layout ────────────────────────────────────────────────────
// luminaries at centre → guardians → custodians → grounded → guides (outermost)
const TIER_RING_ORDER  = ['luminaries', 'guardians', 'custodians', 'grounded', 'guides'];
const TIER_RING_RADII  = { luminaries: 160, guardians: 320, custodians: 490, grounded: 660, guides: 830 };
const TIER_RING_COLORS = { luminaries: '#c8a856', guardians: '#6a8fc0', custodians: '#85a87a', grounded: '#b07b55', guides: '#9b7eb5' };
const TIER_RING_LABELS = { luminaries: 'Luminaries', guardians: 'Guardians', custodians: 'Custodians', grounded: 'Grounded', guides: 'Guides' };
// Angular offset per ring so nodes don't all cluster at the top
const TIER_RING_ANGLE_OFFSET = { luminaries: 0, guardians: Math.PI / 4, custodians: Math.PI / 8, grounded: Math.PI / 12, guides: Math.PI / 3 };

function computeLayout(characters) {
  const byTier = {};
  TIER_RING_ORDER.forEach(t => { byTier[t] = []; });
  characters.forEach(c => { (byTier[c.tier] || (byTier[c.tier] = [])).push(c.slug); });

  const tiersPresent = TIER_RING_ORDER.filter(t => byTier[t]?.length > 0);

  // Single-tier filter → single ring
  if (tiersPresent.length === 1) {
    const slugs = byTier[tiersPresent[0]];
    const r = Math.max(200, slugs.length * 55);
    return Object.fromEntries(slugs.map((slug, i) => {
      const a = (i / slugs.length) * 2 * Math.PI - Math.PI / 2;
      return [slug, { x: Math.cos(a) * r, y: Math.sin(a) * r }];
    }));
  }

  const positions = {};
  tiersPresent.forEach(tier => {
    const slugs = byTier[tier];
    const r = TIER_RING_RADII[tier] || 500;
    const offset = TIER_RING_ANGLE_OFFSET[tier] || 0;
    slugs.forEach((slug, i) => {
      const a = (i / slugs.length) * 2 * Math.PI - Math.PI / 2 + offset;
      positions[slug] = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    });
  });
  return positions;
}

// ─── Tier ring background (inside ReactFlow, scales with zoom) ─────────────────
function TierRings({ tiersPresent }) {
  const { x: vpX, y: vpY, zoom } = useViewport();
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}>
      {TIER_RING_ORDER.filter(t => tiersPresent.has(t)).map(tier => {
        const r = (TIER_RING_RADII[tier] || 400) * zoom;
        const color = TIER_RING_COLORS[tier];
        // Label positioned at the top of each ring
        const lx = vpX;
        const ly = vpY - r;
        return (
          <g key={tier}>
            <circle cx={vpX} cy={vpY} r={r} fill="none" stroke={color} strokeWidth={1} strokeDasharray="6 4" opacity={0.25} />
            <text x={lx} y={ly - 6} textAnchor="middle" fontSize={10} fill={color} opacity={0.55} fontWeight={600} letterSpacing="0.06em" style={{ textTransform: 'uppercase', fontFamily: 'inherit' }}>
              {TIER_RING_LABELS[tier]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GraphContext = createContext({ highlightedSlugs: null, pinnedSlug: null, compareSlug: null, edgeMode: 'all' });

// ─── Custom node ──────────────────────────────────────────────────────────────
function CharacterNode({ id, data }) {
  const { highlightedSlugs, pinnedSlug, compareSlug } = useContext(GraphContext);
  const { character, gapCount } = data;
  const isPinned  = pinnedSlug  === id;
  const isCompare = compareSlug === id;
  const isDimmed  = highlightedSlugs && !highlightedSlugs.has(id);
  const r = 22 + Math.min((data.connectionCount || 0) * 1.2, 8);
  const size = r * 2;

  const ringStyle = isPinned
    ? { boxShadow: '0 0 0 3px #1a1a1a' }
    : isCompare
    ? { boxShadow: '0 0 0 3px ' + character.hue, outline: '2px dashed ' + character.hue, outlineOffset: 5 }
    : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
      <Handle type="source" position={Position.Top}    style={{ opacity: 0, width: 1, height: 1, minWidth: 1, minHeight: 1, border: 'none', background: 'transparent', top: '50%', left: '50%' }} />
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1, minWidth: 1, minHeight: 1, border: 'none', background: 'transparent', top: '50%', left: '50%' }} />
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: character.hue, border: '2.5px solid white',
        opacity: isDimmed ? 0.1 : (highlightedSlugs ? 1 : 0.68),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.18s, box-shadow 0.18s',
        position: 'relative',
        ...ringStyle,
      }}>
        <span style={{ color: 'white', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>{character.n}</span>
        {gapCount > 0 && (
          <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: '#fff4eb', border: '1px solid #9a3412', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#9a3412', fontWeight: 700 }}>
            {Math.min(gapCount, 9)}
          </div>
        )}
      </div>
      <div style={{
        fontSize: 10, fontWeight: isPinned ? 700 : 500, color: isPinned ? '#1a1a1a' : '#444',
        whiteSpace: 'nowrap', lineHeight: 1, opacity: isDimmed ? 0.1 : (highlightedSlugs ? 1 : 0.65),
        transition: 'opacity 0.18s', pointerEvents: 'none',
      }}>
        {character.role?.replace('The ', '')}
      </div>
    </div>
  );
}

// ─── Custom edge ──────────────────────────────────────────────────────────────
function RelationEdge({ sourceX, sourceY, targetX, targetY, source, target, data }) {
  const { highlightedSlugs, edgeMode } = useContext(GraphContext);
  const edge = data.edge;
  const isActive = !highlightedSlugs || (highlightedSlugs.has(source) && highlightedSlugs.has(target));
  const isDimmed  = highlightedSlugs && !(highlightedSlugs.has(source) && highlightedSlugs.has(target));
  const gapsMode = edgeMode === 'mismatches';
  let color, dash, width;
  if (gapsMode && edge.mismatch) {
    color = isActive ? '#c45a2d' : '#e09070'; dash = '4 3'; width = isActive ? 2.5 : 1.4;
  } else if (edge.encounter && edge.relation) {
    color = isActive ? '#4a4540' : '#9a9088'; dash = undefined; width = isActive ? 2.4 : 1.6;
  } else if (edge.encounter) {
    color = isActive ? '#4a7fbd' : '#8ab0d8'; dash = '6 3'; width = isActive ? 1.8 : 1.1;
  } else {
    color = isActive ? '#b8964e' : '#c8a856'; dash = undefined; width = isActive ? 1.8 : 1.1;
  }
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return (
    <BaseEdge path={edgePath} style={{
      stroke: color, strokeWidth: width, strokeDasharray: dash,
      opacity: isDimmed ? 0.04 : (highlightedSlugs ? 1 : 0.2),
      transition: 'opacity 0.18s, stroke 0.18s',
    }} />
  );
}

const nodeTypes = { character: CharacterNode };
const edgeTypes = { relation: RelationEdge };

// ─── Shared UI pieces ─────────────────────────────────────────────────────────
function StatChip({ label, value, tone }) {
  const bg  = tone === 'accent' ? 'var(--accent-soft)' : tone === 'warning' ? '#fff4eb' : 'var(--surface-2)';
  const col = tone === 'accent' ? 'var(--accent)'      : tone === 'warning' ? '#9a3412' : 'var(--text-2)';
  return (
    <div style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: bg, minWidth: 80 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: col }}>{label}</div>
    </div>
  );
}

function CollapsibleSection({ title, count, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen !== false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: open ? 8 : 0, cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: 9, color: 'var(--text-3)', display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>&#9654;</span>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)' }}>{title}</span>
        {count != null && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>({count})</span>}
      </div>
      {open && children}
    </div>
  );
}

function PartnerRow({ character, statuses, onFocus, onOpenEditor, onEncounterAction, encounterLabel }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: character.hue, flexShrink: 0, marginTop: 3 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{character.role}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{character.arcana}</div>
          {statuses?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
              {statuses.map(s => <span key={s} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, border: '1px solid var(--border)', background: s.includes('no enc') ? '#fff4eb' : 'var(--surface-2)', color: s.includes('no enc') ? '#9a3412' : 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s}</span>)}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onFocus}>Focus</button>
        <button className="btn btn-ghost btn-sm" onClick={onOpenEditor}>Editor</button>
        {onEncounterAction && <button className="btn btn-primary btn-sm" onClick={onEncounterAction}>{encounterLabel}</button>}
      </div>
    </div>
  );
}

// ─── Inner graph (needs ReactFlowProvider ancestor) ───────────────────────────
function GraphInner({
  characters, encounters,
  selectedCharacterSlug,
  graphState, onGraphStateChange,
  onOpenCharacter, onOpenEncounter, onCreateEncounter, showToast,
}) {
  const [pinnedSlug,  setPinnedSlug]  = useState(null);
  const [compareSlug, setCompareSlug] = useState(null);
  const [hoveredSlug, setHoveredSlug] = useState(null);

  function updateGraphState(updater) {
    onGraphStateChange(cur => typeof updater === 'function' ? updater(cur) : updater);
  }

  const bySlug = useMemo(() => new Map(characters.map(c => [c.slug, c])), [characters]);
  const gaps   = useMemo(() => computeGraphGaps(characters), [characters]);
  const gapMap = useMemo(() => new Map(gaps.map(g => [g.slug, g])), [gaps]);

  const { allEdges, encountersByPair } = useMemo(() => {
    const pairMap = new Map();
    const slugSet = new Set(characters.map(c => c.slug));
    characters.forEach(c => {
      (c.relations || []).forEach(target => {
        if (!slugSet.has(target) || target === c.slug) return;
        const key = pairKey(c.slug, target);
        const [src, tgt] = [c.slug, target].sort();
        const e = pairMap.get(key) || { source: src, target: tgt, relation: false, encounter: false, encounterId: null, encounterTitle: null };
        e.relation = true;
        pairMap.set(key, e);
      });
    });
    encounters.forEach(enc => {
      const parts = encounterParticipants(enc).filter(s => slugSet.has(s));
      if (parts.length < 2) return;
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
        if (parts[i] === parts[j]) continue;
        const key = pairKey(parts[i], parts[j]);
        const [src, tgt] = [parts[i], parts[j]].sort();
        const e = pairMap.get(key) || { source: src, target: tgt, relation: false, encounter: false, encounterId: null, encounterTitle: null };
        e.encounter = true;
        e.encounterId = e.encounterId || enc.id;
        e.encounterTitle = e.encounterTitle || enc.title || enc.id;
        pairMap.set(key, e);
      }
    });
    const allEdges = Array.from(pairMap.values()).map(e => ({
      ...e, kind: e.relation && e.encounter ? 'both' : e.relation ? 'relation' : 'encounter', mismatch: e.relation !== e.encounter,
    }));
    const encMap = new Map();
    encounters.forEach(enc => {
      const parts = encounterParticipants(enc);
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
        const key = pairKey(parts[i], parts[j]);
        if (!encMap.has(key)) encMap.set(key, enc);
      }
    });
    return { allEdges, encountersByPair: encMap };
  }, [characters, encounters]);

  const analysisBySlug = useMemo(() => {
    const m = new Map();
    characters.forEach(c => {
      const declared = (c.relations || []).filter(s => bySlug.has(s));
      const referencedBy = characters.filter(o => o.slug !== c.slug && o.relations?.includes(c.slug)).map(o => o.slug);
      const encPartners = allEdges.filter(e => e.encounter && (e.source === c.slug || e.target === c.slug)).map(e => e.source === c.slug ? e.target : e.source);
      m.set(c.slug, {
        declared, referencedBy, encounterPartners: encPartners,
        missingEncounterPartners: declared.filter(s => !encPartners.includes(s)),
        encounterOnlyPartners: encPartners.filter(s => !declared.includes(s)),
        oneWayOutgoing: declared.filter(s => !bySlug.get(s)?.relations?.includes(c.slug)),
        oneWayIncoming: referencedBy.filter(s => !declared.includes(s)),
      });
    });
    return m;
  }, [bySlug, characters, allEdges]);

  const matchesIssueFilter = useCallback((slug) => {
    const a = analysisBySlug.get(slug);
    const g = gapMap.get(slug);
    const conn = (a?.declared.length || 0) + (a?.encounterOnlyPartners.length || 0);
    switch (graphState.issueFilter) {
      case 'content':   return Boolean(g);
      case 'coverage':  return Boolean(a?.missingEncounterPartners.length || a?.encounterOnlyPartners.length);
      case 'asymmetry': return Boolean(a?.oneWayOutgoing.length || a?.oneWayIncoming.length);
      case 'isolated':  return conn === 0;
      default: return true;
    }
  }, [analysisBySlug, gapMap, graphState.issueFilter]);

  const visibleCharacters = useMemo(() =>
    characters.filter(c => (!graphState.tierFilter || c.tier === graphState.tierFilter) && matchesIssueFilter(c.slug)),
    [characters, graphState.tierFilter, matchesIssueFilter]);

  const visibleSlugs = useMemo(() => new Set(visibleCharacters.map(c => c.slug)), [visibleCharacters]);

  const tiersPresent = useMemo(() => new Set(visibleCharacters.map(c => c.tier)), [visibleCharacters]);

  const visibleEdges = useMemo(() => allEdges.filter(e => {
    if (!visibleSlugs.has(e.source) || !visibleSlugs.has(e.target)) return false;
    if (graphState.edgeMode === 'relations')  return e.relation;
    if (graphState.edgeMode === 'encounters') return e.encounter;
    if (graphState.edgeMode === 'mismatches') return e.mismatch;
    return true;
  }), [allEdges, graphState.edgeMode, visibleSlugs]);

  const visibleAdjacency = useMemo(() => buildAdjacency(visibleEdges), [visibleEdges]);

  const totalConnections = useMemo(() => {
    const cnt = {};
    allEdges.forEach(e => { cnt[e.source] = (cnt[e.source] || 0) + 1; cnt[e.target] = (cnt[e.target] || 0) + 1; });
    return cnt;
  }, [allEdges]);

  // Initial layout — compute once from visible chars
  const initialLayout = useMemo(() => computeLayout(visibleCharacters), []);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(
    visibleCharacters.map(c => {
      const pos = initialLayout[c.slug] || { x: 0, y: 0 };
      return { id: c.slug, type: 'character', position: { x: pos.x, y: pos.y }, data: { character: c, gapCount: gapMap.get(c.slug)?.issues.length || 0, connectionCount: totalConnections[c.slug] || 0 } };
    })
  );

  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(
    visibleEdges.map(e => ({ id: e.source + '--' + e.target, source: e.source, target: e.target, type: 'relation', data: { edge: e } }))
  );

  // Keep nodes/edges in sync when filters change
  useEffect(() => {
    const layout = computeLayout(visibleCharacters);
    setRfNodes(visibleCharacters.map(c => {
      const pos = layout[c.slug] || { x: 0, y: 0 };
      return { id: c.slug, type: 'character', position: pos, data: { character: c, gapCount: gapMap.get(c.slug)?.issues.length || 0, connectionCount: totalConnections[c.slug] || 0 } };
    }));
  }, [visibleCharacters, gapMap, totalConnections]); // eslint-disable-line

  useEffect(() => {
    setRfEdges(visibleEdges.map(e => ({ id: e.source + '--' + e.target, source: e.source, target: e.target, type: 'relation', data: { edge: e } })));
  }, [visibleEdges]); // eslint-disable-line

  // Highlight
  const highlightedSlugs = useMemo(() => {
    const seeds = [pinnedSlug, compareSlug, hoveredSlug].filter(Boolean);
    if (!seeds.length) return null;
    return collectNeighborhood(seeds, visibleAdjacency, graphState.neighborhoodDepth);
  }, [pinnedSlug, compareSlug, hoveredSlug, visibleAdjacency, graphState.neighborhoodDepth]);

  const ctxValue = useMemo(() => ({ highlightedSlugs, pinnedSlug, compareSlug, edgeMode: graphState.edgeMode }), [highlightedSlugs, pinnedSlug, compareSlug, graphState.edgeMode]);

  // Handlers
  function handleNodeClick(_e, node) {
    if (pinnedSlug === node.id) { setPinnedSlug(null); setCompareSlug(null); }
    else { setPinnedSlug(node.id); setCompareSlug(null); }
  }
  function handlePaneClick()            { setPinnedSlug(null); setCompareSlug(null); setHoveredSlug(null); }
  function handleNodeMouseEnter(_e, n)  { setHoveredSlug(n.id); }
  function handleNodeMouseLeave()       { setHoveredSlug(null); }

  async function handleEncounterAction(slugA, slugB) {
    const existing = encountersByPair.get(pairKey(slugA, slugB));
    if (existing) { onOpenEncounter(existing.id); return; }
    const result = await onCreateEncounter(slugA, slugB);
    if (!result && showToast) showToast('Unable to create encounter', 'error');
  }

  // Inspector data
  const pinnedCharacter  = pinnedSlug  ? bySlug.get(pinnedSlug)  : null;
  const compareCharacter = compareSlug ? bySlug.get(compareSlug) : null;
  const hoveredCharacter = !pinnedCharacter && hoveredSlug ? bySlug.get(hoveredSlug) : null;
  const pinnedAnalysis   = pinnedCharacter ? analysisBySlug.get(pinnedCharacter.slug) : null;
  const pinnedGap        = pinnedCharacter ? gapMap.get(pinnedCharacter.slug) : null;
  const pairEdge         = pinnedCharacter && compareCharacter ? allEdges.find(e => pairKey(e.source, e.target) === pairKey(pinnedCharacter.slug, compareCharacter.slug)) : null;
  const sharedNeighbors  = pinnedCharacter && compareCharacter
    ? [...(visibleAdjacency.get(pinnedCharacter.slug) || new Set())]
        .filter(s => s !== compareCharacter.slug && (visibleAdjacency.get(compareCharacter.slug) || new Set()).has(s))
        .map(s => bySlug.get(s)).filter(Boolean)
    : [];
  const issueCount = gaps.filter(g => g.issues.some(i => !i.startsWith('broken-relations'))).length;

  const inspector = !pinnedCharacter ? (
    <div style={{ width: 340, borderLeft: '1px solid var(--border)', background: 'var(--surface)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Graph</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16 }}>
        Hover to preview connections.<br />Click to inspect a character.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatChip label="Characters" value={characters.length} />
        <StatChip label="Relations" value={allEdges.filter(e => e.relation).length} tone="accent" />
        <StatChip label="Encounters" value={allEdges.filter(e => e.encounter).length} />
        {issueCount > 0 && <StatChip label="Issues" value={issueCount} tone="warning" />}
      </div>
      {hoveredCharacter && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: hoveredCharacter.hue, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{hoveredCharacter.role}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{hoveredCharacter.arcana}</div>
            </div>
          </div>
          {hoveredCharacter.essence && <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>{hoveredCharacter.essence}</p>}
        </div>
      )}
    </div>
  ) : (
    <div style={{ width: 340, borderLeft: '1px solid var(--border)', background: 'var(--surface)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: pinnedCharacter.hue, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{pinnedCharacter.role}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{pinnedCharacter.arcana}{pinnedCharacter.name ? ' · ' + pinnedCharacter.name : ''}</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => { setPinnedSlug(null); setCompareSlug(null); }}>×</button>
      </div>
      {pinnedCharacter.essence && <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, fontStyle: 'italic', margin: '0 0 12px' }}>{pinnedCharacter.essence}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <StatChip label="Relations" value={pinnedAnalysis?.declared.length || 0} tone="accent" />
        <StatChip label="Encounters" value={pinnedAnalysis?.encounterPartners.length || 0} />
        {(pinnedGap?.issues.length || 0) > 0 && <StatChip label="Issues" value={pinnedGap.issues.length} tone="warning" />}
      </div>
      <button className="btn btn-primary btn-sm" style={{ marginBottom: 16 }} onClick={() => onOpenCharacter(pinnedCharacter.slug)}>Open Editor</button>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        {compareCharacter && (
          <CollapsibleSection title="Comparing with">
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--surface-2)', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: compareCharacter.hue }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{compareCharacter.role}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {pairEdge ? (pairEdge.relation ? 'relation' : '') + (pairEdge.encounter ? (pairEdge.relation ? ' + ' : '') + 'encounter' : '') : 'no direct link'}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => setCompareSlug(null)}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setPinnedSlug(compareCharacter.slug); setCompareSlug(null); }}>Focus</button>
                <button className="btn btn-primary btn-sm" onClick={() => handleEncounterAction(pinnedCharacter.slug, compareCharacter.slug)}>
                  {pairEdge?.encounter ? 'Open Encounter' : 'Create Encounter'}
                </button>
              </div>
              {sharedNeighbors.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>Shared: {sharedNeighbors.map(c => c.role).join(', ')}</div>}
            </div>
          </CollapsibleSection>
        )}
        {pinnedGap && (
          <CollapsibleSection title="Content gaps" count={pinnedGap.issues.length} defaultOpen={pinnedGap.issues.length <= 5}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {pinnedGap.issues.map(i => <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, border: '1px solid #f2d7bf', background: '#fff4eb', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '.05em' }}>{issueLabel(i)}</span>)}
            </div>
          </CollapsibleSection>
        )}
        {(pinnedAnalysis?.declared.length || 0) > 0 && (
          <CollapsibleSection title="Relations" count={pinnedAnalysis.declared.length}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pinnedAnalysis.declared.map(slug => {
                const partner = bySlug.get(slug); if (!partner) return null;
                const statuses = [];
                if (pinnedAnalysis.encounterPartners.includes(slug))        statuses.push('encounter');
                if (pinnedAnalysis.missingEncounterPartners.includes(slug)) statuses.push('no encounter');
                if (pinnedAnalysis.oneWayOutgoing.includes(slug))           statuses.push('one-way');
                return <PartnerRow key={slug} character={partner} statuses={statuses}
                  onFocus={() => { setPinnedSlug(slug); setCompareSlug(null); }}
                  onOpenEditor={() => onOpenCharacter(slug)}
                  onEncounterAction={() => handleEncounterAction(pinnedCharacter.slug, slug)}
                  encounterLabel={encountersByPair.get(pairKey(pinnedCharacter.slug, slug)) ? 'Open Encounter' : 'Create Encounter'}
                />;
              })}
            </div>
          </CollapsibleSection>
        )}
        {(pinnedAnalysis?.missingEncounterPartners.length || 0) > 0 && (
          <CollapsibleSection title="Missing encounters" count={pinnedAnalysis.missingEncounterPartners.length} defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pinnedAnalysis.missingEncounterPartners.map(slug => {
                const p = bySlug.get(slug); if (!p) return null;
                return <PartnerRow key={slug} character={p} statuses={['no encounter']}
                  onFocus={() => { setPinnedSlug(slug); setCompareSlug(null); }}
                  onOpenEditor={() => onOpenCharacter(slug)}
                  onEncounterAction={() => handleEncounterAction(pinnedCharacter.slug, slug)}
                  encounterLabel="Create Encounter"
                />;
              })}
            </div>
          </CollapsibleSection>
        )}
        {(pinnedAnalysis?.oneWayIncoming.length || 0) > 0 && (
          <CollapsibleSection title="Reverse references" count={pinnedAnalysis.oneWayIncoming.length} defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pinnedAnalysis.oneWayIncoming.map(slug => {
                const p = bySlug.get(slug); if (!p) return null;
                return <PartnerRow key={slug} character={p} statuses={['incoming only']}
                  onFocus={() => { setPinnedSlug(slug); setCompareSlug(null); }}
                  onOpenEditor={() => onOpenCharacter(slug)}
                />;
              })}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );

  return (
    <GraphContext.Provider value={ctxValue}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '7px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 14, borderRight: '1px solid var(--border)', marginRight: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Tier</span>
            <button className={'btn btn-sm ' + (!graphState.tierFilter ? 'btn-primary' : 'btn-ghost')} onClick={() => updateGraphState(s => ({ ...s, tierFilter: null }))}>All</button>
            {TIER_ORDER.map(t => <button key={t} className={'btn btn-sm ' + (graphState.tierFilter === t ? 'btn-primary' : 'btn-ghost')} onClick={() => updateGraphState(s => ({ ...s, tierFilter: s.tierFilter === t ? null : t }))}>{TIER_META[t].label}</button>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 14, borderRight: '1px solid var(--border)', marginRight: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Edges</span>
            {EDGE_MODES.map(m => <button key={m.id} className={'btn btn-sm ' + (graphState.edgeMode === m.id ? 'btn-primary' : 'btn-ghost')} onClick={() => updateGraphState(s => ({ ...s, edgeMode: m.id }))}>{m.label}</button>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 14, borderRight: '1px solid var(--border)', marginRight: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Filter</span>
            <select className="field-input" style={{ fontSize: 12, paddingTop: 3, paddingBottom: 3, background: 'var(--surface)', width: 140 }} value={graphState.issueFilter} onChange={e => updateGraphState(s => ({ ...s, issueFilter: e.target.value }))}>
              {ISSUE_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Depth</span>
            {[1, 2].map(d => <button key={d} className={'btn btn-sm ' + (graphState.neighborhoodDepth === d ? 'btn-primary' : 'btn-ghost')} onClick={() => updateGraphState(s => ({ ...s, neighborhoodDepth: d }))}>{d}</button>)}
            <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>{visibleCharacters.length} nodes · {visibleEdges.length} edges</span>
          </div>
        </div>

        {/* Graph + Inspector */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              onNodeMouseEnter={handleNodeMouseEnter}
              onNodeMouseLeave={handleNodeMouseLeave}
              nodeOrigin={[0.5, 0.5]}
              fitView
              minZoom={0.3}
              maxZoom={2.5}
              elementsSelectable={false}
              selectNodesOnDrag={false}
              selectionOnDrag={false}
              style={{ background: '#f8f8f6' }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#d8d4cc" gap={28} size={1} variant="dots" />
              <TierRings tiersPresent={tiersPresent} />
              <Controls showInteractive={false} style={{ bottom: 14, left: 14 }} />
              <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(255,255,253,0.93)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', fontSize: 11, backdropFilter: 'blur(6px)', pointerEvents: 'none', zIndex: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 7 }}>Edges</div>
                {EDGE_LEGEND.map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <svg width={26} height={6} style={{ flexShrink: 0 }}><line x1={0} y1={3} x2={26} y2={3} stroke={item.color} strokeWidth={1.8} strokeDasharray={item.dash} /></svg>
                    <span style={{ color: 'var(--text-2)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </ReactFlow>
          </div>
          {inspector}
        </div>
      </div>
    </GraphContext.Provider>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function GraphView(props) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}
