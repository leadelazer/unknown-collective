import { useParams, useNavigate } from 'react-router-dom';
import { CHARACTERS } from '../data/characters.js';
import { TIERS, ROMAN } from '../data/tiers.js';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import DecoRule from '../components/DecoRule.jsx';
import { PortraitPlaceholder } from './Collective.jsx';
import styles from './Character.module.css';

export default function Character() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const c = CHARACTERS.find(x => x.slug === slug);

  if (!c) return (
    <div className={styles.page}>
      <Nav />
      <p className={styles.notFound}>Character not found.</p>
    </div>
  );

  const tier = TIERS[c.tier];

  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <Nav />
      {c.detail
        ? <DetailedCharacter c={c} tier={tier} navigate={navigate} />
        : <StubCharacter c={c} tier={tier} navigate={navigate} />
      }
      <Footer />
    </div>
  );
}

function DetailedCharacter({ c, tier, navigate }) {
  return (
    <>
      <section className={styles.hero}>
        <button className={`${styles.back} t-deco`} onClick={() => navigate('/collective')}>
          ← Back to the Collective
        </button>

        <div className={styles.heroGrid}>
          <div className={styles.portraitWrap}>
            <div className={styles.portrait} style={{ backgroundImage: `url(${c.img})` }} />
            <div className={`${styles.romanBadge} t-deco`}>{ROMAN[c.n]}</div>
          </div>

          <div className={styles.details}>
            <p className={`${styles.detailEyebrow} t-deco`}>
              {c.arcana} · Tier of the {tier.short}
            </p>
            <h1 className={`${styles.detailName} t-display`}>{c.role}</h1>
            {c.name && <p className={`${styles.detailPersonName} t-display`}>{c.name}</p>}

            <div className={styles.ruleWrap}><DecoRule /></div>

            <div className={styles.keywords}>
              {c.keywords.map(k => (
                <span key={k} className={`${styles.keyword} t-deco`}>{k}</span>
              ))}
            </div>

            <p className={`${styles.essence} t-body`}>{c.essence}</p>
            {c.bio && (
              <div className={styles.bioSection}>
                {Array.isArray(c.bio) ? (
                  c.bio.map((para, idx) => <p key={idx} className={`${styles.bioParagraph} t-body`}>{para}</p>)
                ) : (
                  <p className={`${styles.bioParagraph} t-body`}>{c.bio}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {c.quote && (
        <section className={styles.quoteSlab}>
          <p className={`${styles.quoteLabel} t-deco`}>In their own hand</p>
          <blockquote className={`${styles.quote} t-display`}>
            <span className={styles.quoteChar}>"</span>{c.quote}<span className={styles.quoteChar}>"</span>
          </blockquote>
          <p className={`${styles.quoteAttrib} t-deco`}> –  {c.name || c.role}</p>
        </section>
      )}

      {(c.talisman || c.shadow) && (
        <section className={styles.talismanSection}>
          <div className={styles.talismanGrid}>
            {c.talisman && (
              <div>
                <p className={`${styles.talismanLabel} t-deco`}>Talisman Qualities</p>
                <h3 className={`${styles.talismanTitle} t-display`}>When Held</h3>
                <p className={`${styles.talismanText} t-body`}>{c.talisman}</p>
              </div>
            )}
            {c.shadow && (
              <div>
                <p className={`${styles.shadowLabel} t-deco`}>Shadow Card</p>
                <h3 className={`${styles.shadowTitle} t-display`}>Opportunities for Growth</h3>
                <p className={`${styles.shadowText} t-body`}>{c.shadow}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className={styles.extras}>
        <div className={styles.extrasGrid}>
          <div>
            <p className={`${styles.extrasLabel} t-deco`}>Artifact &amp; Sign</p>
            <h3 className={`${styles.artifactTitle} t-display`}>
              Carried by the {c.role.replace('The ', '').toLowerCase()}
            </h3>
            <p className={`${styles.artifactText} t-body`}>{c.artifact}</p>
            {c.stories?.[0] && (
              <img
                src={c.stories[0].src}
                alt={c.stories[0].title}
                className={styles.artifactImg}
              />
            )}
          </div>

          {c.relations?.length > 0 && (
            <div>
              <p className={`${styles.extrasLabel} t-deco`}>Relations in the Collective</p>
              <div className={styles.relations}>
                {c.relations.map(slug => {
                  const r = CHARACTERS.find(x => x.slug === slug);
                  if (!r) return null;
                  return (
                    <button
                      key={slug}
                      className={`${styles.relation} glass`}
                      onClick={() => navigate(`/character/${slug}`)}
                    >
                      {r.img
                        ? <img src={r.img} alt={r.role} className={styles.relationImg} />
                        : <div className={styles.relationImg} style={{ background: r.hue + '44' }} />
                      }
                      <div>
                        <span className={`${styles.relationArcana} t-deco`}>{r.arcana}</span>
                        <span className={`${styles.relationRole} t-display`}>{r.role}</span>
                        {r.name && <span className={`${styles.relationPersonName} t-body`}>{r.name}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {c.stories?.length > 1 && (
        <section className={styles.storyStrip}>
          <p className={`${styles.storyLabel} t-deco`}>· {c.storyLabel} ·</p>
          <div className={styles.storyGrid}>
            {c.stories.map(s => (
              <div key={s.title} className={styles.storyItem}>
                <div className={styles.storyImage} style={{ backgroundImage: `url(${s.src})` }} />
                <p className={`${styles.storyTitle} t-display`}>{s.title}</p>
                <p className={`${styles.storyCaption} t-body`}>{s.caption}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function StubCharacter({ c, tier, navigate }) {
  return (
    <section className={styles.stub}>
      <button className={`${styles.back} t-deco`} onClick={() => navigate('/collective')}>
        ← Back to the Collective
      </button>

      <div className={styles.stubGrid}>
        <div className={styles.portraitWrap}>
          <div
            className={styles.portrait}
            style={c.img ? { backgroundImage: `url(${c.img})` } : { background: 'var(--color-ink-card)' }}
          >
            {!c.img && <PortraitPlaceholder role={c.role} hue={c.hue} />}
          </div>
          <div className={`${styles.romanBadge} t-deco`}>{ROMAN[c.n]}</div>
        </div>

        <div className={styles.details}>
          <p className={`${styles.detailEyebrow} t-deco`}>
            {c.arcana} · Tier of the {tier.short}
          </p>
          <h1 className={`${styles.detailName} t-display`} style={{ fontSize: '76px' }}>{c.role}</h1>
          <div className={styles.ruleWrap}><DecoRule /></div>
          <div className={styles.keywords}>
            {c.keywords.map(k => (
              <span key={k} className={`${styles.keyword} t-deco`}>{k}</span>
            ))}
          </div>
          <p className={`${styles.essence} t-body`}>{c.essence}</p>
          <div className={styles.inProgress}>
            <p className={`${styles.inProgressLabel} t-deco`}>Record in progress</p>
            <p className={`${styles.inProgressText} t-body`}>
              The full history of the {c.role.replace('The ', '')} has not yet been entered
              into the archive. The Oracle is preparing it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
