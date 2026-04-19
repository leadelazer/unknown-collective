import React, { useState, useEffect, useRef } from 'react';

const API = '/api';

const ACTIONS = [
  { id: 'patch-fields', label: 'Patch Missing Fields', description: 'Agent picks a character with gaps and writes talisman, shadow, or bio. You review before anything is applied.' },
  { id: 'add-encounter', label: 'Add Encounter', description: 'Agent picks two related characters with no encounter yet and writes their shared narrative.' },
  { id: 'coherence-check', label: 'Coherence Check', description: 'Audits all characters for broken relations, keyword misalignment, and tier logic. Writes a report.' },
  { id: 'expand-lore', label: 'Expand Lore', description: 'Agent identifies a gap in world lore — a place, ritual, or systemic element — and writes a new entry.' },
];

const MODELS = [
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'Llama 3.1 70B', value: 'meta-llama-3.1-70b-instruct' },
];

const ISSUE_COLORS = {
  talisman: { bg: '#fef3c7', color: '#92400e' },
  shadow:   { bg: '#fce7f3', color: '#9d174d' },
  bio:      { bg: '#f0f9ff', color: '#0c4a6e' },
};

function IssuePill({ issue }) {
  const entry = Object.entries(ISSUE_COLORS).find(([k]) => issue.startsWith(k));
  const style = entry ? entry[1] : { bg: '#fee2e2', color: '#991b1b' };
  return (
    <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: style.bg, color: style.color }}>
      {issue.replace(/\(.*\)/, '')}
    </span>
  );
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid rgba(0,0,0,.15)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;
}

const sL = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 10 };
const crd = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' };
const sel = { fontSize: 12, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };
const pBtn = { padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' };

export default function Dashboard({ characters, encounters, lore, showToast, onRefresh }) {
  const [stats, setStats] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [model, setModel] = useState('gpt-4o-mini');
  const [mode, setMode] = useState('local'); // 'local' | 'actions'
  const [ghRepo, setGhRepo] = useState(null);
  const [running, setRunning] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [expandedDraft, setExpandedDraft] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    loadStats();
    loadDrafts();
    fetch(`${API}/repo`).then(r => r.json()).then(d => { if (d.full) setGhRepo(d); });
    return () => clearInterval(pollRef.current);
  }, []);

  async function loadStats() {
    try { setStats(await fetch(`${API}/gaps`).then(r => r.json())); } catch {}
  }
  async function loadDrafts() {
    try { setDrafts(await fetch(`${API}/drafts`).then(r => r.json())); } catch {}
  }

  async function runLocal(action) {
    setRunning(action); setLastRun(null);
    try {
      const d = await fetch(`${API}/agent/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, model }) }).then(r => r.json());
      if (d.ok) {
        setLastRun({ action, reasoning: d.reasoning, preview: d.preview });
        await loadDrafts(); await loadStats();
        showToast('Draft saved — review below');
      } else {
        setLastRun({ action, error: d.error || 'Agent failed' });
        showToast(d.error || 'Agent failed', 'error');
      }
    } catch (e) {
      setLastRun({ action, error: e.message }); showToast(e.message, 'error');
    }
    setRunning(null);
  }

  async function dispatchActions(action) {
    setRunning(action); setLastRun(null);
    try {
      const d = await fetch(`${API}/agent/dispatch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, model }) }).then(r => r.json());
      if (!d.ok) throw new Error(d.error);
      setLastRun({ action, dispatched: true, runId: d.runId, status: d.status });
      showToast(`Workflow dispatched (run #${d.runId})`);

      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`${API}/agent/status/${d.runId}`).then(r => r.json());
          setLastRun(p => ({ ...p, status: s.status, conclusion: s.conclusion }));
          if (s.status === 'completed') {
            clearInterval(pollRef.current);
            setRunning(null);
            if (s.conclusion === 'success') {
              await fetch(`${API}/agent/pull`, { method: 'POST' });
              await loadDrafts(); await loadStats();
              showToast('Workflow complete — drafts pulled');
            } else {
              showToast(`Workflow ${s.conclusion}`, 'error');
            }
          }
        } catch {}
      }, 6000);
    } catch (e) {
      setLastRun({ action, error: e.message }); showToast(e.message, 'error'); setRunning(null);
    }
  }

  function handleRun(action) { mode === 'local' ? runLocal(action) : dispatchActions(action); }

  async function approveDraft(id) {
    const d = await fetch(`${API}/drafts/${id}/approve`, { method: 'POST' }).then(r => r.json());
    if (d.ok) { showToast('Applied'); await loadDrafts(); await loadStats(); if (onRefresh) onRefresh(); }
    else showToast(d.error || 'Failed', 'error');
  }
  async function rejectDraft(id) {
    await fetch(`${API}/drafts/${id}`, { method: 'DELETE' });
    showToast('Discarded');
    if (expandedDraft === id) setExpandedDraft(null);
    await loadDrafts();
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Stats */}
      <div>
        <div style={sL}>Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Characters', value: characters.length },
            { label: 'Encounters', value: encounters.length },
            { label: 'Lore entries', value: lore.length },
            { label: 'Content gaps', value: stats?.gaps.length ?? '…', accent: stats?.gaps.length > 0 },
          ].map(s => (
            <div key={s.label} style={{ ...crd, padding: '12px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: s.accent ? 'var(--accent)' : 'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gaps */}
      {stats?.gaps.length > 0 && (
        <div>
          <div style={sL}>Content Gaps</div>
          <div style={crd}>
            {stats.gaps.map((g, i) => (
              <div key={g.slug} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 20, fontVariantNumeric: 'tabular-nums' }}>{String(g.n).padStart(2, '0')}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{g.role}</span>
                <div style={{ display: 'flex', gap: 4 }}>{g.issues.map(iss => <IssuePill key={iss} issue={iss} />)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Actions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={sL}>Agent Actions</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {['local', 'actions'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ padding: '4px 12px', fontSize: 12, fontWeight: mode === m ? 600 : 400, background: mode === m ? 'var(--accent-soft)' : 'transparent', color: mode === m ? 'var(--accent)' : 'var(--text-3)', borderRight: m === 'local' ? '1px solid var(--border)' : 'none' }}>
                  {m === 'local' ? 'Local' : 'GitHub Actions'}
                </button>
              ))}
            </div>
            <select value={model} onChange={e => setModel(e.target.value)} style={sel}>
              {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {mode === 'local' && (
          <div style={{ padding: '8px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
            Uses GitHub Models via <code>gh auth token</code> — no separate API key needed. Run <code>gh auth login</code> once if not already done.
          </div>
        )}
        {mode === 'actions' && !ghRepo && (
          <div style={{ padding: '10px 14px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius)', fontSize: 13, color: '#7c5e00', marginBottom: 10 }}>
            No GitHub remote detected. Push this repo to GitHub first.
          </div>
        )}
        {mode === 'actions' && ghRepo && (
          <div style={{ padding: '8px 14px', background: 'var(--green-soft)', border: '1px solid #c3e6c3', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--green)', marginBottom: 10 }}>
            Connected: <strong>{ghRepo.full}</strong> — agent runs in the cloud, drafts commit back to repo automatically.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ACTIONS.map(a => {
            const isRunning = running === a.id;
            const disabled = !!running || (mode === 'actions' && !ghRepo);
            return (
              <div key={a.id} style={{ ...crd, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, flex: 1 }}>{a.description}</div>
                <button className="btn btn-primary btn-sm" onClick={() => handleRun(a.id)} disabled={disabled} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  {isRunning ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Spinner /> {mode === 'actions' ? 'Polling…' : 'Running…'}</span> : 'Run →'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last run result */}
      {lastRun && (
        <div style={{ background: lastRun.error ? 'var(--red-soft)' : 'var(--green-soft)', border: `1px solid ${lastRun.error ? '#f5c6c2' : '#c3e6c3'}`, borderRadius: 'var(--radius)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: lastRun.error ? 'var(--red)' : 'var(--green)', marginBottom: 6 }}>
            {lastRun.error ? 'Error' : lastRun.dispatched ? `GitHub Actions — ${ACTIONS.find(a => a.id === lastRun.action)?.label}` : `Agent chose — ${ACTIONS.find(a => a.id === lastRun.action)?.label}`}
          </div>
          {lastRun.dispatched ? (
            <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Run <code style={{ fontSize: 12 }}>#{lastRun.runId}</code> · {lastRun.status}{lastRun.conclusion ? ` · ${lastRun.conclusion}` : ''}
              {lastRun.status !== 'completed' && <Spinner />}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{lastRun.error || lastRun.reasoning}</div>
          )}
          {lastRun.preview && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(0,0,0,.03)', borderRadius: 4, fontSize: 12, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'hidden' }}>
              {lastRun.preview}…
            </div>
          )}
        </div>
      )}

      {/* Pending Drafts */}
      {drafts.length > 0 && (
        <div>
          <div style={sL}>Pending Drafts ({drafts.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {drafts.map(d => (
              <div key={d.id} style={{ ...crd, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {d.action === 'patch-fields' && `${d.slug} — ${d.field}`}
                      {d.action === 'add-encounter' && `Encounter: ${d.slugA} + ${d.slugB}`}
                      {d.action === 'expand-lore' && `Lore: ${d.title}`}
                      {d.action === 'coherence-check' && 'Coherence Report'}
                    </div>
                    {d.reasoning && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reasoning}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setExpandedDraft(expandedDraft === d.id ? null : d.id)} style={{ fontSize: 12 }}>{expandedDraft === d.id ? 'Hide' : 'Preview'}</button>
                    <button onClick={() => approveDraft(d.id)} style={{ ...pBtn, background: 'var(--green-soft)', color: 'var(--green)', border: '1px solid #c3e6c3' }}>Apply ✓</button>
                    <button onClick={() => rejectDraft(d.id)} style={{ ...pBtn, background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid #f5c6c2' }}>Reject ✗</button>
                  </div>
                </div>
                {expandedDraft === d.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: 'var(--bg)', fontSize: 12, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', lineHeight: 1.7 }}>
                    {d.preview}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!running && drafts.length === 0 && (
        <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No pending drafts. Run an agent action to generate content.</div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
