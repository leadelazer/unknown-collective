import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { to: '/',           label: 'Portal' },
  { to: '/collective', label: 'The Collective' },
  { to: '/tiers',      label: 'Tiers' },
  { to: '/manifesto',  label: 'Manifesto' },
  { to: '/chronicle',  label: 'Chronicle' },
  { to: '/about',      label: 'About' },
];

export default function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

      <span className={`${styles.location} t-deco`}>MMXXVI</span>

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
