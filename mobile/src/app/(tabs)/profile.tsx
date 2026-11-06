import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { deviceTimeZone, type UserSettings } from '@/api/auth';
import { ApiError } from '@/api/client';
import { changeClimbLength, DEFAULT_CLIMB, getStats, startClimb } from '@/api/habits';
import { useAuth } from '@/auth/auth-context';
import { AccentPicker } from '@/components/AccentPicker';
import { Button } from '@/components/Button';
import { ClimberPicker } from '@/components/ClimberPicker';
import { ClimbPicker } from '@/components/ClimbPicker';
import { ChangePasswordCard, DeleteAccountCard } from '@/components/AccountCards';
import { Segmented } from '@/components/Segmented';
import { Card, ErrorBox, MutedText, TabScreen } from '@/components/ui';
import { getThemeChoice, radius, setThemeChoice, space, useTheme, type ThemeChoice } from '@/theme';
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

/**
 * Shown only when the iPhone's time zone differs from RESET's (after travel, say),
 * with a button to switch. Your day starts and ends in RESET's time zone.
 */
function TimeZoneNotice() {
  const { user, updateMe } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const here = deviceTimeZone();

  if (!user || user.timeZone === here) return null;

  async function handleSwitch() {
    setError(null);
    setIsSaving(true);
    try {
      await updateMe({ timeZone: here }); // the screen redraws and this notice goes away
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change it.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <MutedText>
        This iPhone is in {here}, but RESET uses {user.timeZone}. Switch if you’ve moved or are
        travelling, so your days start at the right midnight.
      </MutedText>
      {error && <ErrorBox message={error} />}
      <Button
        title={isSaving ? 'Switching…' : `Switch to ${here}`}
        variant="secondary"
        onPress={() => void handleSwitch()}
        disabled={isSaving}
      />
    </Card>
  );
}

/**
 * Saves account settings (climber, colour) straight away, for the cards below.
 * The whole app redraws with the change as soon as the server says OK.
 */
function useSaveSettings() {
  const { updateMe } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function save(changes: UserSettings) {
    setError(null);
    setIsSaving(true);
    try {
      await updateMe(changes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  }

  const errorBox = error && <ErrorBox message={error} />;
  return { save, isSaving, errorBox };
}

/** "Climber": the boy or the girl on the hills. Saved on the account. */
function ClimberSetting() {
  const c = useTheme();
  const { user } = useAuth();
  const { save, isSaving, errorBox } = useSaveSettings();
  if (!user) return null;

  return (
    <Card>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>Climber</Text>
      <ClimberPicker
        value={user.climber}
        onChange={(climber) => void save({ climber })}
        disabled={isSaving}
      />
      {errorBox}
    </Card>
  );
}

/** "Colour": the app colour, for buttons, ticks and the bike. Saved on the account. */
function AccentSetting() {
  const c = useTheme();
  const { user } = useAuth();
  const { save, isSaving, errorBox } = useSaveSettings();
  if (!user) return null;

  return (
    <Card>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>Colour</Text>
      <AccentPicker
        value={user.accent}
        onChange={(accent) => void save({ accent })}
        disabled={isSaving}
      />
      {errorBox}
    </Card>
  );
}

/** "Appearance": Automatic follows the iPhone; Light or Dark forces one look. */
function ThemeSetting() {
  const c = useTheme();
  const [choice, setChoice] = useState<ThemeChoice>(getThemeChoice);

  return (
    <Card>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>Appearance</Text>
      <Segmented
        label="Appearance"
        options={[
          { value: 'auto', label: 'Automatic' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value={choice}
        onChange={(next) => {
          setChoice(next);
          setThemeChoice(next).catch(() => {}); // the app has switched even if saving fails
        }}
      />
      <MutedText>
        {choice === 'auto'
          ? 'Follows your iPhone’s light or dark setting.'
          : 'Saved on this iPhone.'}
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

      <TimeZoneNotice />
      <ClimbSetting />
      <ClimberSetting />
      <AccentSetting />
      <ThemeSetting />
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
