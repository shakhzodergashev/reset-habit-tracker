import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { listHabits, type Habit } from '@/api/habits';
import { HabitCard } from '@/components/HabitCard';
import { Card, ErrorBox, MutedText, RoundButton, TabScreen } from '@/components/ui';
import { space, useTheme } from '@/theme';

/** The Habits tab: every active habit (tap one to see its progress), and archived ones. */
export default function HabitsScreen() {
  const router = useRouter();
  const c = useTheme();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reload every time this tab comes into view (after adding or editing a habit).
  useFocusEffect(
    useCallback(() => {
      listHabits(false)
        .then((data) => {
          setHabits(data);
          setError(null);
        })
        .catch((err: unknown) =>
          setError(err instanceof ApiError ? err.message : 'Could not load your habits.'),
        );
    }, []),
  );

  return (
    <TabScreen
      title="Habits"
      right={
        <RoundButton label="New habit" onPress={() => router.push('/habits/new')}>
          <Ionicons name="add" size={26} color={c.text} />
        </RoundButton>
      }
    >
      {error ? (
        <ErrorBox message={error} />
      ) : !habits ? (
        <MutedText>Loading…</MutedText>
      ) : habits.length === 0 ? (
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>No habits yet</Text>
          <MutedText>Tap + to create your first one.</MutedText>
        </Card>
      ) : (
        <View style={{ gap: space[3] }}>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              done={habit.completedToday}
              onOpen={() => router.push({ pathname: '/habits/[id]', params: { id: habit.id } })}
            />
          ))}
        </View>
      )}

      <Pressable onPress={() => router.push('/archived')} accessibilityRole="link">
        <Text
          style={{
            textAlign: 'center',
            color: c.textMuted,
            textDecorationLine: 'underline',
            paddingVertical: space[2],
          }}
        >
          Archived habits
        </Text>
      </Pressable>
    </TabScreen>
  );
}
