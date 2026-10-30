// Small building blocks shared by several screens.
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, space } from '../theme';

/** A scrolling screen with RESET's side padding, kept clear of the notch and home bar. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        // iPhone: start the content below the (see-through) top bar instead of underneath it.
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled" // taps on buttons work while the keyboard is open
        automaticallyAdjustKeyboardInsets // scrolls fields above the keyboard on iPhone
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** A white card with a border, like `.card` on the website. */
export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <Text style={styles.error} accessibilityRole="alert">
      {message}
    </Text>
  );
}

export function NoticeBox({ message }: { message: string }) {
  return <Text style={styles.notice}>{message}</Text>;
}

export function MutedText({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

/** The look of every text box. */
export const inputStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: space[3],
  fontSize: 16, // 16+ stops iPhones zooming in on the field
  color: colors.text,
  backgroundColor: colors.bg,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], gap: space[4], paddingBottom: space[6] },
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    padding: space[4],
    gap: space[3],
  },
  label: { fontWeight: '600', fontSize: 15, color: colors.text },
  error: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
    padding: space[3],
    borderRadius: 8,
    overflow: 'hidden',
  },
  notice: {
    backgroundColor: colors.accentSoft,
    color: colors.accent,
    padding: space[3],
    borderRadius: 8,
    overflow: 'hidden',
  },
  muted: { color: colors.textMuted },
});
