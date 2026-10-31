import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { getDashboard, markDone, undoDone, type Dashboard, type Habit } from '@/api/habits';
import { HabitCard } from '@/components/HabitCard';
import { HillScene } from '@/components/HillScene';
import { Card, ErrorBox, MutedText, TabScreen } from '@/components/ui';
import { useWeather } from '@/journey/useWeather';
import { radius, space, useTheme } from '@/theme';
import { formatLongDate } from '@/utils/dates';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** The Today tab: today's climb (with the real weather) and one row per active habit. */
export default function TodayScreen() {
  const router = useRouter();
  const c = useTheme();
  const weather = useWeather();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setDashboard(await getDashboard());
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load your habits.'));
    }
  }, []);

  // Runs every time this tab comes into view (e.g. after editing a habit).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  async function toggleHabit(habit: Habit) {
    if (!dashboard) return;
    setActionError(null);
    setPendingHabitId(habit.id);
    try {
      await (habit.completedToday
        ? undoDone(habit.id, dashboard.today)
        : markDone(habit.id, dashboard.today));
      setDashboard(await getDashboard());
    } catch (err) {
      setActionError(errorMessage(err, 'Could not save that. Please try again.'));
    } finally {
      setPendingHabitId(null);
    }
  }

  const done = dashboard?.completedCount ?? 0;
  const total = dashboard?.totalCount ?? 0;
  const message =
    total === 0
      ? 'Add a habit to start today’s climb.'
      : done === total
        ? 'You reached the finish. Great day! 🎉'
        : `${total - done} more to reach the finish.`;

  return (
    <TabScreen
      title="Today"
      subtitle={dashboard ? formatLongDate(dashboard.today) : ' '}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void handleRefresh()}
          tintColor={c.accent}
        />
      }
    >
      {loadError ? (
        <ErrorBox message={loadError} />
      ) : !dashboard ? (
        <MutedText>Loading your habits…</MutedText>
      ) : (
        <>
          {/* Today's climb: each habit done moves the cyclist one share up to the flag. */}
          <View
            style={{
              borderRadius: radius + 4,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              overflow: 'hidden',
            }}
          >
            <HillScene
              progress={total === 0 ? 0 : done / total}
              weather={weather}
              gainText={() => '+1 ✓'}
              accessibilityLabel={`Today's climb: ${done} of ${total} habits done`}
            />
            <View style={{ padding: space[4], gap: 2 }}>
              <Text style={{ fontSize: 15, color: c.textMuted }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>
                  {done} of {total}
                </Text>{' '}
                habits done
              </Text>
              <Text style={{ fontSize: 15, color: c.textMuted }}>{message}</Text>
            </View>
          </View>

          {/* Habits title and the + button */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: c.text }}>Habits</Text>
            <Pressable
              onPress={() => router.push('/habits/new')}
              accessibilityRole="button"
              accessibilityLabel="New habit"
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.accent,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="add" size={26} color={c.onAccent} />
            </Pressable>
          </View>

          {actionError && <ErrorBox message={actionError} />}

          {dashboard.habits.length === 0 ? (
            <Card>
              <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>No habits yet</Text>
              <MutedText>Tap + to create your first one.</MutedText>
            </Card>
          ) : (
            <View style={{ gap: space[3] }}>
              {dashboard.habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isPending={pendingHabitId === habit.id}
                  onToggle={() => void toggleHabit(habit)}
                  onOpen={() => router.push({ pathname: '/habits/[id]', params: { id: habit.id } })}
                />
              ))}
            </View>
          )}
        </>
      )}
    </TabScreen>
  );
}
