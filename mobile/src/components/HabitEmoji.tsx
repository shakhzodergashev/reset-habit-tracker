import { Text, View } from 'react-native';
import { useTheme } from '../theme';

/** A rounded square with the habit's emoji, or the first letter of its name if it has none. */
export function HabitEmoji({
  emoji,
  name,
  size = 48,
}: {
  emoji: string | null;
  name: string;
  size?: number;
}) {
  const c = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: c.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={
          emoji
            ? { fontSize: size * 0.55 }
            : { fontSize: size * 0.45, fontWeight: '800', color: c.accent }
        }
      >
        {emoji ?? name.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
