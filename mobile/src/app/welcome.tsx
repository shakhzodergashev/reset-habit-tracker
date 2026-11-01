import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { ApiError } from '@/api/client';
import { DEFAULT_CLIMB, startClimb } from '@/api/habits';
import { Button } from '@/components/Button';
import { ClimbPicker } from '@/components/ClimbPicker';
import { RequireUser } from '@/components/RequireUser';
import { Card, ErrorBox, MutedText, Screen } from '@/components/ui';
import { useTheme } from '@/theme';

export default function WelcomeScreen() {
  return (
    <RequireUser>
      <WelcomeContent />
    </RequireUser>
  );
}

/** Shown once, right after creating an account: pick the first climb. */
function WelcomeContent() {
  const router = useRouter();
  const c = useTheme();
  const [goalDays, setGoalDays] = useState(DEFAULT_CLIMB);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleStart() {
    setError(null);
    setIsSaving(true);
    try {
      await startClimb(goalDays);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your climb.');
      setIsSaving(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>
          Choose your first climb 🚴
        </Text>
        <MutedText>
          Every day you complete your habits, your cyclist rides up the hill. How long should your
          first climb be? You can change it later in Profile.
        </MutedText>
        <ClimbPicker value={goalDays} onChange={setGoalDays} disabled={isSaving} />
        {error && <ErrorBox message={error} />}
        <Button
          title={isSaving ? 'Starting…' : 'Start climbing'}
          onPress={() => void handleStart()}
          disabled={isSaving}
        />
      </Card>
    </Screen>
  );
}
