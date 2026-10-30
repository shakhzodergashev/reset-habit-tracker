import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/auth/AuthProvider';
import { colors } from '@/theme';

/**
 * The frame around every screen. Expo Router turns each file in src/app into a screen;
 * <Stack> shows them as a stack of cards with a top bar and the iPhone back swipe.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'RESET' }} />
        <Stack.Screen name="login" options={{ title: 'RESET', headerBackVisible: false }} />
        <Stack.Screen name="habits/new" options={{ title: 'New habit', presentation: 'modal' }} />
        <Stack.Screen name="habits/[id]" options={{ title: 'Edit habit' }} />
        <Stack.Screen name="archived" options={{ title: 'Archived habits' }} />
      </Stack>
    </AuthProvider>
  );
}
