import React, { useState } from 'react';

const TIERS = ['guides', 'luminaries', 'guardians', 'custodians', 'grounded'];
const TIER_ORDER = { guides: 0, luminaries: 1, guardians: 2, custodians: 3, grounded: 4 };

export default function Sidebar({ characters, encounters, lore, selected, onSelect, onNewEncounter, onNewLore }) {
  const [search, setSearch] = useState('');
  const [newEncSlugA, setNewEncSlugA] = useState('');
  const [newEncSlugB, setNewEncSlugB] = useState('');
  const [showEncForm, setShowEncForm] = useState(false);
  const [newLoreTitle, setNewLoreTitle] = useState('');
  const [showLoreForm, setShowLoreForm] = useState(false);

  const q = search.toLowerCase();
  const filtered = characters.filter(c =>
    !q || c.role?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.arcana?.toLowerCase().includes(q)
  );

  const grouped = TIERS.map(tier => ({
    tier,
    chars: filtered.filter(c => c.tier === tier).sort((a, b) => a.n - b.n),
  })).filter(g => g.chars.length > 0);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">UC Studio</span>
      </div>
      <div className="sidebar-search">
        <input
          placeholder="Search characters…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="sidebar-nav">
        {/* Characters by tier */}
        {grouped.map(({ tier, chars }) => (
          <div key={tier} className="nav-section">
            <div className="nav-section-label">{tier}</div>
            {chars.map(c => (
              <div
                key={c.slug}
                className={`nav-item ${selected?.type === 'character' && selected?.id === c.slug ? 'active' : ''}`}
                onClick={() => onSelect({ type: 'character', id: c.slug })}
              >
                <span className="nav-n">{c.n}</span>
                <span className="nav-dot" style={{ background: c.hue }} />
                <span className="nav-label">{c.role?.replace('The ', '')}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Encounters */}
        <div className="nav-section">
          <div className="nav-section-label">Encounters</div>
          {encounters.map(e => (
            <div
              key={e.id}
              className={`nav-item ${selected?.type === 'encounter' && selected?.id === e.id ? 'active' : ''}`}
              onClick={() => onSelect({ type: 'encounter', id: e.id })}
            >
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>⟷</span>
              <span className="nav-label">{e.title || e.id}</span>
            </div>
          ))}
          {showEncForm ? (
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <select value={newEncSlugA} onChange={e => setNewEncSlugA(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)' }}>
                <option value="">Character A…</option>
                {characters.map(c => <option key={c.slug} value={c.slug}>{c.role}</option>)}
              </select>
              <select value={newEncSlugB} onChange={e => setNewEncSlugB(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)' }}>
                <option value="">Character B…</option>
                {characters.map(c => <option key={c.slug} value={c.slug}>{c.role}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-primary btn-sm" onClick={() => { if (newEncSlugA && newEncSlugB) { onNewEncounter(newEncSlugA, newEncSlugB); setShowEncForm(false); setNewEncSlugA(''); setNewEncSlugB(''); } }}>Create</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowEncForm(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="nav-add">
              <button onClick={() => setShowEncForm(true)}>+ New Encounter</button>
            </div>
          )}
        </div>

        {/* Lore */}
        <div className="nav-section">
          <div className="nav-section-label">Lore</div>
          {lore.map(l => (
            <div
              key={l.id}
              className={`nav-item ${selected?.type === 'lore' && selected?.id === l.id ? 'active' : ''}`}
              onClick={() => onSelect({ type: 'lore', id: l.id })}
            >
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>◈</span>
              <span className="nav-label">{l.title || l.id}</span>
            </div>
          ))}
          {showLoreForm ? (
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                placeholder="Title…"
                value={newLoreTitle}
                onChange={e => setNewLoreTitle(e.target.value)}
                style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4 }}
                onKeyDown={e => { if (e.key === 'Enter' && newLoreTitle) { onNewLore(newLoreTitle); setShowLoreForm(false); setNewLoreTitle(''); } }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-primary btn-sm" onClick={() => { if (newLoreTitle) { onNewLore(newLoreTitle); setShowLoreForm(false); setNewLoreTitle(''); } }}>Create</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowLoreForm(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="nav-add">
              <button onClick={() => setShowLoreForm(true)}>+ New Lore</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
