import { Text, View } from 'react-native';
import { space, useTheme } from '../theme';

interface BarChartProps {
  bars: { label: string; rate: number | null }[]; // rate 0-100, null = nothing yet
  highlight: number; // the index of today's bar (or this month's), -1 for none
  showEvery?: number; // show every n-th label, when there are many bars
}

const PLOT_HEIGHT = 140;
const TICKS = [100, 75, 50, 25, 0];

/** Completion bars from 0% to 100%, with the current one in full purple. */
export function BarChart({ bars, highlight, showEvery = 1 }: BarChartProps) {
  const c = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: space[2] }}>
      {/* 100% ... 0% down the left side */}
      <View style={{ height: PLOT_HEIGHT, justifyContent: 'space-between' }}>
        {TICKS.map((tick) => (
          <Text key={tick} style={{ fontSize: 11, color: c.textMuted, lineHeight: 12 }}>
            {tick}%
          </Text>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {/* Grid lines behind the bars */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 6,
            height: PLOT_HEIGHT - 12,
            justifyContent: 'space-between',
          }}
        >
          {TICKS.map((tick) => (
            <View key={tick} style={{ height: 1, backgroundColor: c.border }} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 3 }}>
          {bars.map((bar, i) => {
            const isCurrent = i === highlight;
            return (
              <View
                key={`${bar.label}-${i}`}
                style={{ flex: 1, alignItems: 'center' }}
                accessible
                accessibilityLabel={`${bar.label}: ${bar.rate === null ? 'nothing yet' : `${bar.rate}%`}`}
              >
                <View
                  style={{
                    height: PLOT_HEIGHT - 6,
                    paddingTop: 6,
                    width: '100%',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}
                >
                  {bar.rate !== null && (
                    <View
                      style={{
                        width: '70%',
                        maxWidth: 30,
                        // At least a sliver, so a 0% day still shows it was counted.
                        height: (Math.max(bar.rate, 2) / 100) * (PLOT_HEIGHT - 12),
                        borderTopLeftRadius: 7,
                        borderTopRightRadius: 7,
                        borderBottomLeftRadius: 3,
                        borderBottomRightRadius: 3,
                        backgroundColor: c.accent,
                        opacity: isCurrent ? 1 : 0.45,
                      }}
                    />
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: isCurrent ? c.text : c.textMuted,
                    fontWeight: isCurrent ? '700' : '400',
                  }}
                >
                  {i % showEvery === 0 || isCurrent ? bar.label : ' '}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
