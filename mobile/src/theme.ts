// RESET's look on the phone, in light and dark. The iPhone's own setting decides which one,
// unless Light or Dark was picked on the Profile tab.
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { accentColors, type Accent } from './accents';

export type ThemeChoice = 'auto' | 'light' | 'dark';

const THEME_KEY = 'reset.theme';
let themeChoice: ThemeChoice = 'auto';

/** The choice made on the Profile tab ("auto" = follow the iPhone). */
export function getThemeChoice(): ThemeChoice {
  return themeChoice;
}

/**
 * Switch the whole app (tab bar, status bar and popups too) and remember it.
 * Appearance.setColorScheme('auto') hands control back to the iPhone's setting.
 */
export async function setThemeChoice(choice: ThemeChoice): Promise<void> {
  themeChoice = choice;
  Appearance.setColorScheme(choice);
  if (choice === 'auto') await SecureStore.deleteItemAsync(THEME_KEY);
  else await SecureStore.setItemAsync(THEME_KEY, choice);
}

/** At start-up: put back the choice saved last time. */
export async function loadThemeChoice(): Promise<void> {
  const saved = await SecureStore.getItemAsync(THEME_KEY);
  if (saved === 'light' || saved === 'dark') {
    themeChoice = saved;
    Appearance.setColorScheme(saved);
  }
}

export interface ThemeColors {
  scheme: 'light' | 'dark';
  bg: string; // the screen behind everything
  surface: string; // cards
  surfaceMuted: string; // quiet backgrounds (done habits, emoji tiles)
  border: string;
  text: string;
  textMuted: string;
  accent: string; // the app colour picked on the Profile tab (RESET purple at first)
  accentSoft: string;
  onAccent: string; // text on an accent-coloured button
  ringTrack: string; // the empty part of the progress ring
  danger: string;
  dangerSoft: string;
  up: string; // "doing better" green
  streak: string; // the flame
}

const light: ThemeColors = {
  scheme: 'light',
  bg: '#f5f5f7',
  surface: '#ffffff',
  surfaceMuted: '#f0f0f3',
  border: '#e6e6ea',
  text: '#1c1c22',
  textMuted: '#6b6b76',
  accent: '#7357ea', // RESET purple; replaced by the picked colour in useTheme
  accentSoft: '#efebfd',
  onAccent: '#ffffff',
  ringTrack: '#ebebef',
  danger: '#b42318',
  dangerSoft: '#fdecea',
  up: '#15803d',
  streak: '#f97316',
};

const dark: ThemeColors = {
  scheme: 'dark',
  bg: '#121214',
  surface: '#1c1c20',
  surfaceMuted: '#26262b',
  border: '#303036',
  text: '#f3f3f5',
  textMuted: '#a5a5b0',
  accent: '#8b6cff',
  accentSoft: '#2b2450',
  onAccent: '#ffffff',
  ringTrack: '#303036',
  danger: '#f38b7f',
  dangerSoft: '#3a1d1a',
  up: '#5fd08a',
  streak: '#fb923c',
};

// The account's app colour. AuthProvider sets it when someone logs in (and back
// to purple on log-out); every screen using useTheme() then redraws in it.
let accent: Accent = 'purple';
const accentListeners = new Set<() => void>();

export function setAccent(next: Accent | undefined): void {
  const value = next ?? 'purple';
  if (value === accent) return;
  accent = value;
  accentListeners.forEach((listener) => listener());
}

function subscribeToAccent(listener: () => void) {
  accentListeners.add(listener);
  return () => accentListeners.delete(listener);
}

// Each mix of light/dark and colour is built once, so screens get the same object.
const themes = new Map<string, ThemeColors>();

function themeFor(scheme: 'light' | 'dark', picked: Accent): ThemeColors {
  const key = `${scheme}-${picked}`;
  let theme = themes.get(key);
  if (!theme) {
    const shades = accentColors(picked)[scheme];
    theme = {
      ...(scheme === 'dark' ? dark : light),
      accent: shades.accent,
      accentSoft: shades.soft,
    };
    themes.set(key, theme);
  }
  return theme;
}

/**
 * The colours for the phone's light/dark setting and the account's app colour.
 * Screens redraw when either changes.
 */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const picked = useSyncExternalStore(subscribeToAccent, () => accent);
  return themeFor(scheme, picked);
}

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32 };

export const radius = 18;

/** A colour at low strength: "#0f766e" -> "#0f766e26" (about 15%). */
export function tint(hexColor: string, alphaHex = '26'): string {
  return `${hexColor}${alphaHex}`;
}
