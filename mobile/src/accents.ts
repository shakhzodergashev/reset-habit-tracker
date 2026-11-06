// The app colours a user can pick on the Profile tab. The website has the
// same file, so both apps use exactly the same shades.
//
// Each colour has a light-mode and a dark-mode version, checked so white text
// stays readable on the buttons. The danger red for delete buttons is separate
// and never changes.

export type Accent = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'red';

interface Shades {
  accent: string; // buttons, ticks, links, the progress ring
  hover: string; // a button under the mouse (website)
  soft: string; // quiet backgrounds, e.g. the selected day
}

export interface AccentColors {
  label: string;
  light: Shades;
  dark: Shades;
  bike: string; // the climber's bike, the same in light and dark
}

export const ACCENTS: Record<Accent, AccentColors> = {
  purple: {
    label: 'Purple',
    light: { accent: '#7357ea', hover: '#6040d8', soft: '#efebfd' },
    dark: { accent: '#8b6cff', hover: '#a088ff', soft: '#2b2450' },
    bike: '#7c5cf0',
  },
  blue: {
    label: 'Blue',
    light: { accent: '#2563eb', hover: '#1d4ed8', soft: '#e8effd' },
    dark: { accent: '#4f7dff', hover: '#6b92ff', soft: '#1c2a4d' },
    bike: '#3b74f0',
  },
  green: {
    label: 'Green',
    light: { accent: '#15803d', hover: '#166534', soft: '#e7f6ec' },
    dark: { accent: '#1f9d55', hover: '#2bb866', soft: '#17321f' },
    bike: '#22a35a',
  },
  orange: {
    label: 'Orange',
    light: { accent: '#c2410c', hover: '#9a3412', soft: '#fdeee6' },
    dark: { accent: '#e2621b', hover: '#f07a35', soft: '#3a2214' },
    bike: '#f07a2a',
  },
  pink: {
    label: 'Pink',
    light: { accent: '#db2777', hover: '#be185d', soft: '#fce8f1' },
    dark: { accent: '#ec4899', hover: '#f472b6', soft: '#3b1a2b' },
    bike: '#e8478f',
  },
  red: {
    label: 'Red',
    light: { accent: '#dc2626', hover: '#b91c1c', soft: '#fdeaea' },
    dark: { accent: '#ef4444', hover: '#f87171', soft: '#3b1a1a' },
    bike: '#e53935',
  },
};

/** The colours for an account (purple if it has none yet, e.g. logged out). */
export function accentColors(accent: Accent | undefined): AccentColors {
  return ACCENTS[accent ?? 'purple'];
}
