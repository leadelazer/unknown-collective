import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHARACTERS } from '../data/characters.js';
import { TIERS } from '../data/tiers.js';
import { resolveCharacterPalette } from '../data/paletteSystem.js';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import { assetUrl } from '../utils/assetUrl.js';
import styles from './Collective.module.css';

const CARD_IMAGE_SIZES = '(max-width: 768px) 48vw, (max-width: 1200px) 31vw, 23vw';

function getPortraitBaseName(imgPath) {
  if (!imgPath) return null;
  const file = String(imgPath).split('/').pop() || '';
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : null;
}

function OptimizedPortrait({ img, role }) {
  const [failed, setFailed] = useState(false);
  const baseName = getPortraitBaseName(img);

  if (!img || !baseName || failed) {
    return <img src={assetUrl(img)} alt={role} className={styles.cardImage} loading="lazy" decoding="async" />;
  }

  return (
    <img
      src={assetUrl(`/assets/echos/optimized/${baseName}-960.webp`)}
      srcSet={[
        `${assetUrl(`/assets/echos/optimized/${baseName}-480.webp`)} 480w`,
        `${assetUrl(`/assets/echos/optimized/${baseName}-960.webp`)} 960w`,
      ].join(', ')}
      sizes={CARD_IMAGE_SIZES}
      alt={role}
      className={styles.cardImage}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function Collective() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const list = filter === 'all' ? CHARACTERS : CHARACTERS.filter(c => c.tier === filter);

  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <Nav />
      <section className={styles.header}>
        <p className={`${styles.eyebrow} t-deco`}>Twenty-two · Major Arcana of the City</p>
        <h1 className={`${styles.title} t-display`}>
          The <span className={styles.titleAccent}>Collective</span>
        </h1>
        <p className={`${styles.intro} t-body`}>
          Each hand, a key. Every key, a tale. Hover a portrait to hear what they keep;
          click to read the record.
        </p>

        <div className={styles.filterBar}>
          <span className={`${styles.filterLabel} t-deco`}>Tier</span>
          {[['all', 'All'], ...Object.entries(TIERS).map(([key, tier]) => [key, tier.name])].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`${styles.filterBtn} t-deco ${filter === key ? styles.filterActive : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        {list.map(c => <CharCard key={c.slug} c={c} navigate={navigate} />)}
      </section>

      <Footer />
    </div>
  );
}

function CharCard({ c, navigate }) {
  const [hov, setHov] = useState(false);
  const palette = resolveCharacterPalette(c);

  return (
    <article
      className={`${styles.card} ${hov ? styles.cardHover : ''}`}
      style={{
        '--card-primary': palette[0],
        '--card-secondary': palette[1],
        '--card-tertiary': palette[2],
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate(`/character/${c.slug}`)}
    >
      <div className={`${styles.cardMeta} t-deco`}>
        <span>N° {String(c.n).padStart(2, '0')}</span>
        <span className={styles.cardTier}>{TIERS[c.tier].short.toUpperCase()}</span>
      </div>

      <div className={styles.cardImageWrap}>
        {c.img ? (
          <OptimizedPortrait img={c.img} role={c.role} />
        ) : (
          <PortraitPlaceholder role={c.role} hue={c.hue} />
        )}

        <div className={styles.cardOverlay}>
          <div className={styles.cardPalette} aria-label={`${c.role} palette`}>
            {palette.map((hex, index) => (
              <span
                key={`${c.slug}-${hex}-${index}`}
                className={styles.cardPaletteSwatch}
                style={{ background: hex }}
                title={hex}
              />
            ))}
          </div>
          <span className={`${styles.cardRole} t-display`}>{c.role}</span>
          <span className={`${styles.cardEssence} t-body`}>{c.essence}</span>
        </div>

        <div className={styles.cardCorner} />
      </div>
    </article>
  );
}

export function PortraitPlaceholder({ role, hue }) {
  return (
    <div className={styles.placeholder} style={{ '--hue': hue }}>
      <div className={styles.placeholderPattern} />
      <span className={`${styles.placeholderLabel} t-deco`}>{role.toUpperCase()}</span>
    </div>
  );
}
