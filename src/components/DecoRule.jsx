import styles from './DecoRule.module.css';

export default function DecoRule({ diamond = true, char }) {
  return (
    <div className={styles.rule} style={char ? { '--deco-char': `'${char}'` } : undefined}>
      <div className={styles.line} />
      {diamond && <span className={styles.diamond} />}
      <div className={styles.line} />
    </div>
  );
}
