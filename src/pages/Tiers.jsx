import { useNavigate } from 'react-router-dom';
import { TIERS } from '../data/tiers.js';
import { CHARACTERS } from '../data/characters.js';
import { getTierChroma, resolveCharacterPalette } from '../data/paletteSystem.js';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import { PortraitPlaceholder, OptimizedPortrait } from './Collective.jsx';
import styles from './Tiers.module.css';

export default function Tiers() {
  const navigate = useNavigate();
  const byTier = Object.entries(TIERS).map(([key, t]) => ({
    key, ...t,
    chroma: getTierChroma(key),
    chars: CHARACTERS.filter(c => c.tier === key),
  }));

  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <Nav />

      <section className={styles.header}>
        <p className={`${styles.eyebrow} t-deco`}>Five Orders · One Body</p>
        <h1 className={`${styles.title} t-display`}>
          The <span className={styles.titleAccent}>Orders</span>
        </h1>
        <p className={`${styles.intro} t-body`}>
          The Collective is not ranked. It is ordered by the kind of work each member
          does against the Bind — by whether the work is done in soil, in the archive,
          on a threshold, or somewhere the records cannot quite reach. These are the
          five Orders as they appear in the admission ledger: descriptions of function,
          not of standing.
        </p>
      </section>

      <section className={styles.tiers}>
        {byTier.map(t => (
          <div key={t.key} className={styles.tier}>
            <div className={styles.tierInfo}>
              <p className={`${styles.tierOrder} t-deco`}>Order · {t.roman}</p>
              <h2 className={`${styles.tierName} t-display`}>{t.name}</h2>
              <p className={`${styles.tierGist} t-body`}> –  {t.gist}</p>
              <p className={`${styles.tierBlurb} t-body`}>{t.blurb}</p>
              <p className={`${styles.tierPaletteLabel} t-deco`}>{t.chroma.title}</p>
              <p className={`${styles.tierPaletteNote} t-body`}>{t.chroma.description}</p>
            </div>

            <div className={styles.tierChars}>
              {t.chars.map(c => {
                const palette = resolveCharacterPalette(c);

                return (
                <button key={c.slug} className={styles.charBtn} onClick={() => navigate(`/character/${c.slug}`)}>
                  <div className={styles.charImg}>
                    {c.img
                      ? <OptimizedPortrait img={c.img} role={c.role} className={styles.charImgEl} />
                      : <PortraitPlaceholder role={c.role} hue={c.hue} />
                    }
                  </div>
                  <div className={styles.charPalette} aria-label={`${c.role} palette`}>
                    {palette.map((hex, index) => (
                      <span
                        key={`${c.slug}-${hex}-${index}`}
                        className={styles.charPaletteSwatch}
                        style={{ background: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                  <p className={`${styles.charRole} t-display`}>{c.role}</p>
                </button>
              );})}
            </div>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
