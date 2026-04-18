import styles from './DecoRule.module.css';

export default function DecoRule({ diamond = true }) {
  return (
    <div className={styles.rule}>
      <div className={styles.line} />
      {diamond && (
        <svg className={styles.diamond} width="10" height="10" viewBox="0 0 10 10">
          <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" />
        </svg>
      )}
      <div className={styles.line} />
    </div>
  );
}
