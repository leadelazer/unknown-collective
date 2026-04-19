import React, { useMemo, useState } from 'react';

const W = 1000, H = 640;

// Tier ordering from center out
const TIER_RINGS = {
  guides:     { r: 90,  color: '#fce4ec', label: 'Guides' },
  luminaries: { r: 195, color: '#f3e5f5', label: 'Luminaries' },
  guardians:  { r: 290, color: '#e3f2fd', label: 'Guardians' },
  custodians: { r: 380, color: '#fff3e0', label: 'Custodians' },
  grounded:   { r: 465, color: '#e8f5e9', label: 'Grounded' },
};

function buildLayout(characters) {
  const byTier = {};
  characters.forEach(c => {
    if (!byTier[c.tier]) byTier[c.tier] = [];
    byTier[c.tier].push(c);
  });

  const positions = {};
  Object.entries(TIER_RINGS).forEach(([tier, { r }]) => {
    const chars = byTier[tier] || [];
    chars.forEach((c, i) => {
      const angle = (i / chars.length) * 2 * Math.PI - Math.PI / 2;
      positions[c.slug] = {
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
      };
    });
  });
  return positions;
}

export default function GraphView({ characters, selected, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const [tierFilter, setTierFilter] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const positions = useMemo(() => buildLayout(characters), [characters.length]);

  // Build unique links
  const links = useMemo(() => {
    const seen = new Set();
    const result = [];
    characters.forEach(c => {
      (c.relations || []).forEach(target => {
        if (!characters.find(x => x.slug === target)) return;
        const key = [c.slug, target].sort().join('--');
        if (!seen.has(key)) { seen.add(key); result.push({ source: c.slug, target }); }
      });
    });
    return result;
  }, [characters]);

  // Connection count per character
  const connCount = useMemo(() => {
    const count = {};
    links.forEach(l => {
      count[l.source] = (count[l.source] || 0) + 1;
      count[l.target] = (count[l.target] || 0) + 1;
    });
    return count;
  }, [links]);

  const activeSlug = hovered || (selected?.type === 'character' ? selected.id : null);
  const activeChar = activeSlug ? characters.find(c => c.slug === activeSlug) : null;

  const connectedTo = useMemo(() => {
    if (!activeSlug) return new Set();
    const s = new Set([activeSlug]);
    links.forEach(l => {
      if (l.source === activeSlug) s.add(l.target);
      if (l.target === activeSlug) s.add(l.source);
    });
    return s;
  }, [activeSlug, links]);

  const filteredChars = tierFilter ? characters.filter(c => c.tier === tierFilter) : characters;
  const filteredSlugs = new Set(filteredChars.map(c => c.slug));

  const nodeRadius = (c) => {
    const base = 18;
    const bonus = Math.min((connCount[c.slug] || 0) * 1.5, 8);
    return base + bonus;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 4 }}>Filter:</span>
        <button
          className={`btn btn-sm ${!tierFilter ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTierFilter(null)}
        >All</button>
        {Object.entries(TIER_RINGS).map(([tier, { label }]) => (
          <button
            key={tier}
            className={`btn btn-sm ${tierFilter === tier ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTierFilter(t => t === tier ? null : tier)}
          >{label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
          {links.length} connections · hover to explore
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SVG graph */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ flex: 1, height: '100%', background: '#fafaf8' }}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Tier ring backgrounds */}
          {Object.entries(TIER_RINGS).reverse().map(([tier, { r, color }]) => (
            <circle
              key={tier}
              cx={W / 2} cy={H / 2} r={r + 40}
              fill={color}
              opacity={tierFilter && tierFilter !== tier ? 0.15 : 0.4}
            />
          ))}

          {/* Tier labels */}
          {Object.entries(TIER_RINGS).map(([tier, { r, label }]) => (
            <text
              key={tier}
              x={W / 2}
              y={H / 2 - r - 28}
              textAnchor="middle"
              fontSize={10}
              fill="#aaa"
              fontFamily="Inter, sans-serif"
              fontWeight={600}
              letterSpacing={1}
              textTransform="uppercase"
            >{label.toUpperCase()}</text>
          ))}

          {/* Links */}
          {links.map(l => {
            const sp = positions[l.source], tp = positions[l.target];
            if (!sp || !tp) return null;
            if (!filteredSlugs.has(l.source) || !filteredSlugs.has(l.target)) return null;
            const isActive = activeSlug && connectedTo.has(l.source) && connectedTo.has(l.target);
            return (
              <line
                key={`${l.source}--${l.target}`}
                x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y}
                stroke={isActive ? 'var(--accent)' : '#c8c0b4'}
                strokeWidth={isActive ? 2 : 0.8}
                opacity={activeSlug && !isActive ? 0.1 : isActive ? 0.9 : 0.4}
              />
            );
          })}

          {/* Nodes */}
          {characters.map(c => {
            const pos = positions[c.slug];
            if (!pos || !filteredSlugs.has(c.slug)) return null;
            const isSelected = selected?.type === 'character' && selected.id === c.slug;
            const isHovered = hovered === c.slug;
            const isConnected = connectedTo.has(c.slug);
            const dimmed = activeSlug && !isConnected;
            const r = nodeRadius(c);

            return (
              <g
                key={c.slug}
                transform={`translate(${pos.x},${pos.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(c.slug)}
                onMouseEnter={() => setHovered(c.slug)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle r={r + 6} fill="none" stroke="var(--text)" strokeWidth={2} />
                )}
                {/* Hover ring */}
                {isHovered && !isSelected && (
                  <circle r={r + 4} fill="none" stroke={c.hue} strokeWidth={1.5} opacity={0.5} />
                )}
                <circle
                  r={r}
                  fill={c.hue}
                  opacity={dimmed ? 0.2 : 1}
                  stroke="white"
                  strokeWidth={1.5}
                />
                {/* Arcana number */}
                <text
                  textAnchor="middle"
                  dy={4}
                  fontSize={10}
                  fill="white"
                  fontFamily="Inter, sans-serif"
                  fontWeight={700}
                  opacity={dimmed ? 0.3 : 1}
                >{c.n}</text>
                {/* Role label */}
                <text
                  textAnchor="middle"
                  dy={r + 13}
                  fontSize={isSelected || isHovered ? 11 : 10}
                  fontWeight={isSelected ? 700 : isConnected ? 500 : 400}
                  fill={isSelected ? 'var(--text)' : 'var(--text-2)'}
                  fontFamily="Inter, sans-serif"
                  opacity={dimmed ? 0.25 : 1}
                >{c.role?.replace('The ', '')}</text>
              </g>
            );
          })}
        </svg>

        {/* Side panel — active character info */}
        {activeChar && (
          <div style={{
            width: 220,
            borderLeft: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flexShrink: 0,
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: activeChar.hue }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{activeChar.role}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{activeChar.arcana}</div>
              </div>
            </div>
            {activeChar.name && (
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{activeChar.name}</div>
            )}
            {activeChar.essence && (
              <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-2)', lineHeight: 1.5 }}>{activeChar.essence}</div>
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Keywords</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(activeChar.keywords || []).map(k => (
                  <span key={k} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 100, color: 'var(--text-2)' }}>{k}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>
                Connected to ({(activeChar.relations || []).length})
              </div>
              {(activeChar.relations || []).map(slug => {
                const rc = characters.find(c => c.slug === slug);
                return rc ? (
                  <div
                    key={slug}
                    onClick={() => onSelect(slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 12, color: 'var(--text-2)' }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: rc.hue, flexShrink: 0 }} />
                    {rc.role}
                  </div>
                ) : null;
              })}
            </div>
            <div style={{ marginTop: 'auto' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%' }}
                onClick={() => onSelect(activeChar.slug)}
              >Open Editor →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
