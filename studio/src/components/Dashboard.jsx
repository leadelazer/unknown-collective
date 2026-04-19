import React, { useEffect, useRef, useState } from 'react';

const API = '/api';

const ACTIONS = [
  { id: 'patch-fields', label: 'Patch Weak Content', description: 'Agent picks the thinnest character content and rewrites talisman, shadow, or bio. You review before anything is applied.' },
  { id: 'add-encounter', label: 'Add Encounter', description: 'Agent picks two related characters with no encounter yet and writes their shared narrative.' },
  { id: 'coherence-check', label: 'Coherence Check', description: 'Audits all characters for broken relations, keyword misalignment, and tier logic. Writes a report.' },
  { id: 'expand-lore', label: 'Expand Lore', description: 'Agent identifies a gap in world lore - a place, ritual, or systemic element - and writes a new entry.' },
];

const MODELS = [
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4.1 mini', value: 'gpt-4.1-mini' },
  { label: 'GPT-4.1', value: 'gpt-4.1' },
  { label: 'o4 mini', value: 'o4-mini' },
  { label: 'Mistral Large', value: 'mistral-large-2411' },
  { label: 'Cohere Command A', value: 'cohere-command-a' },
  { label: 'DeepSeek V3', value: 'deepseek-v3-0324' },
  { label: 'GPT-4.1 Nano', value: 'gpt-4.1-nano' },
  { label: 'GPT-5 mini', value: 'gpt-5-mini' },
  { label: 'Claude Haiku 3.5', value: 'claude-3-5-haiku' },
];

const ISSUE_COLORS = {
  talisman: { bg: '#fef3c7', color: '#92400e' },
  shadow: { bg: '#fce7f3', color: '#9d174d' },
  bio: { bg: '#f0f9ff', color: '#0c4a6e' },
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

function DraftBody({ content, preview }) {
  const text = content || preview;
  if (!text) return null;
  const content2 = text;
  const sections = content2.split(/\n(?=## )/);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {sections.map((section, i) => {
        const headingMatch = section.match(/^## (.+)\n([\s\S]*)/);
        if (headingMatch) {
          return (
            <div key={i}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: 10 }}>
                {headingMatch[1]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {headingMatch[2].trim().split(/\n\n+/).map((p, j) => (
                  <p key={j} style={{ margin: 0, fontSize: 13.5, lineHeight: 1.75, color: 'var(--text)' }}>{p.trim()}</p>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {section.trim().split(/\n\n+/).map((p, j) => (
              <p key={j} style={{ margin: 0, fontSize: 13.5, lineHeight: 1.75, color: 'var(--text)' }}>{p.trim()}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function DraftModal({ draft, characters, encounters, lore, onApprove, onReject, onClose }) {
  const char = characters?.find(c => c.slug === draft.slug);
  const existingEncounter = draft.action === 'add-encounter'
    ? encounters?.find(e => [e.slugA, e.slugB].sort().join('--') === [draft.slugA, draft.slugB].sort().join('--'))
    : null;
  const existingLore = (draft.action === 'expand-lore' || draft.action === 'coherence-check')
    ? lore?.find(item => item.id === draft.targetId || item.title === draft.title)
    : null;

  let currentContent = null;
  if (draft.field === 'talisman-shadow') {
    const parts = [];
    if (char?.talisman) parts.push({ label: 'Current Talisman', text: char.talisman });
    if (char?.shadow) parts.push({ label: 'Current Shadow', text: char.shadow });
    currentContent = parts.length > 0 ? parts : [{ label: 'No existing content', text: null }];
  } else if (draft.field === 'bio') {
    currentContent = char?.bio
      ? [{ label: 'Current Bio', text: Array.isArray(char.bio) ? char.bio.join('\n\n') : char.bio }]
      : [{ label: 'No existing bio', text: null }];
  } else if (draft.action === 'add-encounter') {
    currentContent = existingEncounter
      ? [
          { label: 'Current Title', text: existingEncounter.title || null },
          { label: 'Current Narrative', text: existingEncounter.body || null },
        ]
      : [{ label: 'No existing encounter', text: null }];
  } else if (draft.action === 'expand-lore' || draft.action === 'coherence-check') {
    currentContent = existingLore
      ? [
          { label: 'Current Title', text: existingLore.title || null },
          { label: 'Current Content', text: existingLore.body || null },
        ]
      : [{ label: 'No existing lore entry', text: null }];
  }

  const draftTitle = draft.action === 'patch-fields'
    ? `${char?.role || draft.slug} - ${draft.field}`
    : draft.action === 'add-encounter'
      ? `Encounter: ${draft.slugA} x ${draft.slugB}`
      : draft.action === 'expand-lore'
        ? `Lore: ${draft.title}`
        : 'Coherence Report';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 960, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 80px)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-3)', marginBottom: 4 }}>
              {ACTIONS.find(a => a.id === draft.action)?.label}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{draftTitle}</div>
            {char && (
              <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{char.arcana}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>|</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'capitalize' }}>{char.tier}</span>
                {char.keywords?.length > 0 && (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>|</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>{char.keywords.join(', ')}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ fontSize: 18, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>x</button>
        </div>

        {draft.reasoning && (
          <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic' }}>
            Agent reasoning: {draft.reasoning}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: currentContent ? '1fr 1.6fr' : '1fr' }}>
          {currentContent && (
            <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)', background: 'var(--surface-2)', overflowY: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-3)', marginBottom: 16 }}>Existing</div>
              {currentContent.map(({ label, text }, i) => (
                <div key={i} style={{ marginBottom: i < currentContent.length - 1 ? 20 : 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
                  {text
                    ? <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)' }}>{text}</p>
                    : <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>Empty</p>}
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-3)', marginBottom: 16 }}>
              {currentContent ? 'Proposed' : 'Draft'}
            </div>
            <DraftBody content={draft.content} preview={draft.preview} />
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Review the proposed content before applying.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onReject} style={{ padding: '7px 18px', borderRadius: 5, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid #f5c6c2' }}>
              Discard
            </button>
            <button onClick={onApprove} style={{ padding: '7px 18px', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>
              Apply to source files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const sL = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 10 };
const crd = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' };
const sel = { fontSize: 12, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };
const pBtn = { padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' };

export default function Dashboard({ characters, encounters, lore, showToast, onRefresh }) {
  const [stats, setStats] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [model, setModel] = useState('gpt-4o-mini');
  const [mode, setMode] = useState('local');
  const [ghRepo, setGhRepo] = useState(null);
  const [repoError, setRepoError] = useState(null);
  const [running, setRunning] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [modalDraft, setModalDraft] = useState(null);
  const pollRef = useRef(null);

  function checkRepo() {
    setRepoError(null);
    fetch(`${API}/repo`)
      .then(r => r.json())
      .then(d => {
        if (d.full) setGhRepo(d);
        else setRepoError(d.error || 'No remote found');
      })
      .catch(() => setRepoError('Studio server not reachable - make sure npm run dev is running'));
  }

  useEffect(() => {
    loadStats();
    loadDrafts();
    checkRepo();
    return () => clearInterval(pollRef.current);
  }, []);

  async function loadStats() {
    try {
      setStats(await fetch(`${API}/gaps`).then(r => r.json()));
    } catch {}
  }

  async function loadDrafts() {
    try {
      setDrafts(await fetch(`${API}/drafts`).then(r => r.json()));
    } catch {}
  }

  async function runLocal(action) {
    setRunning(action);
    setLastRun(null);
    try {
      const d = await fetch(`${API}/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, model }),
      }).then(r => r.json());

      if (d.ok) {
        setLastRun({ action, reasoning: d.reasoning });
        await loadDrafts();
        await loadStats();
        showToast('Draft saved - review in Pending Drafts');
      } else {
        setLastRun({ action, error: d.error || 'Agent failed' });
        showToast(d.error || 'Agent failed', 'error');
      }
    } catch (e) {
      setLastRun({ action, error: e.message });
      showToast(e.message, 'error');
    }
    setRunning(null);
  }

  async function dispatchActions(action) {
    setRunning(action);
    setLastRun(null);
    try {
      const d = await fetch(`${API}/agent/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, model }),
      }).then(r => r.json());

      if (!d.ok) throw new Error(d.error);
      setLastRun({ action, dispatched: true, runId: d.runId, status: d.status });
      showToast(`Workflow dispatched (run #${d.runId})`);

      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`${API}/agent/status/${d.runId}`).then(r => r.json());
          setLastRun(prev => ({ ...prev, status: s.status, conclusion: s.conclusion }));
          if (s.status === 'completed') {
            clearInterval(pollRef.current);
            setRunning(null);
            if (s.conclusion === 'success') {
              await fetch(`${API}/agent/pull`, { method: 'POST' });
              await loadDrafts();
              await loadStats();
              showToast('Workflow complete - drafts pulled');
            } else {
              showToast(`Workflow ${s.conclusion}`, 'error');
            }
          }
        } catch {}
      }, 6000);
    } catch (e) {
      setLastRun({ action, error: e.message });
      showToast(e.message, 'error');
      setRunning(null);
    }
  }

  function handleRun(action) {
    if (mode === 'local') runLocal(action);
    else dispatchActions(action);
  }

  async function approveDraft(id) {
    const d = await fetch(`${API}/drafts/${id}/approve`, { method: 'POST' }).then(r => r.json());
    if (d.ok) {
      showToast('Applied');
      setModalDraft(null);
      await loadDrafts();
      await loadStats();
      if (onRefresh) onRefresh();
    } else {
      showToast(d.error || 'Failed', 'error');
    }
  }

  async function rejectDraft(id) {
    await fetch(`${API}/drafts/${id}`, { method: 'DELETE' });
    showToast('Discarded');
    setModalDraft(null);
    await loadDrafts();
  }

  function draftLabel(d) {
    if (d.action === 'patch-fields') {
      const char = characters?.find(c => c.slug === d.slug);
      return `${char?.role || d.slug} - ${d.field}`;
    }
    if (d.action === 'add-encounter') return `Encounter: ${d.slugA} x ${d.slugB}`;
    if (d.action === 'expand-lore') return `Lore: ${d.title}`;
    if (d.action === 'coherence-check') return 'Coherence Report';
    return d.action;
  }

  function draftAge(created) {
    const mins = Math.floor((Date.now() - created) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={sL}>Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Characters', value: characters.length },
            { label: 'Encounters', value: encounters.length },
            { label: 'Lore entries', value: lore.length },
            { label: 'Content rating', value: stats?.ratings ? `${stats.ratings.overall.score}/100` : '...', accent: (stats?.ratings?.overall.score ?? 100) < 82 },
          ].map(s => (
            <div key={s.label} style={{ ...crd, padding: '12px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: s.accent ? 'var(--accent)' : 'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {stats?.gaps.length > 0 && (
        <div>
          <div style={sL}>Patch Candidates</div>
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

      {stats?.ratings && (
        <div>
          <div style={sL}>Content Rating</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
            <div style={{ ...crd, padding: '14px 16px' }}>
              <div style={{ fontSize: 26, fontWeight: 600 }}>{stats.ratings.overall.score}/100</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{stats.ratings.overall.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                Ratings are computed from thin bios, short talisman/shadow text, and structural gaps. They refresh after approvals.
              </div>
            </div>
            <div style={{ ...crd, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 10 }}>Weakest Right Now</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.ratings.weakest.slice(0, 4).map(item => (
                  <div key={item.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>{item.role}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.issues.join(', ') || 'No issues'}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', flexShrink: 0 }}>{item.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
            Uses GitHub Models via <code>gh auth token</code> or <code>GITHUB_TOKEN</code> env var.
          </div>
        )}

        {mode === 'actions' && !ghRepo && (
          <div style={{ padding: '10px 14px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius)', fontSize: 13, color: '#7c5e00', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1 }}>{repoError || 'Detecting GitHub remote...'}</div>
            <button onClick={checkRepo} style={{ ...pBtn, background: '#fffde7', border: '1px solid #ffe082', color: '#7c5e00', flexShrink: 0 }}>Retry</button>
          </div>
        )}

        {mode === 'actions' && ghRepo && (
          <div style={{ padding: '8px 14px', background: 'var(--green-soft)', border: '1px solid #c3e6c3', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--green)', marginBottom: 10 }}>
            Connected: <strong>{ghRepo.full}</strong>
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
                  {isRunning ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Spinner /> {mode === 'actions' ? 'Polling...' : 'Running...'}</span> : 'Run >'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {lastRun && (
        <div style={{ background: lastRun.error ? 'var(--red-soft)' : 'var(--surface-2)', border: `1px solid ${lastRun.error ? '#f5c6c2' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: lastRun.error ? 'var(--red)' : 'var(--text-3)', marginBottom: 6 }}>
            {lastRun.error ? 'Error' : lastRun.dispatched ? `Dispatched - ${ACTIONS.find(a => a.id === lastRun.action)?.label}` : `Agent ran - ${ACTIONS.find(a => a.id === lastRun.action)?.label}`}
          </div>
          {lastRun.dispatched ? (
            <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Run <code style={{ fontSize: 12 }}>#{lastRun.runId}</code> | {lastRun.status}{lastRun.conclusion ? ` | ${lastRun.conclusion}` : ''}
              {lastRun.status !== 'completed' && <Spinner />}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: lastRun.error ? 'var(--text)' : 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: lastRun.error ? 'monospace' : 'inherit' }}>
              {lastRun.error || lastRun.reasoning}
            </div>
          )}
          {!lastRun.error && !lastRun.dispatched && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
              Draft saved. Open it below to review the full content before applying.
            </div>
          )}
        </div>
      )}

      {drafts.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <div style={sL}>Pending Drafts</div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginTop: -10 }}>{drafts.length} waiting for review</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {drafts.map(d => (
              <div key={d.id} style={{ ...crd, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{draftLabel(d)}</div>
                  {d.reasoning && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.reasoning}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{draftAge(d.created)}</div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModalDraft(d)} style={{ fontSize: 12, fontWeight: 500 }}>
                    Review {'>'}
                  </button>
                  <button onClick={() => rejectDraft(d.id)} style={{ ...pBtn, background: 'transparent', color: 'var(--text-3)', border: '1px solid var(--border)' }}>x</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!running && drafts.length === 0 && !lastRun && (
        <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No pending drafts. Run an agent action to generate content.</div>
      )}

      {modalDraft && (
        <DraftModal
          draft={modalDraft}
          characters={characters}
          encounters={encounters}
          lore={lore}
          onApprove={() => approveDraft(modalDraft.id)}
          onReject={() => rejectDraft(modalDraft.id)}
          onClose={() => setModalDraft(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
