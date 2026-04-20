import { useState, useEffect } from 'react';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import DecoRule from '../components/DecoRule.jsx';
import DecoCorner from '../components/DecoCorner.jsx';
import styles from './Manifesto.module.css';

const PARAGRAPHS = [
  "We, the Collective, stand unified in our diversity, weaving an intricate tapestry that breathes life into the heart of the city.",
  "We embrace the timeless dance between shadow and light, chaos and order, the tangible and intangible. We are the keepers of balance, harmony, and the rhythm of existence.",
  "We believe in the power of stories, in their ability to shape reality, to give meaning to the mundane, and to echo through time. We vow to preserve these narratives, honoring the past and inspiring the future.",
  "This is our pact, our promise, our pledge to the city. Through our collective efforts, we strive to maintain the balance, to keep the rhythm, to preserve the harmony.",
  "For in every hand, a key; in every heart, a story. This is the Collective, forever intertwined with the city, forever shaping its story.",
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
        <p className={`${styles.signed} t-deco`}> –  Signed, the Twenty-Two  – </p>
      </section>

      <Footer />
    </div>
  );
}
