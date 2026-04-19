import React, { useState, useEffect, useRef } from 'react';

export default function EncounterPanel({ encounterId, allCharacters, onSave, onDelete }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const autoSaveRef = useRef(null);

  useEffect(() => {
    fetch(`/api/encounters/${encounterId}`)
      .then(r => r.json())
      .then(d => setDraft(d));
  }, [encounterId]);

  function set(key, val) {
    setDraft(d => ({ ...d, [key]: val }));
    schedule();
  }

  function schedule() {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(save, 3000);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  }

  useEffect(() => () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); }, []);

  if (!draft) return <div className="empty"><p>Loading…</p></div>;

  const charA = allCharacters.find(c => c.slug === draft.slugA);
  const charB = allCharacters.find(c => c.slug === draft.slugB);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {charA && <div style={{ width: 28, height: 28, borderRadius: 6, background: charA.hue }} title={charA.role} />}
          <span style={{ fontSize: 14, color: 'var(--text-3)' }}>⟷</span>
          {charB && <div style={{ width: 28, height: 28, borderRadius: 6, background: charB.hue }} title={charB.role} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{charA?.role} & {charB?.role}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Encounter</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {saving && <span style={{ fontSize: 12, color: 'var(--accent)' }}>Saving…</span>}
          <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
          <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete this encounter?')) onDelete(); }}>Delete</button>
        </div>
      </div>
      <div className="editor-area">
        <div className="field">
          <div className="field-label">Title</div>
          <input className="field-input" value={draft.title || ''} onChange={e => set('title', e.target.value)} placeholder="A title for this encounter…" />
        </div>
        <div className="field">
          <div className="field-label">Notes / narrative</div>
          <textarea
            className="field-textarea large"
            style={{ minHeight: 480 }}
            value={draft.body || ''}
            onChange={e => set('body', e.target.value)}
            placeholder={`What happened between ${charA?.role || draft.slugA} and ${charB?.role || draft.slugB}?\n\nWrite freely — this is source material for coherence checks and future lore.`}
          />
        </div>
      </div>
    </div>
  );
}
