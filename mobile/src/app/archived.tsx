import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { listHabits, restoreHabit, type Habit } from '@/api/habits';
import { Button } from '@/components/Button';
import { RequireUser } from '@/components/RequireUser';
import { Card, ErrorBox, MutedText, Screen } from '@/components/ui';
import { colors, space } from '@/theme';

export default function ArchivedScreen() {
  return (
    <RequireUser>
      <ArchivedContent />
    </RequireUser>
  );
}

/** Archived habits, each with a Restore button. */
function ArchivedContent() {
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      listHabits(true)
        .then(setHabits)
        .catch((err: unknown) =>
          setError(err instanceof ApiError ? err.message : 'Could not load archived habits.'),
        );
    }, []),
  );

  async function handleRestore(habit: Habit) {
    setError(null);
    setPendingId(habit.id);
    try {
      await restoreHabit(habit.id);
      // Remove it from this list; (current) => ... starts from the latest list.
      setHabits((current) => (current ? current.filter((h) => h.id !== habit.id) : current));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not restore the habit.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Screen>
      {error && <ErrorBox message={error} />}

      {!habits ? (
        <MutedText>Loading…</MutedText>
      ) : habits.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>Nothing archived</Text>
          <MutedText>Habits you archive from their Edit screen appear here.</MutedText>
        </Card>
      ) : (
        habits.map((habit) => (
          <Card key={habit.id}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: habit.color }]} />
              <Text style={styles.name}>{habit.name}</Text>
            </View>
            <Button
              title={pendingId === habit.id ? 'Restoring…' : 'Restore'}
              variant="secondary"
              disabled={pendingId === habit.id}
              onPress={() => void handleRestore(habit)}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  dot: { width: 14, height: 14, borderRadius: 7 },
  name: { fontSize: 17, fontWeight: '600', color: colors.text, flex: 1 },
});
