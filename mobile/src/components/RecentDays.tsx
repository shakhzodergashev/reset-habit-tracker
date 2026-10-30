import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../api/client';
import { listDone, markDone, undoDone, type Habit } from '../api/habits';
import { colors, space } from '../theme';
import {
  addDays,
  formatDayOfMonth,
  formatLongDate,
  formatWeekday,
} from '../utils/dates';
import { Card, ErrorBox, MutedText } from './ui';

const DAYS_SHOWN = 14;

interface RecentDaysProps {
  habit: Habit;
  today: string;
  onChanged: () => void; // ask the screen to reload the habit (for the new streak)
}

/** The last 14 days. Tap a day to mark it done or undo it, like on the website. */
export function RecentDays({ habit, today, onChanged }: RecentDaysProps) {
  const from = addDays(today, -(DAYS_SHOWN - 1));
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(from, i));

  const [doneDays, setDoneDays] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDay, setPendingDay] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    listDone(habit.id, from, today)
      .then((dates) => {
        if (!ignore) setDoneDays(new Set(dates));
      })
      .catch(() => {
        if (!ignore) setError('Could not load the recent days.');
      });
    return () => {
      ignore = true;
    };
  }, [habit.id, from, today]);

  async function toggleDay(day: string) {
    if (!doneDays) return;
    const wasDone = doneDays.has(day);
    setError(null);
    setPendingDay(day);
    try {
      await (wasDone ? undoDone(habit.id, day) : markDone(habit.id, day));
      // Copy, change, replace: React only redraws when it gets a new Set.
      setDoneDays((current) => {
        const next = new Set(current);
        if (wasDone) next.delete(day);
        else next.add(day);
        return next;
      });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save that day.');
    } finally {
      setPendingDay(null);
    }
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Last {DAYS_SHOWN} days</Text>
        <Text style={styles.streak}>🔥 {habit.currentStreak}-day streak</Text>
      </View>
      <MutedText>
        {habit.isArchived
          ? 'Restore this habit to change its days.'
          : 'Forgot a day? Tap it. Tap again to undo.'}
      </MutedText>

      {error && <ErrorBox message={error} />}

      {!doneDays ? (
        !error && <MutedText>Loading…</MutedText>
      ) : (
        <View style={styles.grid}>
          {days.map((day) => {
            const done = doneDays.has(day);
            const beforeStart = day < habit.startDate;
            const disabled = beforeStart || habit.isArchived || pendingDay !== null;
            return (
              <Pressable
                key={day}
                onPress={() => void toggleDay(day)}
                disabled={disabled}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done, disabled }}
                accessibilityLabel={`${formatLongDate(day)}${beforeStart ? ', before this habit started' : ''}`}
                style={[
                  styles.day,
                  { borderColor: beforeStart ? colors.border : habit.color },
                  done && { backgroundColor: habit.color },
                  disabled && !done && styles.dayDisabled,
                  day === today && styles.today,
                ]}
              >
                <Text style={[styles.weekday, done && styles.whiteText]}>
                  {formatWeekday(day)}
                </Text>
                <Text style={[styles.number, done && styles.whiteText]}>
                  {formatDayOfMonth(day)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space[2] },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  streak: { fontSize: 16, fontWeight: '700', color: colors.text },
  // Seven per row: each day takes a bit under 1/7 of the width.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  day: {
    width: '12.8%',
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDisabled: { backgroundColor: colors.surfaceMuted, opacity: 0.6 },
  today: { borderWidth: 3 },
  weekday: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' },
  number: { fontSize: 15, fontWeight: '700', color: colors.text },
  whiteText: { color: colors.white },
});
