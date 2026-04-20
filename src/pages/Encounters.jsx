import { useNavigate } from 'react-router-dom';
import { ENCOUNTERS } from '../data/encounters.js';
import { CHARACTERS } from '../data/characters.js';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import { assetUrl } from '../utils/assetUrl.js';
import { inlineMarkdown } from '../utils/inlineMarkdown.js';
import styles from './Encounters.module.css';

export default function Encounters() {
  const navigate = useNavigate();
  const active = ENCOUNTERS.filter(e => e.hasContent);
  const empty = ENCOUNTERS.filter(e => !e.hasContent);

  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <Nav />

      <main className={styles.main}>
        <header className={styles.header}>
          <p className={`${styles.eyebrow} t-deco`}>The Archive</p>
          <h1 className={`${styles.heading} t-display`}>Encounters</h1>
          <p className={`${styles.subheading} t-body`}>
            Recorded meetings, disputes, and exchanges between members of the Collective.
          </p>
        </header>

        {active.length > 0 && (
          <section className={styles.grid}>
            {active.map(enc => (
              <EncounterCard key={enc.id} enc={enc} navigate={navigate} />
            ))}
          </section>
        )}

        {empty.length > 0 && (
          <section className={styles.unwritten}>
            <p className={`${styles.unwrittenLabel} t-deco`}>Pending records</p>
            <div className={styles.unwrittenList}>
              {empty.map(enc => (
                <div key={enc.id} className={styles.unwrittenItem}>
                  <span className={`${styles.unwrittenTitle} t-body`}>{enc.title}</span>
                  <span className={`${styles.unwrittenMeta} t-deco`}>
                    {enc.participants
                      .map(s => CHARACTERS.find(c => c.slug === s)?.role || s)
                      .join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function EncounterCard({ enc, navigate }) {
  const participants = enc.participants
    .map(slug => CHARACTERS.find(c => c.slug === slug))
    .filter(Boolean);

  const preview = enc.body
    ? enc.body.split(/\n\n+/)[0].slice(0, 200).trim() + (enc.body.length > 200 ? '…' : '')
    : null;

  return (
    <article
      className={`${styles.card} glass`}
      onClick={() => navigate(`/encounter/${enc.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/encounter/${enc.id}`)}
      aria-label={enc.title}
    >
      {participants.length > 0 && (
        <div className={styles.cardParticipants}>
          {participants.map(c => (
            <div
              key={c.slug}
              className={styles.cardAvatar}
              style={{ backgroundImage: `url(${assetUrl(c.img)})` }}
              title={c.role}
            />
          ))}
        </div>
      )}

      <h2 className={`${styles.cardTitle} t-display`}>{enc.title}</h2>

      {participants.length > 0 && (
        <p className={`${styles.cardRoles} t-deco`}>
          {participants.map(c => c.role).join(' · ')}
        </p>
      )}

      {preview && (
        <p className={`${styles.cardPreview} t-body`} dangerouslySetInnerHTML={{ __html: inlineMarkdown(preview) }} />
      )}

      <span className={`${styles.cardCta} t-deco`}>Read record →</span>
    </article>
  );
}
