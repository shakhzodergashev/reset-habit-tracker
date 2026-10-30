import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { getDashboard, markDone, undoDone, type Dashboard, type Habit } from '@/api/habits';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/Button';
import { HabitCard } from '@/components/HabitCard';
import { RequireUser } from '@/components/RequireUser';
import { Card, ErrorBox, MutedText } from '@/components/ui';
import { colors, space } from '@/theme';
import { formatLongDate } from '@/utils/dates';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function DashboardScreen() {
  return (
    <RequireUser>
      <DashboardContent />
    </RequireUser>
  );
}

/** Today's progress and one card per active habit, from the same GET /dashboard as the website. */
function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
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

  // useFocusEffect = useEffect that also runs every time you come back to this screen
  // (e.g. after editing a habit), so the dashboard is always fresh.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Pull down to refresh: handy to see a change you just made on the website.
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

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      {/* Adds a "Log out" button to this screen's top bar. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => void logout()} accessibilityRole="button" hitSlop={10}>
              <Text style={styles.headerButton}>Log out</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        // iPhone: start the content below the (see-through) top bar instead of underneath it.
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} />
        }
      >
        <MutedText>{user?.email}</MutedText>

        {loadError ? (
          <ErrorBox message={loadError} />
        ) : !dashboard ? (
          <MutedText>Loading your habits…</MutedText>
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.date}>{formatLongDate(dashboard.today)}</Text>
              <Text style={styles.count}>
                <Text style={styles.countNumber}>
                  {dashboard.completedCount} / {dashboard.totalCount}
                </Text>{' '}
                completed
              </Text>
            </View>

            <Button title="+ New habit" onPress={() => router.push('/habits/new')} />

            {actionError && <ErrorBox message={actionError} />}

            {dashboard.habits.length === 0 ? (
              <Card>
                <Text style={styles.emptyTitle}>No habits yet</Text>
                <MutedText>Tap “+ New habit” to create your first one.</MutedText>
              </Card>
            ) : (
              <View style={styles.list}>
                {dashboard.habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isPending={pendingHabitId === habit.id}
                    onToggle={() => void toggleHabit(habit)}
                    onEdit={() =>
                      router.push({ pathname: '/habits/[id]', params: { id: habit.id } })
                    }
                  />
                ))}
              </View>
            )}

            <Pressable onPress={() => router.push('/archived')} accessibilityRole="link">
              <Text style={styles.archivedLink}>Archived habits</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], gap: space[4], paddingBottom: space[6] },
  headerButton: { color: colors.accent, fontWeight: '600', fontSize: 16 },
  summary: { gap: space[1] },
  date: { fontSize: 24, fontWeight: '700', color: colors.text },
  count: { fontSize: 16, color: colors.textMuted },
  countNumber: { fontSize: 18, fontWeight: '700', color: colors.accent },
  list: { gap: space[3] },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  archivedLink: {
    textAlign: 'center',
    color: colors.textMuted,
    textDecorationLine: 'underline',
    paddingVertical: space[2],
  },
});
