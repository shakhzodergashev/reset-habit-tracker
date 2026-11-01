import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { ApiError } from '@/api/client';
import { archiveHabit, getHabit, restoreHabit, updateHabit, type Habit } from '@/api/habits';
import { Button } from '@/components/Button';
import { HabitForm } from '@/components/HabitForm';
import { RequireUser } from '@/components/RequireUser';
import { Card, ErrorBox, MutedText, Screen } from '@/components/ui';
import { useTheme } from '@/theme';

export default function EditHabitScreen() {
  return (
    <RequireUser>
      <EditHabitContent />
    </RequireUser>
  );
}

/** Edit a habit's name, description and emoji, and archive or restore it. */
function EditHabitContent() {
  // The [id] in the folder name becomes a parameter, like useParams() on the website.
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useTheme();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setHabit(await getHabit(id));
    } catch (err) {
      setError(
        err instanceof ApiError && (err.status === 404 || err.status === 400)
          ? 'Habit not found.'
          : 'Could not load this habit.',
      );
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (error) {
    return (
      <Screen>
        <ErrorBox message={error} />
      </Screen>
    );
  }
  if (!habit) {
    return (
      <Screen>
        <MutedText>Loading…</MutedText>
      </Screen>
    );
  }

  // On a phone, the native confirmation dialog is the natural "Are you sure?".
  function confirmArchive(current: Habit) {
    Alert.alert(
      `Archive “${current.name}”?`,
      'It disappears from your habits, but its history is kept. You can restore it any time.',
      [
        { text: 'Keep habit', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            archiveHabit(current.id)
              // Back past the habit's page too, to the list it came from.
              .then(() => router.dismissTo('/habits'))
              .catch(() => Alert.alert('Could not archive the habit. Please try again.'));
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <HabitForm
        submitLabel="Save changes"
        initialValues={{
          name: habit.name,
          description: habit.description,
          emoji: habit.emoji,
        }}
        onSubmit={async (values) => {
          await updateHabit(habit.id, values);
          router.back();
        }}
      />

      <Card>
        {habit.isArchived ? (
          <>
            <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Archived</Text>
            <MutedText>Restore it to show it in your habits again.</MutedText>
            <Button
              title="Restore habit"
              variant="secondary"
              onPress={() => {
                restoreHabit(habit.id)
                  .then(() => reload())
                  .catch(() => Alert.alert('Could not restore the habit.'));
              }}
            />
          </>
        ) : (
          <>
            <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Archive habit</Text>
            <MutedText>It disappears from your habits, but its history is kept.</MutedText>
            <Button
              title="Archive habit…"
              variant="secondary"
              onPress={() => confirmArchive(habit)}
            />
          </>
        )}
      </Card>
    </Screen>
  );
}
