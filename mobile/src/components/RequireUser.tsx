import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { useTheme } from '@/theme';

/** Shows a screen only to logged-in users; everyone else goes to the login screen. */
export function RequireUser({ children }: { children: ReactNode }) {
  const { user, isChecking } = useAuth();
  const c = useTheme();

  if (isChecking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/login" />;
  }
  return children;
}
