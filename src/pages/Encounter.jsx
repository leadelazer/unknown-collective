import { useParams, useNavigate } from 'react-router-dom';
import { ENCOUNTERS } from '../data/encounters.js';
import { CHARACTERS } from '../data/characters.js';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import DecoRule from '../components/DecoRule.jsx';
import { assetUrl } from '../utils/assetUrl.js';
import styles from './Encounter.module.css';

export default function Encounter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const enc = ENCOUNTERS.find(e => e.id === id);

  if (!enc) return (
    <div className={styles.page}>
      <Nav />
      <p className={styles.notFound}>Encounter not found.</p>
    </div>
  );

  const participants = enc.participants
    .map(slug => CHARACTERS.find(c => c.slug === slug))
    .filter(Boolean);

  const paragraphs = enc.body
    ? enc.body.split(/\n\n+/).filter(p => p.trim())
    : [];

  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <Nav />

      <article className={styles.article}>
        <button className={`${styles.back} t-deco`} onClick={() => navigate('/encounters')}>
          ← All Encounters
        </button>

        <header className={styles.header}>
          <p className={`${styles.eyebrow} t-deco`}>Recorded encounter</p>
          <h1 className={`${styles.title} t-display`}>{enc.title}</h1>
          <div className={styles.ruleWrap}><DecoRule /></div>
        </header>

        {participants.length > 0 && (
          <div className={styles.participants}>
            {participants.map(c => (
              <button
                key={c.slug}
                className={`${styles.participant} glass`}
                onClick={() => navigate(`/character/${c.slug}`)}
              >
                <div
                  className={styles.participantPortrait}
                  style={{ backgroundImage: `url(${assetUrl(c.img)})` }}
                />
                <div>
                  <span className={`${styles.participantRole} t-display`}>{c.role}</span>
                  {c.name && <span className={`${styles.participantName} t-deco`}>{c.name}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className={styles.body}>
          {paragraphs.length > 0 ? (
            paragraphs.map((para, i) => (
              <p key={i} className={`${styles.para} t-body`}>{para}</p>
            ))
          ) : (
            <p className={`${styles.empty} t-body`}>
              No record of this encounter has survived the archive.
            </p>
          )}
        </div>
      </article>

      <Footer />
    </div>
  );
}
