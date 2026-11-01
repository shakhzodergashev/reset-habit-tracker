import { useState } from 'react';
import { Text, View } from 'react-native';
import { ApiError } from '../api/client';
import { DEFAULT_CLIMB, startClimb, type Climb, type Stats } from '../api/habits';
import { useWeather } from '../journey/useWeather';
import { radius, space, useTheme } from '../theme';
import { formatDays } from '../utils/emoji';
import { Button } from './Button';
import { ClimbPicker } from './ClimbPicker';
import { HillScene } from './HillScene';
import { Card, ErrorBox, MutedText } from './ui';

/** The current climb's hill: the finish flag is the climb's last day. */
export function ClimbHill({ climb }: { climb: Climb }) {
  const c = useTheme();
  const weather = useWeather();
  return (
    <View
      style={{
        borderRadius: radius + 4,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        overflow: 'hidden',
      }}
    >
      <HillScene
        progress={climb.journeyDays / climb.goalDays}
        weather={weather}
        gainText={(gained) => `+${formatDays(gained * climb.goalDays)} day`}
        accessibilityLabel={`Your climb: ${formatDays(climb.journeyDays)} of ${climb.goalDays} days`}
        rideInOnOpen
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: space[4],
        }}
      >
        <Text style={{ fontSize: 15, color: c.textMuted }}>Your climb</Text>
        <Text style={{ fontSize: 15, color: c.textMuted }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>
            {formatDays(climb.journeyDays)}
          </Text>{' '}
          of {climb.goalDays} days
        </Text>
      </View>
    </View>
  );
}

/** Pick a length and start a climb: the first one, or the next one after finishing. */
export function StartClimbCard({
  title,
  text,
  buttonLabel,
  onStarted,
}: {
  title: string;
  text: string;
  buttonLabel: string;
  onStarted: (stats: Stats) => void;
}) {
  const c = useTheme();
  const [goalDays, setGoalDays] = useState(DEFAULT_CLIMB);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleStart() {
    setError(null);
    setIsSaving(true);
    try {
      onStarted(await startClimb(goalDays));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start the climb.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{title}</Text>
      <MutedText>{text}</MutedText>
      <ClimbPicker value={goalDays} onChange={setGoalDays} disabled={isSaving} />
      {error && <ErrorBox message={error} />}
      <Button
        title={isSaving ? 'Starting…' : buttonLabel}
        onPress={() => void handleStart()}
        disabled={isSaving}
      />
    </Card>
  );
}
