import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { deviceTimeZone } from '@/api/auth';
import { ApiError } from '@/api/client';
import { DEFAULT_CLIMB, startClimb } from '@/api/habits';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/Button';
import { ClimberPicker } from '@/components/ClimberPicker';
import { ClimbPicker } from '@/components/ClimbPicker';
import { RequireUser } from '@/components/RequireUser';
import { TimeZonePicker } from '@/components/TimeZonePicker';
import { Card, ErrorBox, MutedText, Screen } from '@/components/ui';
import type { Climber } from '@/journey/kid';
import { useTheme } from '@/theme';

export default function WelcomeScreen() {
  return (
    <RequireUser>
      <WelcomeContent />
    </RequireUser>
  );
}

/**
 * Shown once, right after creating an account: pick your climber, check your
 * time zone, and choose your first climb.
 */
function WelcomeContent() {
  const router = useRouter();
  const c = useTheme();
  const { user, updateMe } = useAuth();
  const [climber, setClimber] = useState<Climber>(user?.climber ?? 'boy');
  // Filled in from this iPhone when the account was made; checked here.
  const [timeZone, setTimeZone] = useState(user?.timeZone ?? deviceTimeZone());
  const [goalDays, setGoalDays] = useState(DEFAULT_CLIMB);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleStart() {
    setError(null);
    setIsSaving(true);
    try {
      // The time zone first: the climb starts on "today" in that zone.
      await updateMe({ climber, timeZone });
      await startClimb(goalDays);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your choices.');
      setIsSaving(false);
    }
  }

  const heading = (text: string) => (
    <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{text}</Text>
  );

  return (
    <Screen>
      <Card>
        <Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>Welcome to RESET 🚴</Text>
        <MutedText>
          Every day you complete your habits, your climber rides up the hill. A few choices first;
          you can change them later in Profile.
        </MutedText>
      </Card>

      <Card>
        {heading('Who climbs the hill?')}
        <ClimberPicker value={climber} onChange={setClimber} disabled={isSaving} />
      </Card>

      <Card>
        {heading('Where do you live?')}
        <MutedText>Your day starts and ends at midnight in this time zone.</MutedText>
        <TimeZonePicker value={timeZone} onChange={setTimeZone} disabled={isSaving} />
      </Card>

      <Card>
        {heading('How long is your first climb?')}
        <ClimbPicker value={goalDays} onChange={setGoalDays} disabled={isSaving} />
      </Card>

      {error && <ErrorBox message={error} />}
      <Button
        title={isSaving ? 'Starting…' : 'Start climbing'}
        onPress={() => void handleStart()}
        disabled={isSaving}
      />
    </Screen>
  );
}
