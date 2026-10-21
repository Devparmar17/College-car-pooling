"use client";

import { useEffect } from "react";

// Fields that bring up the on-screen keyboard (not checkboxes, radios, buttons or selects).
const TYPING = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="hidden"]), textarea, [contenteditable="true"]';

/**
 * Phones: while you type, mark <html data-keyboard> so the floating nav steps aside (CSS), and
 * keep the field you're typing in centred above the keyboard.
 */
export function KeyboardWatcher() {
  useEffect(() => {
    const touch = window.matchMedia("(pointer: coarse)");
    const root = document.documentElement;
    let timer = 0;

    const centre = () => {
      const el = document.activeElement;
      if (el instanceof HTMLElement && el.matches(TYPING)) el.scrollIntoView({ block: "center", behavior: "smooth" });
    };

    const onFocusIn = (e: FocusEvent) => {
      if (!touch.matches || !(e.target instanceof HTMLElement) || !e.target.matches(TYPING)) return;
      root.dataset.keyboard = "open";
      // Wait for the keyboard to finish sliding up, then bring the field into view.
      window.clearTimeout(timer);
      timer = window.setTimeout(centre, 320);
    };

    const onFocusOut = () => {
      // Moving straight to another field keeps the keyboard up.
      window.setTimeout(() => {
        const el = document.activeElement;
        if (!(el instanceof HTMLElement && el.matches(TYPING))) delete root.dataset.keyboard;
      }, 50);
    };

    // The keyboard resizing the screen (e.g. switching to emoji) shouldn't hide the field.
    const onResize = () => {
      if (root.dataset.keyboard) centre();
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", onResize);
      delete root.dataset.keyboard;
    };
  }, []);

  return null;
}
