import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHARACTERS } from '../data/characters.js';
import { ROMAN } from '../data/tiers.js';
import { MODERN_QUESTIONS } from '../data/questions.js';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import DecoRule from '../components/DecoRule.jsx';
import DecoCorner from '../components/DecoCorner.jsx';
import { assetUrl } from '../utils/assetUrl.js';
import styles from './Home.module.css';

const HOME_PORTRAIT_SIZES = '(max-width: 768px) 62vw, (max-width: 1200px) 30vw, 300px';

function getPortraitBaseName(imgPath) {
  if (!imgPath) return null;
  const file = String(imgPath).split('/').pop() || '';
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : null;
}

function pickFeaturedCharacters() {
  const indices = new Set();

  while (indices.size < 3) {
    indices.add(Math.floor(Math.random() * CHARACTERS.length));
  }

  return Array.from(indices).map(i => CHARACTERS[i]);
}

function HomePortrait({ character, priority = false }) {
  const baseName = getPortraitBaseName(character.img);

  if (!character.img || !baseName) {
    return (
      <img
        src={assetUrl(character.img)}
        alt={character.role}
        className={styles.portraitImage}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
      />
    );
  }

  return (
    <picture>
      <source
        type="image/avif"
        srcSet={[
          `${assetUrl(`/assets/echos/optimized/${baseName}-480.avif`)} 480w`,
          `${assetUrl(`/assets/echos/optimized/${baseName}-960.avif`)} 960w`,
        ].join(', ')}
        sizes={HOME_PORTRAIT_SIZES}
      />
      <source
        type="image/webp"
        srcSet={[
          `${assetUrl(`/assets/echos/optimized/${baseName}-480.webp`)} 480w`,
          `${assetUrl(`/assets/echos/optimized/${baseName}-960.webp`)} 960w`,
        ].join(', ')}
        sizes={HOME_PORTRAIT_SIZES}
      />
      <img
        src={assetUrl(`/assets/echos/optimized/${baseName}-960.webp`)}
        alt={character.role}
        className={styles.portraitImage}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
      />
    </picture>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <div className={styles.vignette} />
      <Nav />
      <HeroSection navigate={navigate} />
      <QuestionsStrip />
      <Footer />
    </div>
  );
}

function HeroSection({ navigate }) {
  const [typed, setTyped] = useState('');
  const full = 'A study in what actually remains.';

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.cornerTL}><DecoCorner /></div>
      <div className={styles.cornerTR}><DecoCorner rotate={90} /></div>

      <div className={styles.heroGrid}>
        <div className={styles.heroText}>
          <p className={`${styles.eyebrow} t-deco`}>An Evolving Narrative</p>

          <h1 className={`${styles.headline} t-display`}>
            The unknown<br />
            <span className={styles.headlineAccent}>Collective</span>
          </h1>

          <div className={styles.ruleWrap}><DecoRule /></div>

          <p className={`${styles.tagline} t-body`}>
            {typed}
          </p>

          <p className={`${styles.intro} t-body`}>
            Everything has a price, and most of it isn't worth it. But beneath the transactions, these twenty-two ghosts are still working. It's a mirror, not a story. Take a look. You might finally recognize yourself.
          </p>

          <div className={styles.ctas}>
            <button className={`${styles.ctaPrimary} t-deco`} onClick={() => navigate('/collective')}>
              Enter the Archive
            </button>
            <button className={`${styles.ctaSecondary} t-deco`} onClick={() => navigate('/about')}>
              About this Project
            </button>
          </div>
        </div>

        <FeaturedPortraits navigate={navigate} />
      </div>
    </section>
  );
}

function FeaturedPortraits({ navigate }) {
  const [featured] = useState(() => pickFeaturedCharacters());
  const [hover, setHover] = useState(1);

  return (
    <div className={styles.portraits}>
      {featured.map((c, i) => (
        <button
          key={c.slug}
          className={`${styles.portrait} ${hover === i ? styles.portraitActive : ''}`}
          style={{ '--portrait-index': i }}
          onMouseEnter={() => setHover(i)}
          onClick={() => navigate(`/character/${c.slug}`)}
        >
          <div className={styles.portraitFrame} />
          <HomePortrait character={c} priority />
          <div className={`${styles.portraitNum} t-deco`}>{ROMAN[c.n]}</div>
          <div className={styles.portraitCaption}>
            <span className={`${styles.portraitArcana} t-deco`}>{c.arcana}</span>
            <span className={`${styles.portraitRole} t-display`}>{c.role}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function QuestionsStrip() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % MODERN_QUESTIONS.length), 5500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className={styles.questions}>
      <TextureBackdrop opacity={0.2} />
      <p className={`${styles.questionsLabel} t-deco`}>
        Modern Questions · N° {String(idx + 1).padStart(2, '0')} / {MODERN_QUESTIONS.length}
      </p>
      <blockquote className={`${styles.question} t-display`} key={idx}>
        <span className={styles.quoteChar}>"</span>
        {MODERN_QUESTIONS[idx]}
        <span className={styles.quoteChar}>"</span>
      </blockquote>
      <div className={styles.dots}>
        {MODERN_QUESTIONS.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === idx ? styles.dotActive : ''}`}
            onClick={() => setIdx(i)}
            aria-label={`Question ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
