import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { colors } from '@/theme';

/** Shows a screen only to logged-in users; everyone else goes to the login screen. */
export function RequireUser({ children }: { children: ReactNode }) {
  const { user, isChecking } = useAuth();

  if (isChecking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/login" />;
  }
  return children;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
