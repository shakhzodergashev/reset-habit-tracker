import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { listTimeZones } from '../api/auth';
import { space, useTheme } from '../theme';
import { useInputStyle } from './ui';

interface TimeZonePickerProps {
  value: string;
  onChange: (timeZone: string) => void;
  disabled?: boolean;
}

const MAX_MATCHES = 8;

/** "Asia/Tashkent" -> "Asia / Tashkent", "America/New_York" -> "America / New York". */
const pretty = (zone: string) => zone.replaceAll('_', ' ').replaceAll('/', ' / ');

/**
 * Shows the chosen time zone with a "Change" button. Changing opens a search box:
 * type a city ("london") and tap one of the matches.
 */
export function TimeZonePicker({ value, onChange, disabled }: TimeZonePickerProps) {
  const c = useTheme();
  const inputStyle = useInputStyle();
  const [zones, setZones] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listTimeZones()
      .then(setZones)
      .catch(() => {}); // no list: the current zone simply stays
  }, []);

  // Spaces and underscores count the same, so "new york" finds "America/New_York".
  const words = search.trim().toLowerCase().replaceAll(' ', '_');
  const matches = words
    ? zones.filter((zone) => zone.toLowerCase().includes(words)).slice(0, MAX_MATCHES)
    : [];

  if (!isOpen) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: c.text }}>
          {pretty(value)}
        </Text>
        <Pressable
          onPress={() => setIsOpen(true)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Change time zone"
          hitSlop={8}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: c.accent }}>Change</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: space[2] }}>
      <TextInput
        style={inputStyle}
        value={search}
        onChangeText={setSearch}
        placeholder="Type a city, e.g. London"
        placeholderTextColor={c.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />
      {matches.map((zone) => (
        <Pressable
          key={zone}
          onPress={() => {
            onChange(zone);
            setIsOpen(false);
            setSearch('');
          }}
          accessibilityRole="button"
          style={({ pressed }) => ({
            paddingVertical: space[2],
            paddingHorizontal: space[3],
            borderRadius: 10,
            backgroundColor: pressed ? c.accentSoft : c.surfaceMuted,
          })}
        >
          <Text style={{ fontSize: 16, color: c.text }}>{pretty(zone)}</Text>
        </Pressable>
      ))}
      {words !== '' && matches.length === 0 && (
        <Text style={{ color: c.textMuted }}>No time zone matches “{search.trim()}”.</Text>
      )}
      <Pressable onPress={() => setIsOpen(false)} accessibilityRole="button" hitSlop={8}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: c.textMuted }}>
          Keep {pretty(value)}
        </Text>
      </Pressable>
    </View>
  );
}
