import styles from './TextureBackdrop.module.css';

export default function TextureBackdrop({ opacity }) {
  const style = {
    ...(opacity !== undefined ? { '--backdrop-opacity': opacity } : {}),
  };
  return <div className={styles.backdrop} style={style} />;
}
