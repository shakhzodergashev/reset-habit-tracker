import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { getStats, type Stats } from '@/api/habits';
import { HillScene } from '@/components/HillScene';
import { Card, ErrorBox, MutedText, TabScreen } from '@/components/ui';
import { useWeather } from '@/journey/useWeather';
import { radius, space, useTheme } from '@/theme';
import { formatDays } from '@/utils/emoji';

/** The Stats tab: the year-long hill and the numbers behind it. Same GET /stats as the website. */
export default function StatsScreen() {
  const c = useTheme();
  const weather = useWeather();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reload every time this tab comes into view, so new ticks show up.
  useFocusEffect(
    useCallback(() => {
      getStats()
        .then((data) => {
          setStats(data);
          setError(null);
        })
        .catch((err: unknown) =>
          setError(err instanceof ApiError ? err.message : 'Could not load your stats.'),
        );
    }, []),
  );

  return (
    <TabScreen title="Stats" subtitle="Your year, one day at a time">
      {error ? (
        <ErrorBox message={error} />
      ) : !stats ? (
        <MutedText>Loading…</MutedText>
      ) : (
        <>
          {/* The year hill: 365 journey days = the finish flag. */}
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
              progress={stats.journeyDays / stats.yearDays}
              weather={weather}
              gainText={(gained) => `+${formatDays(gained * stats.yearDays)} day`}
              accessibilityLabel={`Year hill: ${formatDays(stats.journeyDays)} of ${stats.yearDays} days`}
            />
            <View style={{ padding: space[4], gap: 2 }}>
              <Text style={{ fontSize: 15, color: c.textMuted }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>
                  {formatDays(stats.journeyDays)}
                </Text>{' '}
                of {stats.yearDays} days climbed
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
            <StatTile
              value={`${Math.round((stats.journeyDays / stats.yearDays) * 1000) / 10}%`}
              label="of the year’s hill climbed"
            />
            <StatTile value={String(stats.perfectDays)} label="perfect days (every habit done)" />
            <StatTile value={String(stats.activeDays)} label="days with at least one habit" />
            <StatTile value={String(stats.totalCompletions)} label="habits ticked in total" />
          </View>

          <Card>
            <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>
              How the climb works
            </Text>
            <MutedText>
              The hill is one year: {stats.yearDays} days. Every day you do all your habits, the
              cyclist rides one full day up.
            </MutedText>
            <MutedText>
              A day is shared by your habits. You have {stats.habitCount}{' '}
              {stats.habitCount === 1 ? 'habit' : 'habits'}, so each tick is worth{' '}
              {stats.habitCount > 0
                ? `${formatDays(1 / stats.habitCount)} of a day`
                : 'nothing yet'}
              . Missed days never take you back down.
            </MutedText>
          </Card>
        </>
      )}
    </TabScreen>
  );
}

/** One number with a label under it, two per row. */
function StatTile({ value, label }: { value: string; label: string }) {
  const c = useTheme();
  return (
    <View
      style={{
        width: '47%',
        flexGrow: 1,
        padding: space[4],
        gap: space[1],
        borderRadius: radius,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <Text style={{ fontSize: 26, fontWeight: '800', color: c.text }}>{value}</Text>
      <Text style={{ fontSize: 14, color: c.textMuted }}>{label}</Text>
    </View>
  );
}
