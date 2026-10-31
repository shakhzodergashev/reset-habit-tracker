// RESET's look on the phone, in light and dark. The iPhone's own setting decides which one.
import { useColorScheme } from 'react-native';

export interface ThemeColors {
  scheme: 'light' | 'dark';
  bg: string; // the screen behind everything
  surface: string; // cards
  surfaceMuted: string; // quiet backgrounds (done habits, emoji tiles)
  border: string;
  text: string;
  textMuted: string;
  accent: string; // RESET teal
  accentSoft: string;
  onAccent: string; // text on an accent-coloured button
  ringTrack: string; // the empty part of the progress ring
  danger: string;
  dangerSoft: string;
  streak: string; // the flame
}

const light: ThemeColors = {
  scheme: 'light',
  bg: '#f4f6f5',
  surface: '#ffffff',
  surfaceMuted: '#eef2f0',
  border: '#e2e8e5',
  text: '#17201c',
  textMuted: '#5d6a64',
  accent: '#0f766e',
  accentSoft: '#e5f2ef',
  onAccent: '#ffffff',
  ringTrack: '#dfe7e4',
  danger: '#b42318',
  dangerSoft: '#fdecea',
  streak: '#c2410c',
};

const dark: ThemeColors = {
  scheme: 'dark',
  bg: '#0d1218',
  surface: '#161d26',
  surfaceMuted: '#1d2631',
  border: '#28323e',
  text: '#e8edf2',
  textMuted: '#9aa5b1',
  accent: '#5bc5b3',
  accentSoft: '#173b37',
  onAccent: '#0d1218',
  ringTrack: '#28323e',
  danger: '#f38b7f',
  dangerSoft: '#3a1d1a',
  streak: '#f59e57',
};

/** The colours for the phone's current setting. Screens redraw when the setting changes. */
export function useTheme(): ThemeColors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32 };

export const radius = 16;

/** A colour at low strength: "#0f766e" -> "#0f766e26" (about 15%). */
export function tint(hexColor: string, alphaHex = '26'): string {
  return `${hexColor}${alphaHex}`;
}
