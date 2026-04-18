import styles from './DecoCorner.module.css';

export default function DecoCorner({ size = 42, rotate = 0 }) {
  return (
    <svg
      className={styles.corner}
      width={size}
      height={size}
      viewBox="0 0 42 42"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M1 1 L41 1 L41 3 L3 3 L3 41 L1 41 Z" fill="currentColor" opacity="0.9" />
      <path d="M6 6 L36 6 M6 6 L6 36" stroke="currentColor" strokeWidth="0.5" opacity="0.6" fill="none" />
      <circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.8" />
      <path d="M10 6 Q 10 10, 14 10 M10 6 Q 14 6, 14 10" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  );
}
