import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CHARACTERS } from '../data/characters.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { resolveCharacterPalette, getCharacterPaletteMeta } from '../data/paletteSystem.js';
import { TIERS, ROMAN } from '../data/tiers.js';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import DecoRule from '../components/DecoRule.jsx';
import EncounterPanel from '../components/EncounterPanel.jsx';
import { PortraitPlaceholder } from './Collective.jsx';
import { assetUrl } from '../utils/assetUrl.js';
import styles from './Character.module.css';

function AnimatedPortrait({ c }) {
  const frameRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const palette = resolveCharacterPalette(c);
  const spotPrimary = palette[1] || palette[0] || 'var(--color-gold-hi)';
  const spotSecondary = palette[2] || palette[1] || palette[0] || 'var(--color-gold)';

  const resetPointer = () => {
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.setProperty('--portrait-rx', '0deg');
    frame.style.setProperty('--portrait-ry', '0deg');
    frame.style.setProperty('--portrait-tx', '0px');
    frame.style.setProperty('--portrait-ty', '0px');
    frame.style.setProperty('--portrait-sx', '0px');
    frame.style.setProperty('--portrait-sy', '0px');
    frame.style.setProperty('--portrait-mx', '50%');
    frame.style.setProperty('--portrait-my', '50%');
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 7;
    const rotateX = (0.5 - y) * 7;
    const shiftX = (x - 0.5) * -12;
    const shiftY = (y - 0.5) * -12;
    const sheenX = (x - 0.5) * 28;
    const sheenY = (y - 0.5) * 12;
    frame.style.setProperty('--portrait-rx', `${rotateX.toFixed(2)}deg`);
    frame.style.setProperty('--portrait-ry', `${rotateY.toFixed(2)}deg`);
    frame.style.setProperty('--portrait-tx', `${shiftX.toFixed(2)}px`);
    frame.style.setProperty('--portrait-ty', `${shiftY.toFixed(2)}px`);
    frame.style.setProperty('--portrait-sx', `${sheenX.toFixed(2)}px`);
    frame.style.setProperty('--portrait-sy', `${sheenY.toFixed(2)}px`);
    frame.style.setProperty('--portrait-mx', `${(x * 100).toFixed(1)}%`);
    frame.style.setProperty('--portrait-my', `${(y * 100).toFixed(1)}%`);
  };

  const activateDepth = () => setIsActive(true);

  const deactivateDepth = () => {
    setIsActive(false);
    resetPointer();
  };

  const portraitClassName = [styles.portrait, styles.portraitInteractive, isActive ? styles.portraitActive : '']
    .filter(Boolean)
    .join(' ');

  const portraitStyle = {
    '--spot-primary': spotPrimary,
    '--spot-secondary': spotSecondary,
    ...(!c.img ? { background: 'var(--color-ink-card)' } : {}),
  };

  return (
    <div
      ref={frameRef}
      className={portraitClassName}
      style={portraitStyle}
      onPointerEnter={activateDepth}
      onPointerMove={handlePointerMove}
      onPointerLeave={deactivateDepth}
      onPointerCancel={deactivateDepth}
    >
      {c.img ? (
        <img
          src={assetUrl(c.img)}
          alt={c.role}
          className={styles.portraitImage}
          loading="eager"
          decoding="async"
        />
      ) : (
        <PortraitPlaceholder role={c.role} hue={c.hue} />
      )}
      <span className={styles.portraitLight} aria-hidden="true" />
      <span className={styles.portraitSheen} aria-hidden="true" />
    </div>
  );
}

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
  const palette = resolveCharacterPalette(c);
  const paletteMeta = getCharacterPaletteMeta(c);
  const [activeEncounter, setActiveEncounter] = useState(null);
  const charEncounters = ENCOUNTERS.filter(e => e.participants.includes(c.slug));

  return (
    <>
      <section className={styles.hero}>
        <button className={`${styles.back} t-deco`} onClick={() => navigate('/collective')}>
          ← Back to the Collective
        </button>

        <div className={styles.heroGrid}>
          <div className={styles.portraitWrap}>
            <AnimatedPortrait c={c} />
            <div className={`${styles.romanBadge} t-deco`}>{ROMAN[c.n]}</div>
            {c.name && (
              <figcaption className={styles.portraitCaption}>
                <span className={`${styles.portraitCaptionName} t-display`}>{c.name}</span>
                <span className={`${styles.portraitCaptionMeta} t-deco`}>{c.role}</span>
              </figcaption>
            )}
          </div>

          <div className={styles.details}>
            <p className={`${styles.detailEyebrow} t-deco`}>
              {c.flower ? `${c.flower} · ${c.flowerMeaning}` : `Tier of the ${tier.short}`}
            </p>
            <h1 className={`${styles.detailName} t-display`}>{c.role}</h1>

            <div className={styles.ruleWrap}><DecoRule /></div>

            <div className={styles.keywords}>
              {c.keywords.map(k => (
                <span key={k} className={`${styles.keyword} t-deco`}>{k}</span>
              ))}
            </div>

            {palette.length > 0 && (
              <div className={styles.paletteTooltipWrap}>
                <div
                  className={styles.palette}
                  aria-describedby={paletteMeta ? `palette-tooltip-${c.slug}` : undefined}
                >
                  {palette.map((hex, i) => (
                    <span key={i} className={styles.paletteSwatch} style={{ background: hex }} />
                  ))}
                </div>

                {paletteMeta && (
                  <div
                    className={styles.paletteTooltip}
                    role="tooltip"
                    id={`palette-tooltip-${c.slug}`}
                  >
                    <p className={styles.paletteTooltipRole}>{paletteMeta.arcanaRole}</p>
                    <ul className={styles.paletteTooltipList}>
                      {paletteMeta.entries.map(entry => (
                        <li key={entry.label}>
                          <span className={styles.paletteTooltipLabel}>{entry.label}:</span> {entry.meaning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

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

      {c.flower && (
        <section className={styles.floriography}>
          {c.flower && (
            <div className={styles.floriographyText}>
              <p className={`${styles.floriographyLabel} t-deco`}>Floriography</p>
              <h3 className={`${styles.floriographyFlower} t-display`}>{c.flower}</h3>
              {c.flowerMeaning && (
                <p className={`${styles.floriographyMeaning} t-body`}>{c.flowerMeaning}</p>
              )}
            </div>
          )}
        </section>
      )}

      <section className={styles.lower}>
        <div className={styles.lowerGrid}>

          <div className={styles.artifactBlock}>
            <p className={`${styles.lowerLabel} t-deco`}>Artifact &amp; Sign</p>
            <h3 className={`${styles.artifactTitle} t-display`}>
              Carried by the {c.role.replace('The ', '').toLowerCase()}
            </h3>
            <p className={`${styles.artifactText} t-body`}>{c.artifact}</p>
            {c.stories?.[0] && (
              <img
                src={assetUrl(c.stories[0].src)}
                alt={c.stories[0].title}
                className={styles.artifactImg}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>

          {c.relations?.length > 0 ? (
            <div className={styles.relationsBlock}>
              <p className={`${styles.lowerLabel} t-deco`}>Relations in the Collective</p>
              <div className={styles.relations}>
                {c.relations.map(rel => {
                  const slug = typeof rel === 'string' ? rel : rel.slug;
                  const description = typeof rel === 'string' ? null : rel.description || null;
                  const r = CHARACTERS.find(x => x.slug === slug);
                  if (!r) return null;
                  return (
                    <button
                      key={slug}
                      className={`${styles.relation} glass`}
                      onClick={() => navigate(`/character/${slug}`)}
                    >
                      {r.img
                        ? <img src={assetUrl(r.img)} alt={r.role} className={styles.relationImg} loading="lazy" decoding="async" />
                        : <div className={styles.relationImg} style={{ background: r.hue + '44' }} />
                      }
                      <div>
                        <span className={`${styles.relationRole} t-display`}>{r.role}</span>
                        {(() => {
                          const note = description || c.relationNotes?.find(n => n.slug === slug)?.note;
                          return note ? <span className={`${styles.relationNote} t-body`}>{note}</span> : null;
                        })()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : <div className={styles.relationsBlock} />}

          <div className={styles.encountersBlock}>
            <p className={`${styles.lowerLabel} t-deco`}>Encounters</p>
            {charEncounters.length > 0 ? (
              <ul className={styles.encounterList}>
                {charEncounters.map(enc => (
                  <li key={enc.id}>
                    <button
                      className={`${styles.encounterItem} t-body`}
                      onClick={() => setActiveEncounter(enc)}
                    >
                      <span className={styles.encounterTitle}>{enc.title}</span>
                      <span className={`${styles.encounterMeta} t-deco`}>
                        {enc.participants
                          .filter(s => s !== c.slug)
                          .map(s => CHARACTERS.find(x => x.slug === s)?.role || s)
                          .join(' · ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${styles.encountersEmpty} t-body`}>No encounters recorded for this member yet.</p>
            )}
          </div>

        </div>
      </section>

      {activeEncounter && (
        <EncounterPanel encounter={activeEncounter} onClose={() => setActiveEncounter(null)} />
      )}

      {c.stories?.length > 1 && (
        <section className={styles.storyStrip}>
          <p className={`${styles.storyLabel} t-deco`}>· {c.storyLabel} ·</p>
          <div className={styles.storyGrid}>
            {c.stories.map(s => (
              <div key={s.title} className={styles.storyItem}>
                <div className={styles.storyImage} style={{ backgroundImage: `url(${assetUrl(s.src)})` }} />
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
          <AnimatedPortrait c={c} />
          <div className={`${styles.romanBadge} t-deco`}>{ROMAN[c.n]}</div>
        </div>

        <div className={styles.details}>
          <p className={`${styles.detailEyebrow} t-deco`}>
            {c.flower ? `${c.flower} · ${c.flowerMeaning}` : `Tier of the ${tier.short}`}
          </p>
          <h1 className={`${styles.detailName} t-display`}>{c.role}</h1>
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
