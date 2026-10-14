import Image from "next/image";
import styles from "./splash.module.css";

/**
 * Launch screen: the UniGo logo pops in with a ripple, the name and tagline rise, then the
 * whole layer fades away. Pure CSS, so it plays on every full load (opening or refreshing the
 * app) and stays out of the way during in-app navigation.
 */
export function Splash() {
  return (
    <div className={styles.splash} aria-hidden>
      <div className={styles.center}>
        <div className={styles.logoWrap}>
          <span className={styles.ripple} />
          <span className={`${styles.ripple} ${styles.ripple2}`} />
          <Image src="/figma/unigo-logo.png" alt="" width={70} height={94} priority className={styles.logo} />
        </div>
        <p className={styles.name}>
          {"UniGo".split("").map((ch, i) => (
            <span key={i} style={{ animationDelay: `${520 + i * 45}ms` }}>
              {ch}
            </span>
          ))}
        </p>
        <p className={styles.tag}>Carpool with your campus</p>
        <span className={styles.bar}>
          <span />
        </span>
      </div>
    </div>
  );
}
