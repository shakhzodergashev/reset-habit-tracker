import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { getInsights, getStats, type InsightRange, type Insights, type Stats } from '@/api/habits';
import { BarChart } from '@/components/BarChart';
import { ClimbHill, StartClimbCard } from '@/components/ClimbCard';
import { HabitEmoji } from '@/components/HabitEmoji';
import { Segmented } from '@/components/Segmented';
import { Card, ErrorBox, MutedText, TabScreen } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';
import { addDays } from '@/utils/dates';

const RANGES: { value: InsightRange; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const RANGE_WORD: Record<InsightRange, string> = {
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
};

/** Which bar is today's (week, month) or this month's (year). */
function currentBar(insights: Insights, today: string): number {
  if (insights.range === 'year') return Number(today.slice(5, 7)) - 1;
  let index = 0;
  for (let d = insights.from; d < today; d = addDays(d, 1)) index++;
  return today <= insights.to ? index : -1;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** The Insights tab: your climb, then this week / month / year in numbers. */
export default function InsightsScreen() {
  const c = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState<InsightRange>('week');
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visit, setVisit] = useState(0); // counts openings of this tab

  // Reload every time this tab comes into view, so new ticks show up.
  useFocusEffect(
    useCallback(() => {
      getStats()
        .then((data) => {
          setStats(data);
          setError(null);
          setVisit((n) => n + 1); // a fresh hill: the cyclist rides in again
        })
        .catch((err: unknown) => setError(errorMessage(err, 'Could not load your stats.')));
    }, []),
  );

  // Load the numbers again whenever Week / Month / Year changes (or on a new visit).
  useEffect(() => {
    let ignore = false;
    getInsights(range)
      .then((data) => {
        if (!ignore) setInsights(data);
      })
      .catch((err: unknown) => {
        if (!ignore) setError(errorMessage(err, 'Could not load your insights.'));
      });
    return () => {
      ignore = true;
    };
  }, [range, visit]);

  const climb = stats?.climb ?? null;

  return (
    <TabScreen title="Insights">
      {error ? (
        <ErrorBox message={error} />
      ) : !stats ? (
        <MutedText>Loading…</MutedText>
      ) : (
        <>
          {/* Your climb up the hill comes first. */}
          {climb ? (
            // A new key per climb and per visit: a fresh hill each time.
            <ClimbHill key={`${climb.startDate}-${visit}`} climb={climb} />
          ) : (
            <StartClimbCard
              title="Choose your climb 🚴"
              text="Pick how long your climb up the hill is. Days you have already done count too."
              buttonLabel="Start climbing"
              onStarted={setStats}
            />
          )}
          {climb?.isComplete && (
            <StartClimbCard
              title="Climb complete! 🎉"
              text={`You climbed all ${climb.goalDays} days. Ready for the next one?`}
              buttonLabel="Start next climb"
              onStarted={setStats}
            />
          )}

          <Segmented label="Range" options={RANGES} value={range} onChange={setRange} />

          {!insights || insights.range !== range ? (
            <MutedText>Loading…</MutedText>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: space[3] }}>
                <BigTile
                  icon="flame"
                  iconColor={c.streak}
                  value={String(insights.dayStreak)}
                  label="Day streak"
                />
                <BigTile
                  icon="locate"
                  iconColor={c.accent}
                  value={insights.completionRate === null ? '–' : `${insights.completionRate}%`}
                  label={`${RANGE_WORD[range]} completion`}
                />
              </View>

              <Card>
                <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>Completion</Text>
                <BarChart
                  bars={insights.bars}
                  highlight={currentBar(insights, stats.today)}
                  showEvery={range === 'month' ? 5 : 1}
                />
              </Card>

              <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>Top habits</Text>
              {insights.topHabits.length === 0 ? (
                <MutedText>Your habits will show up here once you have some.</MutedText>
              ) : (
                <View
                  style={{
                    borderRadius: radius,
                    backgroundColor: c.surface,
                    borderWidth: 1,
                    borderColor: c.border,
                    overflow: 'hidden',
                  }}
                >
                  {insights.topHabits.map((habit, i) => (
                    <View
                      key={habit.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space[3],
                        padding: space[3],
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: c.border,
                      }}
                    >
                      <HabitEmoji emoji={habit.emoji} name={habit.name} size={38} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: c.text }}>
                          {habit.name}
                        </Text>
                        <Text style={{ fontSize: 14, color: c.textMuted }}>
                          {habit.doneDays}/{habit.possibleDays} days
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: c.accent }}>
                        {habit.rate === null ? '–' : `${habit.rate}%`}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* All time, across every climb */}
          <View style={{ flexDirection: 'row', gap: space[3] }}>
            <SmallTile
              value={String(stats.climbsCompleted)}
              label={stats.climbsCompleted === 1 ? 'climb completed' : 'climbs completed'}
            />
            <SmallTile value={String(stats.perfectDays)} label="perfect days" />
            <SmallTile value={String(stats.totalCompletions)} label="habits ticked" />
          </View>
        </>
      )}
    </TabScreen>
  );
}

/** A big number with an icon above it, half the width. */
function BigTile({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  value: string;
  label: string;
}) {
  const c = useTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: space[4],
        gap: 2,
        borderRadius: radius,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <Ionicons name={icon} size={28} color={iconColor} />
      <Text style={{ fontSize: 32, fontWeight: '800', color: c.text }}>{value}</Text>
      <Text style={{ fontSize: 15, color: c.textMuted }}>{label}</Text>
    </View>
  );
}

/** A small all-time number, a third of the width. */
function SmallTile({ value, label }: { value: string; label: string }) {
  const c = useTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: space[3],
        gap: 2,
        borderRadius: radius,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: c.text }}>{value}</Text>
      <Text style={{ fontSize: 13, color: c.textMuted }}>{label}</Text>
    </View>
  );
}
