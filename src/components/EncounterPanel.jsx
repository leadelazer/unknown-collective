import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHARACTERS } from '../data/characters.js';
import { assetUrl } from '../utils/assetUrl.js';
import { inlineMarkdown } from '../utils/inlineMarkdown.js';
import styles from './EncounterPanel.module.css';

export default function EncounterPanel({ encounter, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Trap scroll on body while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!encounter) return null;

  const participants = encounter.participants
    .map(slug => CHARACTERS.find(c => c.slug === slug))
    .filter(Boolean);

  const paragraphs = encounter.body
    ? encounter.body.split(/\n\n+/).filter(p => p.trim())
    : [];

  return (
    <div className={styles.overlay} onClick={onClose} aria-label="Close encounter">
      <aside
        ref={panelRef}
        className={styles.panel}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={encounter.title}
      >
        <header className={styles.header}>
          <p className={`${styles.eyebrow} t-deco`}>Recorded encounter</p>
          <button className={`${styles.close} t-deco`} onClick={onClose} aria-label="Close">✕</button>
        </header>

        <h2 className={`${styles.title} t-display`}>{encounter.title}</h2>

        {participants.length > 0 && (
          <div className={styles.participants}>
            {participants.map(c => (
              <button
                key={c.slug}
                className={`${styles.participant} glass`}
                onClick={() => { onClose(); navigate(`/character/${c.slug}`); }}
              >
                <div
                  className={styles.participantAvatar}
                  style={{ backgroundImage: `url(${assetUrl(c.img)})` }}
                />
                <span className={`${styles.participantRole} t-deco`}>{c.role}</span>
              </button>
            ))}
          </div>
        )}

        <div className={styles.rule} />

        <div className={styles.body}>
          {paragraphs.length > 0 ? (
            paragraphs.map((para, i) => (
              <p key={i} className={`${styles.para} t-body`} dangerouslySetInnerHTML={{ __html: inlineMarkdown(para) }} />
            ))
          ) : (
            <p className={`${styles.empty} t-body`}>No record of this encounter has survived.</p>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            className={`${styles.fullLink} t-deco`}
            onClick={() => { onClose(); navigate(`/encounter/${encounter.id}`); }}
          >
            View full encounter →
          </button>
        </footer>
      </aside>
    </div>
  );
}
