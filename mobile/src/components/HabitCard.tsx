import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Habit } from '../api/habits';
import { colors, radius, space } from '../theme';

interface HabitCardProps {
  habit: Habit;
  onToggle: () => void; // tap = mark done, or undo if already done
  onEdit: () => void;
  isPending: boolean;
}

/** One habit on the dashboard: a big "done today" area plus an Edit button. */
export function HabitCard({ habit, onToggle, onEdit, isPending }: HabitCardProps) {
  const done = habit.completedToday;

  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <Pressable
        style={({ pressed }) => [styles.toggle, (pressed || isPending) && styles.pressed]}
        onPress={onToggle}
        disabled={isPending}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, busy: isPending }}
        accessibilityLabel={habit.name}
        accessibilityHint={done ? 'Double tap to undo today' : 'Double tap to mark done today'}
      >
        <View
          style={[
            styles.check,
            { borderColor: habit.color, backgroundColor: done ? habit.color : 'transparent' },
          ]}
        >
          {done && <Text style={styles.tick}>✓</Text>}
        </View>

        <View style={styles.texts}>
          <Text style={[styles.name, done && styles.nameDone]}>{habit.name}</Text>
          {habit.description ? (
            <Text style={styles.description}>{habit.description}</Text>
          ) : null}
        </View>

        <Text style={styles.streak}>🔥 {habit.currentStreak}</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${habit.name}`}
      >
        <Text style={styles.editText}>Edit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    overflow: 'hidden',
  },
  cardDone: { backgroundColor: colors.surfaceMuted },
  toggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[4],
  },
  pressed: { opacity: 0.6 },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { color: colors.white, fontWeight: '800' },
  texts: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '600', color: colors.text },
  nameDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  description: { fontSize: 14, color: colors.textMuted },
  streak: { fontSize: 16, fontWeight: '700', color: colors.text },
  edit: {
    justifyContent: 'center',
    paddingHorizontal: space[4],
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  editText: { color: colors.textMuted, fontWeight: '600' },
});
