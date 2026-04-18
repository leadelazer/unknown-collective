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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
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

      <ul className={styles.links}>
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

      <span className={`${styles.location} t-deco`}>München · MMXXVI</span>
    </nav>
  );
}
