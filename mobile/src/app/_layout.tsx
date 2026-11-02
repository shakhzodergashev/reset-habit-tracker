import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider } from '@/auth/AuthProvider';
import { loadThemeChoice, useTheme } from '@/theme';

/**
 * The frame around every screen. Expo Router turns each file in src/app into a screen;
 * <Stack> shows them as a stack of cards with a top bar and the iPhone back swipe.
 */
export default function RootLayout() {
  const c = useTheme();

  // Put back the Light/Dark choice from the Profile tab (once, at start-up).
  useEffect(() => {
    loadThemeChoice().catch(() => {}); // if it can't be read, follow the iPhone
  }, []);

  return (
    <AuthProvider>
      {/* "auto" = dark status bar text in light mode, light text in dark mode. */}
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerTintColor: c.accent,
          headerStyle: { backgroundColor: c.bg },
          headerTitleStyle: { color: c.text, fontWeight: '700' },
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        {/* The three tabs (Today, Stats, Profile) draw their own headers. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'RESET', headerBackVisible: false }} />
        <Stack.Screen
          name="welcome"
          options={{ title: 'Welcome', headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen name="habits/new" options={{ title: 'New habit', presentation: 'modal' }} />
        <Stack.Screen name="habits/[id]/index" options={{ title: '' }} />
        <Stack.Screen name="habits/[id]/edit" options={{ title: 'Edit habit' }} />
        <Stack.Screen name="archived" options={{ title: 'Archived habits' }} />
      </Stack>
    </AuthProvider>
  );
}
