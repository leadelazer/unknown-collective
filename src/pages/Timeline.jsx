import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import EncounterPanel from '../components/EncounterPanel.jsx';
import InterpretationsPanel from '../components/InterpretationsPanel.jsx';
import { TIMELINE_ENTRIES } from '../data/timeline.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { assetUrl } from '../utils/assetUrl.js';
import { inlineMarkdown } from '../utils/inlineMarkdown.js';
import styles from './Timeline.module.css';

function getPortraitBaseName(imgPath) {
  if (!imgPath) return null;
  const file = String(imgPath).split('/').pop() || '';
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : null;
}

function OptimizedPortrait({ img, role, hidden }) {
  const [failed, setFailed] = useState(false);
  const baseName = getPortraitBaseName(img);

  if (!img || !baseName || failed) {
    return <img src={assetUrl(img)} alt={role} className={styles.icPortrait} loading="lazy" decoding="async" style={hidden ? { visibility: 'hidden' } : undefined} />;
  }

  return (
    <img
      src={assetUrl(`/assets/echos/optimized/${baseName}-960.webp`)}
      srcSet={[
        `${assetUrl(`/assets/echos/optimized/${baseName}-480.webp`)} 480w`,
        `${assetUrl(`/assets/echos/optimized/${baseName}-960.webp`)} 960w`,
      ].join(', ')}
      sizes="(max-width: 768px) 48vw, (max-width: 1200px) 31vw, 23vw"
      alt={role}
      className={styles.icPortrait}
      loading="lazy"
      decoding="async"
      style={hidden ? { visibility: 'hidden' } : undefined}
      onError={() => setFailed(true)}
    />
  );
}

const PX_PER_YEAR = 14;
const EDGE_PAD_YEARS = 8;
const LEVELS = 5;
const LEVEL_STEP = 48;
const LABEL_MIN_WIDTH = 104;
const LABEL_MAX_WIDTH = 186;
const LABEL_CHAR_PX = 8.8;
const LABEL_GAP = 14;
const LABEL_HEIGHT = 38;
const AXIS_OFFSET_TOP = 246;
const DIAMOND_Y = AXIS_OFFSET_TOP + 34;

export default function Timeline() {
  const navigate = useNavigate();
  const scrollerRef = useRef(null);
  const dotRefs = useRef({});
  const encRefs = useRef({});
  const scrollTriggeredByKey = useRef(false);
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [scrollEncounterIntoView, setScrollEncounterIntoView] = useState(false);
  const [showInterpretations, setShowInterpretations] = useState(false);
  const [infoVideoVisible, setInfoVideoVisible] = useState(false);
  const [infoVideoFailed, setInfoVideoFailed] = useState(false);
  const [infoVideoEnded, setInfoVideoEnded] = useState(false);
  const infoVideoRef = useRef(null);
  const encArticleRef = useRef(null);

  useEffect(() => {
    if (!infoVideoVisible || infoVideoEnded || !infoVideoRef.current) return;
    infoVideoRef.current.play().catch(() => {});
  }, [infoVideoVisible, infoVideoEnded]);

  useEffect(() => {
    if (!activeEncounter || !scrollEncounterIntoView || !scrollerRef.current) return;
    const node = encRefs.current[activeEncounter.id];
    if (!node) return;

    const nodeRect = node.getBoundingClientRect();
    const scrollerRect = scrollerRef.current.getBoundingClientRect();
    const nodeCenter = scrollerRef.current.scrollLeft + (nodeRect.left - scrollerRect.left) + nodeRect.width / 2;
    scrollerRef.current.scrollTo({ left: Math.max(0, nodeCenter - scrollerRef.current.clientWidth / 2), behavior: 'smooth' });
    setScrollEncounterIntoView(false);
  }, [activeEncounter, scrollEncounterIntoView]);

  const dated = useMemo(
    () => TIMELINE_ENTRIES.filter(e => e.hasPrecisePlacement).sort((a, b) => a.sortStart - b.sortStart || a.n - b.n),
    []
  );
  const undated = useMemo(() => TIMELINE_ENTRIES.filter(e => !e.hasPrecisePlacement), []);

  const datedEncounters = useMemo(() => {
    return ENCOUNTERS
      .filter(e => e.hasContent)
      .map(e => {
        const match = e.title.match(/\b(1[0-9]{3}|2[0-9]{3})\b/);
        if (!match) return null;
        return { ...e, year: parseInt(match[0]), type: 'encounter' };
      })
      .filter(Boolean);
  }, []);

  const timelineStartYears = [
    ...dated.map(e => e.sortStart),
    ...datedEncounters.map(e => e.year),
  ];
  const timelineEndYears = [
    ...dated.map(e => e.sortEnd ?? e.sortStart),
    ...datedEncounters.map(e => e.year),
  ];

  const minYear = Math.floor((Math.min(...timelineStartYears) - EDGE_PAD_YEARS) / 10) * 10;
  const maxYear = Math.ceil((Math.max(...timelineEndYears) + EDGE_PAD_YEARS) / 10) * 10;
  const axisWidth = (maxYear - minYear) * PX_PER_YEAR;

  const decades = [];
  for (let y = minYear; y <= maxYear; y += 10) decades.push(y);

  const staggered = useMemo(() => {
    const laneRights = Array(LEVELS).fill(-Infinity);
    return dated.map(entry => {
      const labelWidth = Math.max(LABEL_MIN_WIDTH, Math.min(LABEL_MAX_WIDTH, Math.round(entry.role.length * LABEL_CHAR_PX)));
      const x = xFor(entry.sortStart);
      let level = 0;
      let fallbackLevel = 0;
      let smallestOverflow = Infinity;

      for (let i = 0; i < LEVELS; i++) {
        const leftEdge = x - labelWidth / 2;
        const overflow = laneRights[i] - leftEdge;
        if (leftEdge >= laneRights[i] + LABEL_GAP) {
          level = i;
          fallbackLevel = i;
          smallestOverflow = -Infinity;
          break;
        }
        if (overflow < smallestOverflow) {
          smallestOverflow = overflow;
          fallbackLevel = i;
        }
      }

      if (smallestOverflow !== -Infinity) level = fallbackLevel;
      laneRights[level] = x + labelWidth / 2;
      return { ...entry, level, labelWidth };
    });
  }, [dated]);

  const stageHeight = AXIS_OFFSET_TOP + 100;

  const [activeId, setActiveId] = useState(`char:${staggered[0]?.slug || ''}`);

  const activeSlug = activeId?.replace('char:', '') || null;

  useEffect(() => {
    setInfoVideoVisible(false);
    setInfoVideoFailed(false);
    setInfoVideoEnded(false);
    if (infoVideoRef.current) {
      infoVideoRef.current.currentTime = 0;
    }
  }, [activeId]);

  const active = useMemo(() => {
    return (
      staggered.find(e => e.slug === activeSlug) ||
      undated.find(e => e.slug === activeSlug) ||
      staggered[0]
    );
  }, [activeId, staggered, undated, activeSlug]);

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const all = [...staggered, ...undated];
      const idx = all.findIndex(x => `char:${x.slug}` === activeId);
      if (idx === -1) return;
      const next = e.key === 'ArrowRight' ? Math.min(all.length - 1, idx + 1) : Math.max(0, idx - 1);
      scrollTriggeredByKey.current = true;
      setActiveId(`char:${all[next].slug}`);
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, staggered, undated]);

  useEffect(() => {
    if (!scrollTriggeredByKey.current) return;
    scrollTriggeredByKey.current = false;
    if (!activeSlug) return;
    const node = dotRefs.current[activeSlug];
    const scroller = scrollerRef.current;
    if (!node || !scroller) return;
    const nodeRect = node.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const nodeCenter = scroller.scrollLeft + (nodeRect.left - scrollerRect.left) + nodeRect.width / 2;
    scroller.scrollTo({ left: Math.max(0, nodeCenter - scroller.clientWidth / 2), behavior: 'smooth' });
  }, [activeId]);

  function xFor(year) {
    return (year - minYear) * PX_PER_YEAR;
  }

  const certaintyLabel = {
    exact: 'Exact',
    range: 'Range',
    approx: 'Approximate',
    era: 'Era',
    legendary: 'Legend',
    undated: 'Undated',
  };

  const activeTitle = active?.role;
  const activeEvent = active?.eventLabel;
  const activeSummary = active?.summary;

  function handleOpenActive() {
    if (!active) return;
    navigate(`/character/${active.slug}`);
  }

  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <Nav />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={`${styles.eyebrow} t-deco`}>Chronology</p>
          <h1 className={`${styles.title} t-display`}>
            The <span className={styles.titleAccent}>Timeline</span>
          </h1>
          <p className={`${styles.intro} t-body`}>
            Click any mark to read its moment. Double-click to open. Drag or arrow-keys to travel.
          </p>
          <button
            className={`${styles.interpretationsBtn} t-deco`}
            onClick={() => setShowInterpretations(true)}
          >
            Agent Interpretations →
          </button>
        </div>

        <div className={`${styles.infoCard} glass`} key={activeId}>
          {active?.img && (
            <div className={styles.icPortraitWrap}>
              <OptimizedPortrait img={active.img} role={activeTitle} hidden={infoVideoVisible} />
              <video
                ref={infoVideoRef}
                className={`${styles.icPortraitVideo} ${infoVideoVisible ? styles.icPortraitVideoVisible : ''}`}
                src={assetUrl(`/assets/echos/videos/${activeSlug}.mp4`)}
                muted
                playsInline
                preload="metadata"
                onCanPlay={() => setInfoVideoVisible(true)}
                onEnded={() => setInfoVideoEnded(true)}
                onError={() => setInfoVideoFailed(true)}
              />
              <div className={`${styles.icPortraitShade} ${infoVideoEnded ? styles.icVignetteDim : ''}`} />
            </div>
          )}

          <div className={styles.icBody}>
            <span className={`${styles.icLabel} t-deco`}>Selected record</span>
            <span className={`${styles.icTitle} t-display`}>{activeTitle}</span>
            {activeSummary && <p className={`${styles.icSummary} t-body`}>{activeSummary}</p>}
            <div className={styles.icFooter}>
              {activeEvent && <span className={styles.icEvent}>{activeEvent}</span>}
              <button className={`${styles.icAction} t-deco`} onClick={handleOpenActive}>Open profile →</button>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.axisSection}>
        <div className={styles.axisFrame}>
        <div className={styles.scroller} ref={scrollerRef}>
          <div className={styles.axisStage} style={{ width: `${axisWidth + 160}px` }}>
            <div className={styles.stageInner} style={{ width: `${axisWidth}px`, marginLeft: '80px', minHeight: `${stageHeight}px` }}>

              {/* Labels above axis */}
              {staggered.map(entry => {
                const x = xFor(entry.sortStart);
                const top = AXIS_OFFSET_TOP - 24 - entry.level * LEVEL_STEP;
                const isActive = activeSlug === entry.slug;
                return (
                  <button
                    key={`label-${entry.slug}`}
                    className={`${styles.label} ${isActive ? styles.labelActive : ''}`}
                    style={{ left: `${x}px`, top: `${top}px`, width: `${entry.labelWidth}px` }}
                    onClick={() => setActiveId(`char:${entry.slug}`)}
                  >
                    <span className={styles.labelYear}>{entry.displayDate}</span>
                    <span className={styles.labelRole}>{entry.role}</span>
                  </button>
                );
              })}

              {/* Leader lines — characters only */}
              <svg className={styles.leaders} width={axisWidth} height={AXIS_OFFSET_TOP} aria-hidden="true">
                {staggered.map(entry => {
                  const x = xFor(entry.sortStart);
                  const top = AXIS_OFFSET_TOP - 24 - entry.level * LEVEL_STEP;
                  const isActive = activeSlug === entry.slug;
                  return (
                    <line
                      key={`leader-${entry.slug}`}
                      x1={x} x2={x}
                      y1={top} y2={AXIS_OFFSET_TOP}
                      className={`${styles.leader} ${isActive ? styles.leaderActive : ''}`}
                    />
                  );
                })}
              </svg>

              {/* The axis */}
              <div className={styles.axis} style={{ top: `${AXIS_OFFSET_TOP}px`, width: `${axisWidth}px` }} />

              {/* Decade / century ticks */}
              {decades.map(y => {
                const isCentury = y % 100 === 0;
                return (
                  <div
                    key={`tick-${y}`}
                    className={`${styles.tick} ${isCentury ? styles.tickCentury : ''}`}
                    style={{ left: `${xFor(y)}px`, top: `${AXIS_OFFSET_TOP}px` }}
                  >
                    {isCentury && <span className={styles.tickLabel}>{y}</span>}
                  </div>
                );
              })}

              {/* Encounter diamonds — click loads article below */}
              {datedEncounters.map(enc => {
                const x = xFor(enc.year);
                const fullEnc = ENCOUNTERS.find(e => e.id === enc.id);
                const isActive = activeEncounter?.id === enc.id;
                const shortTitle = enc.title.split(/\s*[—–-]\s*/)[0].trim();
                return (
                  <div
                    key={`enc-${enc.id}`}
                    className={styles.diamondWrap}
                    style={{ left: `${x}px`, top: `${DIAMOND_Y}px` }}
                  >
                    <button
                      ref={node => {
                        if (node) encRefs.current[enc.id] = node;
                        else delete encRefs.current[enc.id];
                      }}
                      className={`${styles.diamond} ${isActive ? styles.diamondActive : ''}`}
                      onClick={() => setActiveEncounter(isActive ? null : (fullEnc || enc))}
                      aria-label={enc.title}
                    />
                    <span className={`${styles.diamondLabel} t-deco`}>{shortTitle}</span>
                  </div>
                );
              })}

              {/* Character dots on the axis */}
              {staggered.map(entry => {
                const x = xFor(entry.sortStart);
                const durEnd = entry.sortEnd ?? entry.sortStart;
                const durWidth = Math.max(0, (durEnd - entry.sortStart) * PX_PER_YEAR);
                const isActive = activeSlug === entry.slug;
                const dotClass = [
                  styles.dot,
                  styles[`dot_${entry.certainty}`],
                  isActive ? styles.dotActive : '',
                ].join(' ');
                return (
                  <div key={`dot-${entry.slug}`}>
                    {durWidth > 0 && (
                      <span
                        className={`${styles.duration} ${isActive ? styles.durationActive : ''}`}
                        style={{ left: `${x}px`, width: `${durWidth}px`, top: `${AXIS_OFFSET_TOP}px` }}
                      />
                    )}
                    <button
                      ref={node => {
                        if (node) dotRefs.current[entry.slug] = node;
                        else delete dotRefs.current[entry.slug];
                      }}
                      className={dotClass}
                      style={{ left: `${x}px`, top: `${AXIS_OFFSET_TOP}px` }}
                      onClick={() => setActiveId(`char:${entry.slug}`)}
                      onDoubleClick={() => navigate(`/character/${entry.slug}`)}
                      aria-label={`${entry.role}, ${entry.displayDate}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>

        {undated.length > 0 && (
          <div className={styles.undated}>
            <p className={styles.undatedLabel}>Undated · Outside the chronology</p>
            <div className={styles.undatedRow}>
              {undated.map(entry => {
                const isActive = activeSlug === entry.slug;
                return (
                  <button
                    key={entry.slug}
                    className={`${styles.undatedDot} ${isActive ? styles.undatedDotActive : ''}`}
                    onClick={() => setActiveId(`char:${entry.slug}`)}
                    onDoubleClick={() => navigate(`/character/${entry.slug}`)}
                  >
                    <span className={`${styles.undatedRole} t-deco`}>{entry.role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </section>

      {/* ── Recorded Encounters section ── */}
      <section className={styles.encounterSection}>
        <aside className={styles.encSidebar}>
          <span className={`${styles.encNavLabel} t-deco`}>Recorded Encounters</span>
          <div className={styles.encPills}>
            {datedEncounters.map(enc => {
              const fullEnc = ENCOUNTERS.find(e => e.id === enc.id);
              const isActive = activeEncounter?.id === enc.id;
              return (
                <button
                  key={enc.id}
                  className={`${styles.encPill} ${isActive ? styles.encPillActive : ''}`}
                  onClick={() => {
                    if (isActive) {
                      setActiveEncounter(null);
                      setScrollEncounterIntoView(false);
                    } else {
                      setActiveEncounter(fullEnc || enc);
                      setScrollEncounterIntoView(true);
                    }
                  }}
                >
                  <span className={`${styles.encPillYear} t-deco`}>{enc.year}</span>
                  <span className={styles.encPillTitle}>{enc.title.split(/\s*[—–-]\s*/)[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className={styles.encContent}>
          {activeEncounter ? (
            <article className={styles.encArticle} key={activeEncounter.id} ref={encArticleRef}>
              <button className={`${styles.encArticleClose} t-deco`} onClick={() => setActiveEncounter(null)}>✕ Close</button>
              <header className={styles.encArticleHeader}>
                <h2 className={`${styles.encArticleTitle} t-display`}>{activeEncounter.title}</h2>
                {activeEncounter.participants?.length > 0 && (
                  <div className={styles.encArticleParticipants}>
                    {activeEncounter.participants.map(slug => {
                      const char = TIMELINE_ENTRIES.find(e => e.slug === slug);
                      return char ? (
                        <button key={slug} className={styles.encParticipant} onClick={() => navigate(`/character/${slug}`)}>
                          {char.img && (
                            <span
                              className={styles.encParticipantAvatar}
                              style={{ backgroundImage: `url(${assetUrl(char.img)})` }}
                            />
                          )}
                          <span className={`${styles.encParticipantName} t-deco`}>{char.role}</span>
                        </button>
                      ) : null;
                    })}
                  </div>
                )}
              </header>
              <div className={styles.encArticleBody}>
                {activeEncounter.body?.split(/\n\n+/).map((para, i) => {
                  if (para.startsWith('## ')) return <h3 key={i} className={`${styles.encBodyHeading} t-deco`}>{para.slice(3)}</h3>;
                  if (para.startsWith('# ')) return <h2 key={i} className={`${styles.encBodyHeadingLg} t-display`}>{para.slice(2)}</h2>;
                  return (
                    <p
                      key={i}
                      className={`${styles.encBodyPara} t-body`}
                      dangerouslySetInnerHTML={{ __html: inlineMarkdown(para.trim()) }}
                    />
                  );
                })}
              </div>
            </article>
          ) : (
            <p className={`${styles.encPrompt} t-deco`}>Select an encounter above or from the list →</p>
          )}
        </div>
      </section>

      <Footer />

      {showInterpretations && (
        <InterpretationsPanel onClose={() => setShowInterpretations(false)} />
      )}
    </div>
  );
}
