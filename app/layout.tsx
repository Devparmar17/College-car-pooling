import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Suspense } from "react";
import { BottomNav, NavLinks } from "./ui/bottom-nav";
import { CancelNotice } from "./ui/cancel-notice";
import { KeyboardWatcher } from "./ui/keyboard-watcher";
import { Splash } from "./ui/splash";
import { TripWatcher } from "./ui/trip-watcher";
import "./globals.css";
import styles from "./layout.module.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The Figma login and sign-up screens set a few labels and the code digits in Inter.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "UniGo · College car pooling",
    template: "%s · UniGo",
  },
  description: "Find or offer a commute to Indus University with verified students and faculty.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
  // The on-screen keyboard shrinks the page instead of covering it, so bars and fields stay above it.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistMono.variable} ${inter.variable}`}>
      <body>
        <Splash />
        <KeyboardWatcher />
        <div className={styles.frame}>
          <main className={styles.main}>{children}</main>
          <Suspense fallback={<NavLinks />}>
            <BottomNav />
          </Suspense>
          <Suspense>
            <TripWatcher />
          </Suspense>
          <Suspense>
            <CancelNotice />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
