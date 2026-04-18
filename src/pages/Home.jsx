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
import styles from './Home.module.css';

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
            <button className={`${styles.ctaSecondary} t-deco`} onClick={() => navigate('/manifesto')}>
              Read the Manifesto
            </button>
          </div>
        </div>

        <FeaturedPortraits navigate={navigate} />
      </div>
    </section>
  );
}

function FeaturedPortraits({ navigate }) {
  const [featured] = useState(() => {
    const indices = new Set();
    while (indices.size < 3) {
      indices.add(Math.floor(Math.random() * CHARACTERS.length));
    }
    return Array.from(indices).map(i => CHARACTERS[i]);
  });
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
          <div className={styles.portraitImage} style={{ backgroundImage: `url(${c.img})` }} />
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
