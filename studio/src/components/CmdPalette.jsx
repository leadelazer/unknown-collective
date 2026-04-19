import React, { useState, useEffect, useRef } from 'react';

export default function CmdPalette({ characters, encounters, lore, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.toLowerCase();
  const items = [
    ...characters
      .filter(c => !q || c.role?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.arcana?.toLowerCase().includes(q) || c.tier?.toLowerCase().includes(q))
      .map(c => ({ type: 'character', id: c.slug, label: c.role, sub: c.name || c.arcana, dot: c.hue })),
    ...encounters
      .filter(e => !q || e.title?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q))
      .map(e => ({ type: 'encounter', id: e.id, label: e.title || e.id, sub: 'Encounter', dot: null })),
    ...lore
      .filter(l => !q || l.title?.toLowerCase().includes(q) || l.id?.toLowerCase().includes(q))
      .map(l => ({ type: 'lore', id: l.id, label: l.title || l.id, sub: 'Lore', dot: null })),
  ];

  useEffect(() => { setFocused(0); }, [query]);

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, items.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter' && items[focused]) onSelect({ type: items[focused].type, id: items[focused].id });
  }

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="palette-input"
          placeholder="Jump to character, encounter, or lore…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
        />
        <div className="palette-results">
          {items.length === 0 && (
            <div style={{ padding: '16px 18px', color: 'var(--text-3)', fontSize: 13 }}>No results</div>
          )}
          {items.map((item, i) => (
            <div
              key={`${item.type}-${item.id}`}
              className={`palette-item ${i === focused ? 'focused' : ''}`}
              onMouseEnter={() => setFocused(i)}
              onClick={() => onSelect({ type: item.type, id: item.id })}
            >
              {item.dot
                ? <span className="pi-dot" style={{ background: item.dot }} />
                : <span style={{ fontSize: 12, color: 'var(--text-3)', width: 8 }}>{item.type === 'encounter' ? '⟷' : '◈'}</span>
              }
              <span className="pi-role">{item.label}</span>
              {item.sub && <span className="pi-name">{item.sub}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{item.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
