import { useEffect, useRef, useState } from 'react';
import { INTERPRETATIONS } from '../data/interpretations.js';
import styles from './InterpretationsPanel.module.css';

export default function InterpretationsPanel({ onClose }) {
  const [active, setActive] = useState(INTERPRETATIONS[0].id);
  const panelRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const current = INTERPRETATIONS.find(i => i.id === active) || INTERPRETATIONS[0];
  const paragraphs = current.body.split(/\n\n+/).filter(p => p.trim());

  return (
    <div className={styles.overlay} onClick={onClose} aria-label="Close interpretations">
      <aside
        ref={panelRef}
        className={styles.panel}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Agent Interpretations"
      >
        <header className={styles.header}>
          <p className={`${styles.eyebrow} t-deco`}>Agent Interpretations</p>
          <button className={`${styles.close} t-deco`} onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className={styles.intro}>
          <p className={`${styles.introText} t-body`}>
            Four models were given the same archive and asked to read it. These are their interpretations, unedited.
          </p>
        </div>

        <nav className={styles.tabs} aria-label="Model interpretations">
          {INTERPRETATIONS.map(interp => (
            <button
              key={interp.id}
              className={`${styles.tab} ${active === interp.id ? styles.tabActive : ''} t-deco`}
              onClick={() => setActive(interp.id)}
            >
              <span className={styles.tabModel}>{interp.model}</span>
              <span className={styles.tabVendor}>{interp.vendor}</span>
            </button>
          ))}
        </nav>

        <div className={styles.body} key={active}>
          <div className={styles.essayHeader}>
            <p className={`${styles.tagline} t-deco`}>{current.tagline}</p>
            <h2 className={`${styles.title} t-display`}>{current.title}</h2>
          </div>

          <div className={styles.essay}>
            {paragraphs.map((para, i) => (
              <p key={i} className={`${styles.para} t-body`}>{para}</p>
            ))}
          </div>

          <footer className={styles.footer}>
            <span className={`${styles.attribution} t-deco`}>{current.model} · {current.vendor} · {current.date}</span>
          </footer>
        </div>
      </aside>
    </div>
  );
}
