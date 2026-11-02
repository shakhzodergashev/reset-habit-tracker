import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import {
  getDashboard,
  markDone,
  undoDone,
  type Dashboard,
  type DashboardHabit,
} from '@/api/habits';
import { Button } from '@/components/Button';
import { HabitCard } from '@/components/HabitCard';
import { HillScene } from '@/components/HillScene';
import { ProgressRing } from '@/components/ProgressRing';
import { Card, ErrorBox, MutedText, RoundButton, TabScreen } from '@/components/ui';
import { WeekStrip } from '@/components/WeekStrip';
import { useWeather } from '@/journey/useWeather';
import { radius, space, useTheme } from '@/theme';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** The Today tab: the week, today's climb (with the real weather) and your habits. */
export default function TodayScreen() {
  const router = useRouter();
  const c = useTheme();
  const weather = useWeather();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [date, setDate] = useState<string | undefined>(undefined); // undefined = today
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCompletingAll, setIsCompletingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setDashboard(await getDashboard(date));
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load your habits.'));
    }
  }, [date]);

  // Runs when this tab comes into view (e.g. after editing a habit), and when another day is picked.
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

  async function toggleHabit(habit: DashboardHabit) {
    if (!dashboard) return;
    setActionError(null);
    setPendingHabitId(habit.id);
    try {
      await (habit.completedOnDate
        ? undoDone(habit.id, dashboard.date)
        : markDone(habit.id, dashboard.date));
      setDashboard(await getDashboard(dashboard.date));
    } catch (err) {
      setActionError(errorMessage(err, 'Could not save that. Please try again.'));
    } finally {
      setPendingHabitId(null);
    }
  }

  /** "Done all": tick every habit not done yet for the day shown, then reload. */
  async function completeAll() {
    if (!dashboard) return;
    setActionError(null);
    setIsCompletingAll(true);
    const notDone = dashboard.habits.filter((habit) => !habit.completedOnDate);
    try {
      // All at once; ticking a habit twice is harmless, so a retry is safe.
      await Promise.all(notDone.map((habit) => markDone(habit.id, dashboard.date)));
    } catch (err) {
      setActionError(errorMessage(err, 'Could not tick them all. Please try again.'));
    }
    // Reload either way, so the screen shows exactly which ones were saved.
    try {
      setDashboard(await getDashboard(dashboard.date));
    } finally {
      setIsCompletingAll(false);
    }
  }

  const done = dashboard?.completedCount ?? 0;
  const total = dashboard?.totalCount ?? 0;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const isToday = !!dashboard && dashboard.date === dashboard.today;

  return (
    <TabScreen
      title="Reset"
      logo
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
          <WeekStrip
            today={dashboard.today}
            selected={dashboard.date}
            onSelect={(day) => setDate(day === dashboard.today ? undefined : day)}
          />

          {/* The climb for the day shown: each habit done moves the cyclist one share up. */}
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
              // A new hill when another day is picked, so the cyclist starts from there.
              key={dashboard.date}
              progress={total === 0 ? 0 : done / total}
              weather={weather}
              gainText={() => '+1 ✓'}
              accessibilityLabel={`${isToday ? 'Today' : 'That day'}: ${done} of ${total} habits done`}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: space[4],
                paddingHorizontal: space[5],
              }}
            >
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>
                  {isToday ? 'Daily Progress' : 'That day'}
                </Text>
                <Text style={{ fontSize: 16, color: c.textMuted }}>
                  {done} of {total} habits
                  {total > 0 && done === total ? ' · finished! 🎉' : ''}
                </Text>
              </View>
              <ProgressRing percent={percent} />
            </View>
          </View>

          {/* Habits title and the + button */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: c.text }}>Habits</Text>
            <RoundButton label="New habit" onPress={() => router.push('/habits/new')}>
              <Ionicons name="add" size={26} color={c.text} />
            </RoundButton>
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
                  done={habit.completedOnDate}
                  isPending={isCompletingAll || pendingHabitId === habit.id}
                  onToggle={() => void toggleHabit(habit)}
                  onOpen={() => router.push({ pathname: '/habits/[id]', params: { id: habit.id } })}
                />
              ))}
            </View>
          )}

          {/* Only while something is left to tick. */}
          {total > 0 && done < total && (
            <Button
              title={isCompletingAll ? 'Ticking…' : '✓ Done all'}
              variant="secondary"
              onPress={() => void completeAll()}
              disabled={isCompletingAll}
            />
          )}
        </>
      )}
    </TabScreen>
  );
}
