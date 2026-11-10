import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Animated, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { getInsights, getStats, type InsightRange, type Insights, type Stats } from '@/api/habits';
import { CompletionChart } from '@/components/CompletionChart';
import { HabitEmoji } from '@/components/HabitEmoji';
import { Segmented } from '@/components/Segmented';
import { Card, ErrorBox, MutedText, RoundButton, TabScreen } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';
import { addDays } from '@/utils/dates';
import { prefersReducedMotion, useCountUp } from '@/utils/useCountUp';

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

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "3 Nov" from "2026-11-03"; with the year too when asked. */
function shortDate(date: string, withYear = false): string {
  const [year, month, day] = date.split('-');
  const text = `${Number(day)} ${MONTHS[Number(month) - 1].slice(0, 3)}`;
  return withYear ? `${text} ${year}` : text;
}

/** What the ‹ › arrows show: "This week", "27 Oct – 2 Nov 2026", "October 2026", "2025". */
function periodLabel(insights: Insights): string {
  const { range, from, to, isCurrent } = insights;
  if (range === 'year') return from.slice(0, 4);
  if (range === 'month') return `${MONTHS[Number(from.slice(5, 7)) - 1]} ${from.slice(0, 4)}`;
  if (isCurrent) return 'This week';
  return `${shortDate(from)} – ${shortDate(to, true)}`;
}

/**
 * Up or down compared with the period before: "▲ 12% vs last week".
 * Null when either period has nothing to count.
 */
function trend(insights: Insights): { text: string; direction: 'up' | 'down' | 'same' } | null {
  const { completionRate: now, previousRate: before, range, isCurrent } = insights;
  if (now === null || before === null) return null;
  const than = `${isCurrent ? 'last' : 'the previous'} ${range}`;
  const change = now - before;
  if (change === 0) return { text: `Same as ${than}`, direction: 'same' };
  return {
    text: `${change > 0 ? '▲' : '▼'} ${Math.abs(change)}% vs ${than}`,
    direction: change > 0 ? 'up' : 'down',
  };
}

/** Which bar is today's (week, month) or this month's (year); -1 for a past period. */
function currentBar(insights: Insights, today: string): number {
  if (!insights.isCurrent) return -1;
  if (insights.range === 'year') return Number(today.slice(5, 7)) - 1;
  let index = 0;
  for (let d = insights.from; d < today; d = addDays(d, 1)) index++;
  return today <= insights.to ? index : -1;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** The Insights tab: this week / month / year in numbers, then all-time numbers. */
export default function InsightsScreen() {
  const c = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState<InsightRange>('week');
  // A day in the period shown; undefined = this week, month or year.
  const [anchor, setAnchor] = useState<string | undefined>(undefined);
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
          setVisit((n) => n + 1); // and reload the week / month / year numbers
        })
        .catch((err: unknown) => setError(errorMessage(err, 'Could not load your stats.')));
    }, []),
  );

  // Load the numbers again whenever Week / Month / Year or the period changes (or on a new visit).
  useEffect(() => {
    let ignore = false;
    getInsights(range, anchor)
      .then((data) => {
        if (!ignore) setInsights(data);
      })
      .catch((err: unknown) => {
        if (!ignore) setError(errorMessage(err, 'Could not load your insights.'));
      });
    return () => {
      ignore = true;
    };
  }, [range, anchor, visit]);

  // The numbers for the range and period picked (null while they load).
  const shown =
    insights &&
    insights.range === range &&
    (anchor === undefined ? insights.isCurrent : insights.from <= anchor && anchor <= insights.to)
      ? insights
      : null;
  const change = shown && trend(shown); // up or down vs the period before

  return (
    <TabScreen title="Insights">
      {error ? (
        <ErrorBox message={error} />
      ) : !stats ? (
        <MutedText>Loading…</MutedText>
      ) : (
        <>
          <Segmented
            label="Range"
            options={RANGES}
            value={range}
            onChange={(next) => {
              setRange(next);
              setAnchor(undefined); // back to this week, month or year
            }}
          />

          {!shown ? (
            <MutedText>Loading…</MutedText>
          ) : (
            <>
              {/* ‹ earlier period · later period › */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <RoundButton
                  label="Earlier"
                  onPress={() => setAnchor(addDays(shown.from, -1))}
                  disabled={!shown.hasEarlier}
                >
                  <Ionicons name="chevron-back" size={22} color={c.text} />
                </RoundButton>
                <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>
                  {periodLabel(shown)}
                </Text>
                <RoundButton
                  label="Later"
                  onPress={() => setAnchor(addDays(shown.to, 1))}
                  disabled={shown.isCurrent}
                >
                  <Ionicons name="chevron-forward" size={22} color={c.text} />
                </RoundButton>
              </View>

              <View style={{ flexDirection: 'row', gap: space[3] }}>
                <BigTile
                  icon="flame"
                  iconColor={c.streak}
                  // Today's streak; for a past period, its best run instead.
                  value={shown.isCurrent ? shown.dayStreak : shown.bestStreak}
                  flicker
                  label={shown.isCurrent ? 'Day streak' : 'Best streak'}
                />
                <BigTile
                  icon="locate"
                  iconColor={c.accent}
                  value={shown.completionRate}
                  suffix="%"
                  label={`${RANGE_WORD[range]} completion`}
                  note={
                    change && {
                      text: change.text,
                      color:
                        change.direction === 'up'
                          ? c.up
                          : change.direction === 'down'
                            ? c.danger
                            : c.textMuted,
                    }
                  }
                />
              </View>

              <Card>
                <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>Completion</Text>
                <CompletionChart
                  // A new chart per period, so a tapped day doesn't carry over.
                  key={`${shown.range}-${shown.from}`}
                  bars={shown.bars}
                  highlight={currentBar(shown, stats.today)}
                  dense={range === 'month'}
                  initials={range === 'year'}
                />
              </Card>

              <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>Top habits</Text>
              {shown.topHabits.length === 0 ? (
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
                  {shown.topHabits.map((habit, i) => (
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

          {/* Since you started, across every habit (archived ones too). */}
          <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>All time</Text>
          <View style={{ flexDirection: 'row', gap: space[3] }}>
            <SmallTile value={String(stats.bestStreak)} label="best streak" />
            <SmallTile value={String(stats.perfectDays)} label="perfect days" />
            <SmallTile value={String(stats.totalCompletions)} label="habits ticked" />
          </View>
        </>
      )}
    </TabScreen>
  );
}

/** The streak flame, gently flickering like a real one (it keeps still with Reduce Motion). */
function FlickeringIcon({ children }: { children: ReactNode }) {
  const flicker = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flicker]);

  return (
    <Animated.View
      style={{
        alignSelf: 'flex-start',
        transform: [
          { scaleY: flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          { rotate: flicker.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-4deg'] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** A big number (rolling up to its value) with an icon above it, half the width. */
function BigTile({
  icon,
  iconColor,
  value,
  suffix = '',
  label,
  note,
  flicker = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  value: number | null; // null shows a dash: nothing to count yet
  suffix?: string; // e.g. "%"
  label: string;
  note?: { text: string; color: string } | null; // a small line under the label
  flicker?: boolean; // the icon flickers like a flame
}) {
  const c = useTheme();
  const shownValue = useCountUp(value ?? 0);
  const iconEl = <Ionicons name={icon} size={28} color={iconColor} />;
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
      {flicker ? <FlickeringIcon>{iconEl}</FlickeringIcon> : iconEl}
      <Text style={{ fontSize: 32, fontWeight: '800', color: c.text }}>
        {value === null ? '–' : `${Math.round(shownValue)}${suffix}`}
      </Text>
      <Text style={{ fontSize: 15, color: c.textMuted }}>{label}</Text>
      {note && (
        <Text style={{ fontSize: 13, fontWeight: '700', color: note.color }}>{note.text}</Text>
      )}
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
