import { Pressable, Text, View } from 'react-native';
import { space, useTheme } from '../theme';
import { addDays, formatDayOfMonth, formatWeekday } from '../utils/dates';

/** 0 = Monday ... 6 = Sunday, for "YYYY-MM-DD". */
function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

interface WeekStripProps {
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}

/** This week, Monday to Sunday. Tap a day to see (and tick) its habits; future days are faded. */
export function WeekStrip({ today, selected, onSelect }: WeekStripProps) {
  const c = useTheme();
  const monday = addDays(today, -weekdayIndex(today));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <View style={{ flexDirection: 'row', gap: space[1] }}>
      {days.map((day) => {
        const isSelected = day === selected;
        const isFuture = day > today;
        return (
          <Pressable
            key={day}
            onPress={() => onSelect(day)}
            disabled={isFuture}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: isFuture }}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              gap: 2,
              paddingVertical: space[2],
              borderRadius: 14,
              backgroundColor: isSelected ? c.accent : 'transparent',
              opacity: isFuture ? 0.4 : pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 13, color: isSelected ? c.onAccent : c.textMuted }}>
              {formatWeekday(day)}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: isSelected ? c.onAccent : day === today ? c.accent : c.text,
              }}
            >
              {formatDayOfMonth(day)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
