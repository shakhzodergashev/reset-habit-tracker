import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { space, useTheme } from '../theme';

interface CompletionChartProps {
  bars: { label: string; rate: number | null }[]; // rate 0-100, null = nothing yet
  highlight: number; // the index of today's bar (or this month's), -1 for none
  // Many thin bars (a month): only round days get a label, and a % shows on
  // the bar you tap instead of on every one.
  dense?: boolean;
  // Show only the first letter of each label under the bars ("Jan" -> "J"),
  // with slightly smaller % numbers, so 12 months fit on a phone.
  initials?: boolean;
}

const TOP = 18; // room above 100% for the % labels
const PLOT = 140; // the height from 0% to 100%
const TICKS = [100, 75, 50, 25, 0];
const DENSE_LABELS = new Set(['1', '5', '10', '15', '20', '25', '30']);

/**
 * Completion bars from 0% to 100%, with the current one in full colour and the
 * % above each bar (week, year) or above the one you tap (month).
 */
export function CompletionChart({
  bars,
  highlight,
  dense = false,
  initials = false,
}: CompletionChartProps) {
  const c = useTheme();
  const [selected, setSelected] = useState(highlight);
  const yFor = (rate: number) => TOP + (1 - rate / 100) * PLOT;
  const picked = bars[selected];

  return (
    <View style={{ gap: space[2] }}>
      <View style={{ flexDirection: 'row', gap: space[2] }}>
        {/* 100% ... 0% down the left side, each next to its grid line */}
        <View style={{ height: TOP + PLOT, width: 34 }}>
          {TICKS.map((tick) => (
            <Text
              key={tick}
              style={{
                position: 'absolute',
                top: yFor(tick) - 7,
                right: 0,
                fontSize: 11,
                lineHeight: 14,
                color: c.textMuted,
              }}
            >
              {tick}%
            </Text>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          {/* Grid lines behind the bars */}
          {TICKS.map((tick) => (
            <View
              key={tick}
              style={{
                position: 'absolute',
                top: yFor(tick),
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: c.border,
              }}
            />
          ))}

          {/* One column per day (or month); tappable in month view */}
          <View style={{ flexDirection: 'row', height: TOP + PLOT }}>
            {bars.map((bar, i) => {
              const strong = i === highlight || (dense && i === selected);
              const showsValue = bar.rate !== null && (!dense || i === selected);
              const height = bar.rate === null ? 0 : (bar.rate / 100) * PLOT;
              const value = bar.rate === null ? 'nothing yet' : `${bar.rate}%`;
              return (
                <Pressable
                  key={`${bar.label}-${i}`}
                  onPress={dense ? () => setSelected(i) : undefined}
                  disabled={!dense}
                  accessible
                  accessibilityRole={dense ? 'button' : undefined}
                  accessibilityLabel={`${dense ? 'Day ' : ''}${bar.label}: ${value}`}
                  style={{ flex: 1, alignItems: 'center' }}
                >
                  {bar.rate !== null && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '70%',
                        maxWidth: 30,
                        // At least a sliver, so a 0% day still shows it was counted.
                        height: Math.max(height, 3),
                        borderTopLeftRadius: 7,
                        borderTopRightRadius: 7,
                        borderBottomLeftRadius: 3,
                        borderBottomRightRadius: 3,
                        backgroundColor: c.accent,
                        opacity: strong ? 1 : 0.45,
                      }}
                    />
                  )}
                  {showsValue && (
                    <Text
                      numberOfLines={1}
                      style={{
                        position: 'absolute',
                        bottom: height + 3,
                        width: 44,
                        textAlign: 'center',
                        fontSize: initials ? 9.5 : 11,
                        fontWeight: '700',
                        letterSpacing: initials ? -0.3 : 0,
                        color: strong ? c.text : c.textMuted,
                      }}
                    >
                      {bar.rate}%
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* The labels under the columns */}
          <View style={{ flexDirection: 'row', height: 18, marginTop: 4 }}>
            {bars.map((bar, i) => (
              <View key={`${bar.label}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
                {(!dense || DENSE_LABELS.has(bar.label)) && (
                  <Text
                    numberOfLines={1}
                    style={{
                      position: 'absolute',
                      width: 40,
                      textAlign: 'center',
                      fontSize: 11,
                      color: i === highlight ? c.text : c.textMuted,
                      fontWeight: i === highlight ? '700' : '400',
                    }}
                  >
                    {initials ? bar.label.charAt(0) : bar.label}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>

      {dense && (
        <Text style={{ fontSize: 14, color: c.textMuted, textAlign: 'center' }}>
          {picked && picked.rate !== null
            ? `Day ${picked.label}: ${picked.rate}% of habits done`
            : 'Tap a bar to see its %.'}
        </Text>
      )}
    </View>
  );
}
