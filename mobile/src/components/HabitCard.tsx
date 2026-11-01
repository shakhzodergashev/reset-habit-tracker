import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { Habit } from '../api/habits';
import { radius, space, useTheme } from '../theme';
import { HabitEmoji } from './HabitEmoji';

interface HabitCardProps {
  habit: Habit;
  done: boolean; // done on the day shown
  onOpen: () => void; // the row: open the habit
  onToggle?: () => void; // the tick circle: mark done, or undo (left out = no tick)
  isPending?: boolean;
}

/** One habit row: a tick circle on the left, name and streak, and the emoji on the right. */
export function HabitCard({ habit, done, onOpen, onToggle, isPending }: HabitCardProps) {
  const c = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: radius,
        paddingLeft: onToggle ? space[2] : space[4],
      }}
    >
      {/* The tick circle: a big 48px target, filled purple with a tick when done. */}
      {onToggle && (
        <Pressable
          onPress={onToggle}
          disabled={isPending}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done, busy: isPending }}
          accessibilityLabel={done ? `Undo ${habit.name}` : `Mark ${habit.name} done`}
          hitSlop={4}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed || isPending ? 0.5 : 1,
          })}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: done ? c.accent : c.border,
              backgroundColor: done ? c.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {done && <Ionicons name="checkmark" size={19} color={c.onAccent} />}
          </View>
        </Pressable>
      )}

      {/* The rest of the row opens the habit (its calendar and streaks). */}
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
          paddingVertical: space[3],
          paddingRight: space[3],
          paddingLeft: onToggle ? space[1] : 0,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>{habit.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="flame" size={14} color={c.streak} />
            <Text style={{ flexShrink: 1, fontSize: 14, color: c.textMuted }} numberOfLines={1}>
              {habit.currentStreak}-day streak
              {habit.description ? ` · ${habit.description}` : ''}
            </Text>
          </View>
        </View>
        <HabitEmoji emoji={habit.emoji} name={habit.name} size={44} />
      </Pressable>
    </View>
  );
}
