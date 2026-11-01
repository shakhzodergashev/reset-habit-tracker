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
  bg: '#f6f5fb',
  surface: '#ffffff',
  surfaceMuted: '#f1eff8',
  border: '#e9e6f2',
  text: '#1b1930',
  textMuted: '#6c6885',
  accent: '#7357ea', // RESET purple
  accentSoft: '#efebfd',
  onAccent: '#ffffff',
  ringTrack: '#ece9f6',
  danger: '#b42318',
  dangerSoft: '#fdecea',
  streak: '#f97316',
};

const dark: ThemeColors = {
  scheme: 'dark',
  bg: '#12101c',
  surface: '#1c1a2a',
  surfaceMuted: '#252238',
  border: '#2f2b46',
  text: '#f3f1fb',
  textMuted: '#a7a2c0',
  accent: '#8b6cff',
  accentSoft: '#2b2450',
  onAccent: '#ffffff',
  ringTrack: '#2f2b46',
  danger: '#f38b7f',
  dangerSoft: '#3a1d1a',
  streak: '#fb923c',
};

/** The colours for the phone's current setting. Screens redraw when the setting changes. */
export function useTheme(): ThemeColors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32 };

export const radius = 18;

/** A colour at low strength: "#0f766e" -> "#0f766e26" (about 15%). */
export function tint(hexColor: string, alphaHex = '26'): string {
  return `${hexColor}${alphaHex}`;
}
