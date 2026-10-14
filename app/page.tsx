import { HomeFeed } from "./home-feed";
import { Greeting } from "./greeting";
import { RecentPlaces } from "./recent-places";
import { ModeToggle } from "./ui/mode-toggle";
import { SearchBar } from "./ui/search-bar";
import styles from "./page.module.css";

/** Figma "Rider Home" (node 844:2747). */
export default function Home() {
  return (
    <div className={`${styles.page} stagger`}>
      <ModeToggle active="find" />
      <Greeting />
      <div className={`${styles.body} stagger`}>
        <div className={styles.search}>
          <SearchBar />
          <RecentPlaces />
        </div>
        <HomeFeed />
      </div>
    </div>
  );
}
