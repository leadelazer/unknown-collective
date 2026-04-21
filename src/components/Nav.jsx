import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { to: '/',           label: 'Portal' },
  { to: '/collective', label: 'The Collective' },
  { to: '/tiers',      label: 'Tiers' },
  { to: '/manifesto',  label: 'Manifesto' },
  { to: '/timeline',   label: 'Timeline' },
  { to: '/about',      label: 'About' },
];

export default function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem('uc-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [chroma, setChroma] = useState(() => {
    const stored = window.localStorage.getItem('uc-chroma');
    const parsed = stored !== null ? parseInt(stored, 10) : NaN;
    return !isNaN(parsed) ? parsed : 137;
  });
  const [chromaOpen, setChromaOpen] = useState(false);
  const chromaRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('uc-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-hue', String(chroma));
    window.localStorage.setItem('uc-chroma', String(chroma));
  }, [chroma]);

  useEffect(() => {
    if (!chromaOpen) return;
    const handleClickOutside = (e) => {
      if (chromaRef.current && !chromaRef.current.contains(e.target)) {
        setChromaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [chromaOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className={`${styles.nav} ${isScrolled ? styles.blurred : ''}`}>
      <button className={styles.logo} onClick={() => navigate('/')}>
        <svg width="28" height="28" viewBox="0 0 28 28" className={styles.logoMark}>
          <circle cx="14" cy="14" r="13" strokeWidth="0.8" fill="none" />
          <path d="M14 2 L14 26 M2 14 L26 14" strokeWidth="0.4" opacity="0.5" fill="none" />
          <path d="M14 6 L18 14 L14 22 L10 14 Z" opacity="0.9" />
        </svg>
        <span className="t-deco">The Collective</span>
      </button>

      <ul className={`${styles.links} ${menuOpen ? styles.menuOpen : ''}`}>
        {NAV_LINKS.map(({ to, label }) => (
          <li key={to}>
            <button
              onClick={() => navigate(to)}
              className={`${styles.link} t-deco ${pathname === to ? styles.active : ''}`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.navEnd}>
        <span className={`${styles.location} t-deco`}>
          MMXXVI
          <span className={styles.locationSep} aria-hidden="true"> / </span>
          <button
            className={`${styles.themeToggle} t-deco`}
            onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle light and dark theme"
            type="button"
          >
            {theme === 'dark' ? 'LUX' : 'NOX'}
          </button>
          <span className={styles.locationSep} aria-hidden="true"> / </span>
          <span className={styles.chromaWrap} ref={chromaRef}>
            <button
              className={`${styles.chromaToggle} t-deco ${chromaOpen ? styles.chromaToggleOpen : ''}`}
              onClick={() => setChromaOpen(o => !o)}
              aria-label="Select hue"
              aria-expanded={chromaOpen}
              type="button"
            >
              CHROMA
              <span
                className={styles.chromaDot}
                style={{ '--swatch-hue': chroma }}
                aria-hidden="true"
              />
            </button>
            {chromaOpen && (
              <div className={styles.chromaFlyout} role="dialog" aria-label="Hue selection">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={chroma}
                  onChange={e => setChroma(Number(e.target.value))}
                  className={styles.chromaSlider}
                  aria-label="Hue"
                />
                <div className={styles.chromaSliderTrack} aria-hidden="true" />
              </div>
            )}
          </span>
        </span>
      </div>

      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {menuOpen ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M4 4 L16 16 M16 4 L4 16" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M3 5 L17 5 M3 10 L17 10 M3 15 L17 15" />
          </svg>
        )}
      </button>
    </nav>
  );
}
