import { assetUrl } from '../utils/assetUrl.js';
import styles from './TextureBackdrop.module.css';

export default function TextureBackdrop({ opacity }) {
  const style = {
    backgroundImage: `url(${assetUrl('/assets/textures/dark-leaf-pattern.jpg')})`,
    ...(opacity !== undefined ? { '--backdrop-opacity': opacity } : {}),
  };
  return <div className={styles.backdrop} style={style} />;
}
