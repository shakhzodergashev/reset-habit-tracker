// Small building blocks shared by several screens. All follow the light/dark theme.
import type { ReactElement, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, space, useTheme } from '../theme';

/** A scrolling screen with RESET's side padding, kept clear of the notch and home bar. */
export function Screen({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: space[4], gap: space[4], paddingBottom: space[6] }}
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

/**
 * A tab screen (Today, Habits, Insights, Profile): a big title at the top instead
 * of a top bar, and content that scrolls clear of the bottom tab bar.
 */
export function TabScreen({
  title,
  subtitle,
  logo = false,
  right,
  refreshControl,
  children,
}: {
  title: string;
  subtitle?: string;
  logo?: boolean; // the "◌" ring before the title, as on Today
  right?: ReactNode; // e.g. a round button next to the title
  refreshControl?: ReactElement<RefreshControlProps>;
  children: ReactNode;
}) {
  const c = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: space[4], gap: space[5], paddingBottom: space[6] }}
        contentInsetAdjustmentBehavior="automatic" // keeps the last row above the tab bar
        refreshControl={refreshControl}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <View style={{ flex: 1, gap: space[1] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
              {logo && (
                // An open ring, like a fresh start.
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 4,
                    borderColor: c.text,
                    borderRightColor: 'transparent',
                    transform: [{ rotate: '-30deg' }],
                  }}
                />
              )}
              <Text style={{ fontSize: logo ? 30 : 34, fontWeight: '800', color: c.text }}>
                {title}
              </Text>
            </View>
            {subtitle !== undefined && (
              <Text style={{ fontSize: 16, color: c.textMuted }}>{subtitle}</Text>
            )}
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** A round 44px button with an icon inside, like the "+" next to "Habits". */
export function RoundButton({
  label,
  onPress,
  children,
}: {
  label: string; // what VoiceOver says, e.g. "New habit"
  onPress: () => void;
  children: ReactNode;
}) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

/** A card with a border, like `.card` on the website. */
export function Card({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: radius,
        padding: space[4],
        gap: space[3],
      }}
    >
      {children}
    </View>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  const c = useTheme();
  return <Text style={{ fontWeight: '600', fontSize: 15, color: c.text }}>{children}</Text>;
}

export function ErrorBox({ message }: { message: string }) {
  const c = useTheme();
  return (
    <Text
      accessibilityRole="alert"
      style={{
        backgroundColor: c.dangerSoft,
        color: c.danger,
        padding: space[3],
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {message}
    </Text>
  );
}

export function NoticeBox({ message }: { message: string }) {
  const c = useTheme();
  return (
    <Text
      style={{
        backgroundColor: c.accentSoft,
        color: c.accent,
        padding: space[3],
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {message}
    </Text>
  );
}

export function MutedText({ children }: { children: ReactNode }) {
  const c = useTheme();
  return <Text style={{ color: c.textMuted }}>{children}</Text>;
}

/** The look of every text box, for the current theme. */
export function useInputStyle() {
  const c = useTheme();
  return {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    padding: space[3],
    fontSize: 16, // 16+ stops iPhones zooming in on the field
    color: c.text,
    backgroundColor: c.surface,
  };
}
