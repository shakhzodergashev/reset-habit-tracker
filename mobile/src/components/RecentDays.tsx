import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ApiError } from '../api/client';
import { listDone, markDone, undoDone, type Habit } from '../api/habits';
import { space, useTheme } from '../theme';
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
  const c = useTheme();
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
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space[2] }}
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Last {DAYS_SHOWN} days</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="flame" size={16} color={c.streak} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>
            {habit.currentStreak}-day streak
          </Text>
        </View>
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
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
                style={{
                  width: '12.8%',
                  aspectRatio: 1,
                  borderWidth: day === today ? 3 : 2,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: beforeStart ? c.border : c.accent,
                  backgroundColor: done ? c.accent : disabled ? c.surfaceMuted : 'transparent',
                  opacity: disabled && !done ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    textTransform: 'uppercase',
                    color: done ? c.onAccent : c.textMuted,
                  }}
                >
                  {formatWeekday(day)}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: done ? c.onAccent : c.text }}>
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
