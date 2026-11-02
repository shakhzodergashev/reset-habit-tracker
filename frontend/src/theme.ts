// Light or dark: "auto" follows the computer's setting; the others force one look.
// The choice lives in this browser only. index.html applies it before the first paint.

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
