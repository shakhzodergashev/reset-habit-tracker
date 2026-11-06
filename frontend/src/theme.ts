// Light or dark: "auto" follows the computer's setting; the others force one look.
// The choice lives in this browser only. index.html applies it before the first paint.

import { accentColors, type Accent } from './accents';

export type ThemeChoice = 'auto' | 'light' | 'dark';

const THEME_KEY = 'reset.theme';

export function getThemeChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  } catch {
    return 'auto'; // storage blocked (e.g. some private windows)
  }
}

/**
 * Recolour the whole site in the account's colour (purple when logged out).
 * index.css reads these variables for its light and dark accent colours.
 */
export function applyAccent(accent: Accent | undefined): void {
  const { light, dark } = accentColors(accent);
  const root = document.documentElement.style;
  root.setProperty('--accent-light', light.accent);
  root.setProperty('--accent-light-hover', light.hover);
  root.setProperty('--accent-light-soft', light.soft);
  root.setProperty('--accent-dark', dark.accent);
  root.setProperty('--accent-dark-hover', dark.hover);
  root.setProperty('--accent-dark-soft', dark.soft);
}

/** Switch the look straight away and remember it for next time. */
export function setThemeChoice(choice: ThemeChoice): void {
  // index.css reads data-theme; without it, the computer's setting decides.
  if (choice === 'auto') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = choice;
  }
  try {
    if (choice === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Not saved, but the page has still switched.
  }
}
