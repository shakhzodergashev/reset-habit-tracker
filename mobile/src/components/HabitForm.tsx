import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ApiError } from '../api/client';
import type { HabitInput } from '../api/habits';
import { colors, HABIT_COLORS, space } from '../theme';
import { Button } from './Button';
import { ErrorBox, FieldLabel, inputStyle } from './ui';

interface HabitFormProps {
  submitLabel: string;
  initialValues?: HabitInput;
  onSubmit: (values: HabitInput) => Promise<void>;
}

/** The phone version of the website's HabitForm: name, description and a color. */
export function HabitForm({ submitLabel, initialValues, onSubmit }: HabitFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [color, setColor] = useState(initialValues?.color ?? HABIT_COLORS[0].value);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Please give the habit a name.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || null, color });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the habit.');
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <FieldLabel>Name</FieldLabel>
        {/* TextInput is React Native's text box. onChangeText gives the new text directly. */}
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Read 20 pages"
          maxLength={100}
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <FieldLabel>Description (optional)</FieldLabel>
        <TextInput
          style={[inputStyle, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Before bed, no phone"
          maxLength={500}
          multiline
        />
      </View>

      <View style={styles.field}>
        <FieldLabel>Color</FieldLabel>
        <View style={styles.colors} accessibilityRole="radiogroup">
          {HABIT_COLORS.map((option) => {
            const selected = option.value === color;
            return (
              <Pressable
                key={option.value}
                onPress={() => setColor(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={option.name}
                style={[styles.swatchRing, selected && styles.swatchRingSelected]}
              >
                <View style={[styles.swatch, { backgroundColor: option.value }]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {error && <ErrorBox message={error} />}

      <Button
        title={isSubmitting ? 'Saving…' : submitLabel}
        onPress={() => void handleSubmit()}
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space[4] },
  field: { gap: space[1] },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  swatchRing: {
    padding: 3,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchRingSelected: { borderColor: colors.text },
  swatch: { width: 36, height: 36, borderRadius: 18 },
});
