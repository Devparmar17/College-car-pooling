import { Greeting } from "./greeting";
import { HomeBody } from "./home-body";
import { ModeToggle } from "./ui/mode-toggle";
import styles from "./page.module.css";

/** Figma "Rider Home" (node 844:2747). */
export default function Home() {
  return (
    <div className={`${styles.page} stagger`}>
      <ModeToggle active="find" />
      <Greeting />
      <div className={`${styles.body} stagger`}>
        <HomeBody />
      </div>
    </div>
  );
}
