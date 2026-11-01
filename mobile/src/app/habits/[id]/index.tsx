import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { getHabit, listDone, markDone, undoDone, type Habit } from '@/api/habits';
import { useAuth } from '@/auth/auth-context';
import { HabitEmoji } from '@/components/HabitEmoji';
import { RequireUser } from '@/components/RequireUser';
import { Segmented } from '@/components/Segmented';
import { Card, ErrorBox, MutedText, Screen } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';
import { addDays, formatLongDate, todayInTimeZone } from '@/utils/dates';

type Tab = 'progress' | 'history';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

/** "2026-10" -> every day of that month, "2026-10-01" ... "2026-10-31". */
function monthDays(month: string): string[] {
  const days: string[] = [];
  for (let d = `${month}-01`; d.startsWith(month); d = addDays(d, 1)) days.push(d);
  return days;
}

/** One month earlier or later: "2026-10", +1 -> "2026-11". */
function shiftMonth(month: string, by: number): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + by);
  return date.toISOString().slice(0, 7);
}

export default function HabitScreen() {
  return (
    <RequireUser>
      <HabitContent />
    </RequireUser>
  );
}

/** One habit: its progress (a month calendar and streaks) and history. */
function HabitContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useTheme();
  const { user } = useAuth();
  const today = todayInTimeZone(user?.timeZone ?? 'UTC');
  const [habit, setHabit] = useState<Habit | null>(null);
  const [tab, setTab] = useState<Tab>('progress');
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

  // Reload when coming back from Edit, so a new name or emoji shows straight away.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <Screen>
      {/* "Edit" on the right of the top bar, like iPhone Settings. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: '/habits/[id]/edit', params: { id } })}
              accessibilityRole="button"
              hitSlop={10}
            >
              <Text style={{ color: c.accent, fontSize: 17, fontWeight: '600' }}>Edit</Text>
            </Pressable>
          ),
        }}
      />

      {error ? (
        <ErrorBox message={error} />
      ) : !habit ? (
        <MutedText>Loading…</MutedText>
      ) : (
        <>
          <View style={{ alignItems: 'center', gap: space[2] }}>
            <HabitEmoji emoji={habit.emoji} name={habit.name} size={96} />
            <Text style={{ fontSize: 28, fontWeight: '800', color: c.text, textAlign: 'center' }}>
              {habit.name}
            </Text>
            <MutedText>
              {habit.description ?? 'Daily'}
              {habit.isArchived ? ' · Archived' : ''}
            </MutedText>
          </View>

          <Segmented
            label="View"
            options={[
              { value: 'progress', label: 'Progress' },
              { value: 'history', label: 'History' },
            ]}
            value={tab}
            onChange={setTab}
          />

          {tab === 'progress' ? (
            <>
              <MonthCalendar habit={habit} today={today} onChanged={() => void reload()} />
              <View style={{ flexDirection: 'row', gap: space[3] }}>
                <StreakTile
                  icon="flame"
                  iconColor={c.streak}
                  days={habit.currentStreak}
                  label="Current streak"
                />
                <StreakTile
                  icon="trophy"
                  iconColor="#eab308"
                  days={habit.bestStreak}
                  label="Best streak"
                />
              </View>
            </>
          ) : (
            <History habit={habit} today={today} />
          )}
        </>
      )}
    </Screen>
  );
}

/** A month of days; done days are filled purple. Tap a day to tick or untick it. */
function MonthCalendar({
  habit,
  today,
  onChanged,
}: {
  habit: Habit;
  today: string;
  onChanged: () => void;
}) {
  const c = useTheme();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [done, setDone] = useState<Set<string> | null>(null);
  const [pendingDay, setPendingDay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const days = monthDays(month);

  useEffect(() => {
    let ignore = false;
    const all = monthDays(month);
    listDone(habit.id, all[0], all[all.length - 1])
      .then((dates) => {
        if (!ignore) setDone(new Set(dates));
      })
      .catch(() => {
        if (!ignore) setError('Could not load this month.');
      });
    return () => {
      ignore = true;
    };
  }, [habit.id, month]);

  async function toggle(day: string) {
    if (!done) return;
    setError(null);
    setPendingDay(day);
    try {
      await (done.has(day) ? undoDone(habit.id, day) : markDone(habit.id, day));
      const next = new Set(done);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      setDone(next);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save that.');
    } finally {
      setPendingDay(null);
    }
  }

  // Empty cells before the 1st, so it lands under the right weekday.
  const blanks = (new Date(`${days[0]}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [...Array<null>(blanks).fill(null), ...days];
  const isThisMonth = month >= today.slice(0, 7);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => setMonth(shiftMonth(month, -1))}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>
          {MONTHS[Number(month.slice(5)) - 1]} {month.slice(0, 4)}
        </Text>
        <Pressable
          onPress={() => setMonth(shiftMonth(month, 1))}
          disabled={isThisMonth}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={10}
          style={{ opacity: isThisMonth ? 0.3 : 1 }}
        >
          <Ionicons name="chevron-forward" size={22} color={c.text} />
        </Pressable>
      </View>

      {error && <ErrorBox message={error} />}

      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((day) => (
          <Text
            key={day}
            style={{ flex: 1, textAlign: 'center', fontSize: 12, color: c.textMuted }}
          >
            {day}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space[2] }}>
        {cells.map((day, i) => {
          if (!day) return <View key={`blank-${i}`} style={{ width: `${100 / 7}%` }} />;
          const isDone = done?.has(day) ?? false;
          const isToday = day === today;
          const disabled =
            !done ||
            day > today ||
            day < habit.startDate ||
            habit.isArchived ||
            pendingDay !== null;
          return (
            <View key={day} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
              <Pressable
                onPress={() => void toggle(day)}
                disabled={disabled}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone, disabled }}
                accessibilityLabel={formatLongDate(day)}
                style={({ pressed }) => ({
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDone
                    ? c.accent
                    : isToday
                      ? c.accentSoft
                      : disabled
                        ? 'transparent'
                        : c.surfaceMuted,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={20} color={c.onAccent} />
                ) : (
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: isToday ? c.accent : disabled ? c.textMuted : c.text,
                    }}
                  >
                    {Number(day.slice(8))}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/** "12 days / Current streak", with an icon above. */
function StreakTile({
  icon,
  iconColor,
  days,
  label,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  days: number;
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
      <Text style={{ fontSize: 26, fontWeight: '800', color: c.text }}>
        {days} {days === 1 ? 'day' : 'days'}
      </Text>
      <Text style={{ fontSize: 15, color: c.textMuted }}>{label}</Text>
    </View>
  );
}

/** The days this habit was done in the last 90 days, newest first. */
function History({ habit, today }: { habit: Habit; today: string }) {
  const c = useTheme();
  const [dates, setDates] = useState<string[] | null>(null);

  useEffect(() => {
    let ignore = false;
    listDone(habit.id, addDays(today, -89), today)
      .then((data) => {
        if (!ignore) setDates([...data].reverse());
      })
      .catch(() => {
        if (!ignore) setDates([]);
      });
    return () => {
      ignore = true;
    };
  }, [habit.id, today]);

  if (!dates) return <MutedText>Loading…</MutedText>;
  if (dates.length === 0) return <MutedText>No ticks in the last 90 days yet.</MutedText>;
  return (
    <View
      style={{
        borderRadius: radius,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        overflow: 'hidden',
      }}
    >
      {dates.map((date, i) => (
        <View
          key={date}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[3],
            padding: space[3],
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: c.border,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark" size={16} color={c.onAccent} />
          </View>
          <Text style={{ fontSize: 16, color: c.text }}>{formatLongDate(date)}</Text>
        </View>
      ))}
    </View>
  );
}
