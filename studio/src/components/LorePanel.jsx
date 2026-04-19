import React, { useState, useEffect, useRef } from 'react';

export default function LorePanel({ loreId, onSave, onDelete }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const autoSaveRef = useRef(null);

  useEffect(() => {
    fetch(`/api/lore/${loreId}`)
      .then(r => r.json())
      .then(d => setDraft(d));
  }, [loreId]);

  function set(key, val) {
    setDraft(d => ({ ...d, [key]: val }));
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, color: 'var(--text-3)' }}>◈</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{draft.title || loreId}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Lore</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {saving && <span style={{ fontSize: 12, color: 'var(--accent)' }}>Saving…</span>}
          <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
          <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete this lore entry?')) onDelete(); }}>Delete</button>
        </div>
      </div>
      <div className="editor-area">
        <div className="field">
          <div className="field-label">Title</div>
          <input className="field-input" value={draft.title || ''} onChange={e => set('title', e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label">Content</div>
          <textarea
            className="field-textarea large"
            style={{ minHeight: 520 }}
            value={draft.body || ''}
            onChange={e => set('body', e.target.value)}
            placeholder="Write lore here. Use markdown freely."
          />
        </div>
      </div>
    </div>
  );
}
