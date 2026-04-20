import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import CharacterEditor from './components/CharacterEditor.jsx';
import EncounterPanel from './components/EncounterPanel.jsx';
import LorePanel from './components/LorePanel.jsx';
import GraphView from './components/GraphView.jsx';
import CmdPalette from './components/CmdPalette.jsx';
import Dashboard from './components/Dashboard.jsx';

const API = '/api';

const DEFAULT_GRAPH_STATE = {
  pinnedSlug: null,
  compareSlug: null,
  tierFilter: null,
  edgeMode: 'all',
  neighborhoodDepth: 1,
  issueFilter: 'all',
};

export default function App() {
  const [characters, setCharacters] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [lore, setLore] = useState([]);
  const [selected, setSelected] = useState(null); // { type: 'character'|'encounter'|'lore', id }
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [view, setView] = useState('editor'); // 'editor' | 'graph' | 'dashboard'
  const [syncing, setSyncing] = useState(false);
  const [graphState, setGraphState] = useState(DEFAULT_GRAPH_STATE);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [chars, encs, loreItems] = await Promise.all([
        fetch(`${API}/characters`).then(r => r.json()),
        fetch(`${API}/encounters`).then(r => r.json()),
        fetch(`${API}/lore`).then(r => r.json()),
      ]);
      setCharacters(chars);
      setEncounters(encs);
      setLore(loreItems);
      if (!selected && chars.length) setSelected({ type: 'character', id: chars[0].slug });
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const validSlugs = new Set(characters.map(c => c.slug));
    setGraphState(state => {
      const pinnedSlug = validSlugs.has(state.pinnedSlug) ? state.pinnedSlug : null;
      const compareSlug = validSlugs.has(state.compareSlug) && state.compareSlug !== pinnedSlug ? state.compareSlug : null;
      if (pinnedSlug === state.pinnedSlug && compareSlug === state.compareSlug) return state;
      return { ...state, pinnedSlug, compareSlug };
    });
  }, [characters]);

  useEffect(() => {
    if (view !== 'graph') return;
    if (selected?.type !== 'character') return;
    setGraphState(state => state.pinnedSlug ? state : { ...state, pinnedSlug: selected.id });
  }, [view, selected]);

  // Cmd+K to open palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(p => !p); }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const r = await fetch(`${API}/sync`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) showToast('Synced → characters.js rebuilt');
      else showToast(d.error || 'Sync failed', 'error');
    } catch { showToast('Sync failed', 'error'); }
    setSyncing(false);
  }

  async function handleCreateEncounter(slugA, slugB, { openAfterCreate = true } = {}) {
    try {
      const r = await fetch(`${API}/encounters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugA, slugB }),
      });
      const d = await r.json();
      if (!r.ok || !d?.id) {
        showToast(d?.error || 'Failed to create encounter', 'error');
        return null;
      }
      await loadAll();
      if (openAfterCreate) {
        setSelected({ type: 'encounter', id: d.id });
        setView('editor');
      }
      return d;
    } catch {
      showToast('Failed to create encounter', 'error');
      return null;
    }
  }

  async function handleCreateLore(title) {
    try {
      const r = await fetch(`${API}/lore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const d = await r.json();
      if (!r.ok || !d?.id) {
        showToast(d?.error || 'Failed to create lore', 'error');
        return null;
      }
      await loadAll();
      setSelected({ type: 'lore', id: d.id });
      return d;
    } catch {
      showToast('Failed to create lore', 'error');
      return null;
    }
  }

  const selectedChar = selected?.type === 'character'
    ? characters.find(c => c.slug === selected.id)
    : null;

  return (
    <div className="layout">
      <Sidebar
        characters={characters}
        encounters={encounters}
        lore={lore}
        selected={selected}
        onSelect={setSelected}
        onNewEncounter={handleCreateEncounter}
        onNewLore={handleCreateLore}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      <div className="main">
        <div className="topbar">
          <div className="topbar-breadcrumb">
            UC Studio
            {selected && <> › <span>{selected.type === 'character' ? selectedChar?.role : selected.id}</span></>}
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setView(v => v === 'dashboard' ? 'editor' : 'dashboard')}>
              {view === 'dashboard' ? '← Editor' : 'Agents'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setView(v => v === 'graph' ? 'editor' : 'graph')}>
              {view === 'graph' ? '← Editor' : 'Graph'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleSync} disabled={syncing}>
              {syncing ? 'Syncing…' : '⟳ Sync'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPaletteOpen(true)}>⌘K</button>
          </div>
        </div>

        {loading ? (
          <div className="empty"><p>Loading…</p></div>
        ) : view === 'dashboard' ? (
          <Dashboard
            characters={characters}
            encounters={encounters}
            lore={lore}
            showToast={showToast}
            onRefresh={loadAll}
          />
        ) : view === 'graph' ? (
          <GraphView
            characters={characters}
            encounters={encounters}
            selectedCharacterSlug={selected?.type === 'character' ? selected.id : null}
            graphState={graphState}
            onGraphStateChange={setGraphState}
            onOpenCharacter={slug => {
              setSelected({ type: 'character', id: slug });
              setView('editor');
            }}
            onOpenEncounter={encounterId => {
              setSelected({ type: 'encounter', id: encounterId });
              setView('editor');
            }}
            onCreateEncounter={handleCreateEncounter}
            showToast={showToast}
          />
        ) : selected?.type === 'character' ? (
          <CharacterEditor
            key={selected.id}
            character={selectedChar}
            allCharacters={characters}
            onSave={async (data) => {
              const r = await fetch(`${API}/characters/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
              if (r.ok) { showToast('Saved'); }
              else showToast('Save failed', 'error');
            }}
            onNavigate={slug => setSelected({ type: 'character', id: slug })}
            showToast={showToast}
          />
        ) : selected?.type === 'encounter' ? (
          <EncounterPanel
            key={selected.id}
            encounterId={selected.id}
            allCharacters={characters}
            onSave={async (data) => {
              const r = await fetch(`${API}/encounters/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
              if (r.ok) { showToast('Saved'); }
              else showToast('Save failed', 'error');
            }}
            onDelete={async () => {
              await fetch(`${API}/encounters/${selected.id}`, { method: 'DELETE' });
              await loadAll();
              setSelected(null);
            }}
          />
        ) : selected?.type === 'lore' ? (
          <LorePanel
            key={selected.id}
            loreId={selected.id}
            onSave={async (data) => {
              const r = await fetch(`${API}/lore/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
              if (r.ok) { showToast('Saved'); }
              else showToast('Save failed', 'error');
            }}
            onDelete={async () => {
              await fetch(`${API}/lore/${selected.id}`, { method: 'DELETE' });
              await loadAll();
              setSelected(null);
            }}
          />
        ) : (
          <div className="empty"><h3>Select an item</h3><p>Choose a character, encounter, or lore entry from the sidebar.</p></div>
        )}
      </div>

      {paletteOpen && (
        <CmdPalette
          characters={characters}
          encounters={encounters}
          lore={lore}
          onSelect={(sel) => { setSelected(sel); setPaletteOpen(false); }}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      {toast && <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.msg}</div>}
    </div>
  );
}
