import React, { useState, useEffect, useRef } from 'react';

const TABS = ['Overview', 'Bio', 'Talisman', 'Shadow', 'Artifact & Quote', 'Relations', 'Stories'];

export default function CharacterEditor({ character, allCharacters, onSave, onNavigate, showToast }) {
  const [tab, setTab] = useState('Overview');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [relAdd, setRelAdd] = useState('');
  const autoSaveRef = useRef(null);

  useEffect(() => {
    if (character) {
      setDraft({ ...character });
      setDirty(false);
    }
  }, [character]);

  function set(key, val) {
    setDraft(d => ({ ...d, [key]: val }));
    setDirty(true);
    scheduleAutoSave();
  }

  function scheduleAutoSave() {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => save(), 3000);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setDirty(false);
  }

  useEffect(() => () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); }, []);

  if (!draft) return <div className="empty"><p>Loading…</p></div>;

  const otherChars = allCharacters.filter(c => c.slug !== draft.slug);
  const availableRels = otherChars.filter(c => !draft.relations?.includes(c.slug));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Character header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: draft.hue, opacity: .9 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{draft.role}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
            <span>{draft.arcana}</span>
            <span>·</span>
            <span className={`tier-badge tier-${draft.tier}`}>{draft.tier}</span>
            {draft.name && <><span>·</span><span>{draft.name}</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {dirty && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Unsaved</span>}
          {saving && <span style={{ fontSize: 12, color: 'var(--accent)' }}>Saving…</span>}
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>Save</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</div>)}
      </div>

      <div className="editor-area">
        {tab === 'Overview' && (
          <>
            <div className="grid-2">
              <div className="field">
                <div className="field-label">Role</div>
                <input className="field-input" value={draft.role || ''} onChange={e => set('role', e.target.value)} />
              </div>
              <div className="field">
                <div className="field-label">Name</div>
                <input className="field-input" value={draft.name || ''} onChange={e => set('name', e.target.value)} placeholder="Character real name" />
              </div>
            </div>
            <div className="grid-3">
              <div className="field">
                <div className="field-label">Arcana</div>
                <input className="field-input" value={draft.arcana || ''} onChange={e => set('arcana', e.target.value)} />
              </div>
              <div className="field">
                <div className="field-label">Tier</div>
                <select className="field-input" value={draft.tier || ''} onChange={e => set('tier', e.target.value)}>
                  {['grounded', 'custodians', 'guardians', 'luminaries', 'guides'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <div className="field-label">Arcana #</div>
                <input className="field-input" type="number" value={draft.n ?? ''} onChange={e => set('n', parseInt(e.target.value))} />
              </div>
            </div>
            <div className="field">
              <div className="field-label">Essence</div>
              <input className="field-input" value={draft.essence || ''} onChange={e => set('essence', e.target.value)} placeholder="Poetic 1-2 line phrase…" />
            </div>
            <div className="field">
              <div className="field-label">Hue</div>
              <div className="color-row">
                <div className="color-swatch" style={{ background: draft.hue }} />
                <input className="field-input color-input" value={draft.hue || ''} onChange={e => set('hue', e.target.value)} placeholder="#RRGGBB" />
                <input type="color" value={draft.hue || '#888888'} onChange={e => set('hue', e.target.value)} style={{ width: 40, height: 34, border: '1px solid var(--border)', borderRadius: 4, padding: 2, cursor: 'pointer', background: 'var(--surface)' }} />
              </div>
            </div>
            <div className="field">
              <div className="field-label">Keywords (3)</div>
              <div className="keyword-chips">
                {(draft.keywords || []).map((kw, i) => (
                  <span key={kw} className="keyword-chip">
                    {kw}
                    <span className="chip-remove" onClick={() => set('keywords', draft.keywords.filter((_, j) => j !== i))}>×</span>
                  </span>
                ))}
              </div>
              <div className="keyword-input-row">
                <input
                  placeholder="Add keyword…"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && keywordInput.trim()) {
                      set('keywords', [...(draft.keywords || []), keywordInput.trim()]);
                      setKeywordInput('');
                    }
                  }}
                />
                <button onClick={() => { if (keywordInput.trim()) { set('keywords', [...(draft.keywords || []), keywordInput.trim()]); setKeywordInput(''); } }}>Add</button>
              </div>
            </div>
          </>
        )}

        {tab === 'Bio' && (
          <div className="field">
            <div className="field-label">Bio (markdown paragraphs — blank line = new paragraph)</div>
            <textarea
              className="field-textarea large"
              style={{ minHeight: 460, fontFamily: "'JetBrains Mono', monospace" }}
              value={draft.bio || ''}
              onChange={e => set('bio', e.target.value)}
              placeholder="Write bio paragraphs here. Separate paragraphs with a blank line."
            />
          </div>
        )}

        {tab === 'Talisman' && (
          <div className="field">
            <div className="field-label" style={{ color: 'var(--accent)' }}>Talisman quality</div>
            <textarea
              className="field-textarea large"
              style={{ minHeight: 400 }}
              value={draft.talisman || ''}
              onChange={e => set('talisman', e.target.value)}
              placeholder="What does carrying this card as a talisman grant the holder?"
            />
          </div>
        )}

        {tab === 'Shadow' && (
          <div className="field">
            <div className="field-label" style={{ color: '#c0392b' }}>Shadow card</div>
            <textarea
              className="field-textarea large"
              style={{ minHeight: 400 }}
              value={draft.shadow || ''}
              onChange={e => set('shadow', e.target.value)}
              placeholder="What does the shadow side of this card represent?"
            />
          </div>
        )}

        {tab === 'Artifact & Quote' && (
          <>
            <div className="field">
              <div className="field-label">Artifact</div>
              <textarea
                className="field-textarea"
                style={{ minHeight: 120 }}
                value={draft.artifact || ''}
                onChange={e => set('artifact', e.target.value)}
                placeholder="The physical object they carry. Describe it precisely."
              />
            </div>
            <div className="field">
              <div className="field-label">Quote</div>
              <textarea
                className="field-textarea"
                style={{ minHeight: 80 }}
                value={draft.quote || ''}
                onChange={e => set('quote', e.target.value)}
                placeholder="A line of speech that defines them."
              />
            </div>
          </>
        )}

        {tab === 'Relations' && (
          <>
            <div className="field">
              <div className="field-label">Related characters</div>
              <div className="tags">
                {(draft.relations || []).map(slug => {
                  const c = allCharacters.find(x => x.slug === slug);
                  return (
                    <span
                      key={slug}
                      className={`tag ${!c ? 'dead' : ''}`}
                      onClick={() => c && onNavigate(slug)}
                      title={c ? `Go to ${c.role}` : 'Character not found'}
                    >
                      {c?.role || slug}
                      <span className="tag-remove" onClick={e => { e.stopPropagation(); set('relations', (draft.relations || []).filter(r => r !== slug)); }}>×</span>
                    </span>
                  );
                })}
              </div>
              <div className="tag-add">
                <select value={relAdd} onChange={e => setRelAdd(e.target.value)}>
                  <option value="">Add relation…</option>
                  {availableRels.map(c => <option key={c.slug} value={c.slug}>{c.role} — {c.arcana}</option>)}
                </select>
                <button onClick={() => { if (relAdd) { set('relations', [...(draft.relations || []), relAdd]); setRelAdd(''); } }}>Add</button>
              </div>
            </div>

            {/* Reverse relations */}
            <hr className="divider" />
            <div className="field">
              <div className="field-label" style={{ marginBottom: 10 }}>Referenced by</div>
              <div className="tags">
                {allCharacters
                  .filter(c => c.slug !== draft.slug && c.relations?.includes(draft.slug))
                  .map(c => (
                    <span key={c.slug} className="tag" onClick={() => onNavigate(c.slug)} title={`Go to ${c.role}`}>
                      {c.role}
                    </span>
                  ))}
              </div>
            </div>
          </>
        )}

        {tab === 'Stories' && (
          <>
            <div className="field">
              <div className="field-label">Story Label</div>
              <input className="field-input" value={draft.storyLabel || ''} onChange={e => set('storyLabel', e.target.value)} placeholder="e.g. The Language of Flowers" />
            </div>
            {(draft.stories || []).map((s, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Story {i + 1}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => set('stories', draft.stories.filter((_, j) => j !== i))}>Remove</button>
                </div>
                <div className="field">
                  <div className="field-label">Image src</div>
                  <input className="field-input" value={s.src || ''} onChange={e => { const ss = [...draft.stories]; ss[i] = { ...ss[i], src: e.target.value }; set('stories', ss); }} />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <div className="field-label">Title</div>
                    <input className="field-input" value={s.title || ''} onChange={e => { const ss = [...draft.stories]; ss[i] = { ...ss[i], title: e.target.value }; set('stories', ss); }} />
                  </div>
                  <div className="field">
                    <div className="field-label">Caption</div>
                    <input className="field-input" value={s.caption || ''} onChange={e => { const ss = [...draft.stories]; ss[i] = { ...ss[i], caption: e.target.value }; set('stories', ss); }} />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => set('stories', [...(draft.stories || []), { src: '', title: '', caption: '' }])}>+ Add Story Image</button>
          </>
        )}
      </div>
    </div>
  );
}
