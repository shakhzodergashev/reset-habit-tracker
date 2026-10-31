import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { Habit } from '../api/habits';
import { radius, space, useTheme } from '../theme';
import { HabitEmoji } from './HabitEmoji';

interface HabitCardProps {
  habit: Habit;
  onToggle: () => void; // the circle on the right: mark done, or undo
  onOpen: () => void; // the rest of the row: open the habit
  isPending: boolean;
}

/** One habit row: emoji tile, name and streak, and a big tick circle on the right. */
export function HabitCard({ habit, onToggle, onOpen, isPending }: HabitCardProps) {
  const c = useTheme();
  const done = habit.completedToday;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: radius,
        overflow: 'hidden',
      }}
    >
      {/* Tap the row: open the habit (edit, past days, archive). */}
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${habit.currentStreak}-day streak`}
        accessibilityHint="Opens the habit"
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[3],
          padding: space[3],
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <HabitEmoji emoji={habit.emoji} name={habit.name} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: done ? c.textMuted : c.text,
              textDecorationLine: done ? 'line-through' : 'none',
            }}
          >
            {habit.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="flame" size={14} color={c.streak} />
            <Text style={{ fontSize: 14, color: c.textMuted }}>
              {habit.currentStreak}-day streak
              {habit.description ? ` · ${habit.description}` : ''}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* The tick circle: a big 48px target, filled with the theme colour when done. */}
      <Pressable
        onPress={onToggle}
        disabled={isPending}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, busy: isPending }}
        accessibilityLabel={done ? `Undo ${habit.name} for today` : `Mark ${habit.name} done today`}
        hitSlop={6}
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          marginRight: space[3],
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed || isPending ? 0.5 : 1,
        })}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: done ? c.accent : c.border,
            backgroundColor: done ? c.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done && <Ionicons name="checkmark" size={20} color={c.onAccent} />}
        </View>
      </Pressable>
    </View>
  );
}
