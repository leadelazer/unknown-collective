import { useState, useEffect } from 'react';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import DecoRule from '../components/DecoRule.jsx';
import DecoCorner from '../components/DecoCorner.jsx';
import styles from './Manifesto.module.css';

const PARAGRAPHS = [
  "We are twenty-two. We meet because the city needs reading, and because some of what is in it cannot be named without changing shape. We agreed, in 1698, not to name it.",
  "We do not solve. We read. The ledger, the drainage plan, the absence where a record should be, the room that goes cold without cause. We learn the grammar of what resists us, and we do not mistake that grammar for a puzzle to be closed.",
  "We disagree on purpose. Each of us is an axis the others need. A Collective that agreed about the Bind would already have lost to it.",
  "We keep what we cannot use yet. A name scratched out in pencil. A key found in a shuttle. A stem placed at the centre of an arrangement. What passes through us is stored, not resolved, and remains available to whoever comes after.",
  "This is what we offer the city: not protection, not escape, not a story that ends. Only that someone continues to read — carefully, and out loud enough that the reading survives us.",
];

export default function Manifesto() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    // Trigger the fade-in transition immediately upon mounting
    const id = setTimeout(() => {
      setVisible(PARAGRAPHS.length);
    }, 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <Nav />

      <section className={styles.content}>
        <div className={styles.cornerTL}><DecoCorner /></div>
        <div className={styles.cornerTR}><DecoCorner rotate={90} /></div>

        <p className={`${styles.eyebrow} t-deco`}>· A Pact in Five Movements ·</p>
        <h1 className={`${styles.title} t-display`}>Manifesto</h1>

        <div className={styles.ruleWrap}><DecoRule /></div>

        <div className={styles.paragraphs}>
          {PARAGRAPHS.map((p, i) => (
            <p
              key={i}
              className={`${styles.para} ${i === 0 ? styles.paraLead : ''} ${i === PARAGRAPHS.length - 1 ? styles.paraFinal : ''} t-body ${i < visible ? styles.paraVisible : ''}`}
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              {i === PARAGRAPHS.length - 1 && <span className={styles.fleuron}>⁂ </span>}
              {p}
            </p>
          ))}
        </div>

        <div className={styles.ruleWrap}><DecoRule /></div>
        <p className={`${styles.signed} t-deco`}> –  Signed, the Twenty-Two · by hand, by habit, by refusal  – </p>
      </section>

      <Footer />
    </div>
  );
}
