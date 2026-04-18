import { useNavigate } from 'react-router-dom';
import { TIERS } from '../data/tiers.js';
import DecoRule from './DecoRule.jsx';
import styles from './Footer.module.css';

const NAV_LINKS = [
  { to: '/',           label: 'Portal' },
  { to: '/collective', label: 'The Collective' },
  { to: '/tiers',      label: 'Tiers' },
  { to: '/manifesto',  label: 'Manifesto' },
  { to: '/chronicle',  label: 'Chronicle' },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.about}>
          <p className={`${styles.title} t-display`}>The Collective</p>
          <p className={`${styles.blurb} t-body`}>
            An ever-unfolding narrative of twenty-two archetypes walking the streets.
            Begun in MMXX with the earliest speaking machines.
          </p>
        </div>

        <FooterCol title="Pages" items={NAV_LINKS.map(l => ({ label: l.label, to: l.to }))} navigate={navigate} />
        <FooterCol
          title="Tiers"
          items={Object.values(TIERS).map(t => ({ label: '· ' + t.name, to: '/tiers' }))}
          navigate={navigate}
        />

        <div>
          <p className={`${styles.colTitle} t-deco`}>Colophon</p>
          <p className={`${styles.colophon} t-body`}>
            Portraits &amp; botanics  – <br />
            diffusion models, 2020–2026.<br />
            Words  –  half human, half machine.<br />
            <span className={styles.year}>MMXXVI</span>.
          </p>
        </div>
      </div>

      <div className={styles.rule}><DecoRule /></div>
      <p className={`${styles.motto} t-deco`}>· In every hand a key · In every heart a story ·</p>
    </footer>
  );
}

function FooterCol({ title, items, navigate }) {
  return (
    <div>
      <p className={`${styles.colTitle} t-deco`}>{title}</p>
      <ul className={styles.colList}>
        {items.map(({ label, to }) => (
          <li key={label}>
            <button className={`${styles.colLink} t-body`} onClick={() => navigate(to)}>
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
