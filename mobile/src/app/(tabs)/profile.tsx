import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { changeClimbLength, DEFAULT_CLIMB, getStats, startClimb } from '@/api/habits';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/Button';
import { ClimbPicker } from '@/components/ClimbPicker';
import { ChangePasswordCard, DeleteAccountCard } from '@/components/AccountCards';
import { Card, MutedText, TabScreen } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';
import { formatLongDate } from '@/utils/dates';

/** "Climb length": change how long the current climb is (or pick the first one). */
function ClimbSetting() {
  const c = useTheme();
  const [goalDays, setGoalDays] = useState<number | null>(null); // null = loading
  const [hasClimb, setHasClimb] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reload when the tab comes into view (the climb may have changed on Stats).
  useFocusEffect(
    useCallback(() => {
      getStats()
        .then((stats) => {
          setGoalDays(stats.climb?.goalDays ?? DEFAULT_CLIMB);
          setHasClimb(stats.climb !== null);
          setMessage(null);
        })
        .catch(() => setMessage('Could not load your climb.'));
    }, []),
  );

  async function handleChange(days: number) {
    const before = goalDays;
    setGoalDays(days); // show the choice straight away
    setMessage(null);
    setIsSaving(true);
    try {
      await (hasClimb ? changeClimbLength(days) : startClimb(days));
      setHasClimb(true);
      setMessage(`Saved: your climb is now ${days} days.`);
    } catch (err) {
      setGoalDays(before); // put the old choice back
      setMessage(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>Climb length</Text>
      {goalDays === null ? (
        <MutedText>{message ?? 'Loading…'}</MutedText>
      ) : (
        <ClimbPicker
          value={goalDays}
          onChange={(days) => void handleChange(days)}
          disabled={isSaving}
        />
      )}
      <MutedText>
        {goalDays !== null && message ? message : 'Days you have already climbed still count.'}
      </MutedText>
    </Card>
  );
}

/** The Profile tab: who is logged in, archived habits, and log out. */
export default function ProfileScreen() {
  const router = useRouter();
  const c = useTheme();
  const { user, logout } = useAuth();
  if (!user) return null; // the tabs are only shown to logged-in users

  return (
    <TabScreen title="Profile">
      {/* Who you are */}
      <View style={{ alignItems: 'center', gap: space[2], paddingVertical: space[3] }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: c.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 34, fontWeight: '800', color: c.accent }}>
            {user.email.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{user.email}</Text>
        <MutedText>Member since {formatLongDate(user.createdAt.slice(0, 10))}</MutedText>
      </View>

      {/* A list of rows, like iPhone Settings */}
      <View
        style={{
          borderRadius: radius,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          overflow: 'hidden',
        }}
      >
        <Row icon="globe-outline" label="Time zone" value={user.timeZone} />
        <Row
          icon="archive-outline"
          label="Archived habits"
          onPress={() => router.push('/archived')}
          isLast
        />
      </View>

      <ClimbSetting />
      <ChangePasswordCard />

      <MutedText>
        The weather on your hills uses your location. It goes straight to Open-Meteo, a free weather
        service, and never to RESET’s server.
      </MutedText>

      <Button title="Log out" variant="secondary" onPress={() => void logout()} />

      {/* Last, so it's never tapped by accident. */}
      <DeleteAccountCard />
    </TabScreen>
  );
}

/** One settings row: an icon, a label, and a value or an arrow. */
function Row({
  icon,
  label,
  value,
  onPress,
  isLast = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        padding: space[4],
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: c.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={c.accent} />
      <Text style={{ flex: 1, fontSize: 16, color: c.text }}>{label}</Text>
      {value && <Text style={{ fontSize: 15, color: c.textMuted }}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
    </Pressable>
  );
}
