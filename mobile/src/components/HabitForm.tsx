import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ApiError } from '../api/client';
import type { HabitInput } from '../api/habits';
import { space, useTheme } from '../theme';
import { lastEmoji } from '../utils/emoji';
import { Button } from './Button';
import { HabitEmoji } from './HabitEmoji';
import { ErrorBox, FieldLabel, MutedText, useInputStyle } from './ui';

interface HabitFormProps {
  submitLabel: string;
  initialValues?: HabitInput;
  onSubmit: (values: HabitInput) => Promise<void>;
}

/** Name, description and emoji. Used by New habit and Edit habit. */
export function HabitForm({ submitLabel, initialValues, onSubmit }: HabitFormProps) {
  const c = useTheme();
  const inputStyle = useInputStyle();
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [emoji, setEmoji] = useState<string | null>(initialValues?.emoji ?? null);
  const [emojiHint, setEmojiHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Keeps only the newest emoji typed, so tapping another emoji replaces the old one. */
  function handleEmojiChange(text: string) {
    if (text.trim() === '') {
      setEmoji(null);
      setEmojiHint(null);
      return;
    }
    const picked = lastEmoji(text);
    if (picked) {
      setEmoji(picked);
      setEmojiHint(null);
    } else {
      setEmojiHint('Only emojis here. Tap the 😀 key on your keyboard.');
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Please give the habit a name.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        emoji,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the habit.');
      setIsSubmitting(false);
    }
  }

  return (
    <View style={{ gap: space[4] }}>
      <View style={{ gap: space[1] }}>
        <FieldLabel>Name</FieldLabel>
        {/* TextInput is React Native's text box. onChangeText gives the new text directly. */}
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Read 20 pages"
          placeholderTextColor={c.textMuted}
          maxLength={100}
        />
      </View>

      <View style={{ gap: space[1] }}>
        <FieldLabel>Description (optional)</FieldLabel>
        <TextInput
          style={[inputStyle, { minHeight: 70, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Before bed, no phone"
          placeholderTextColor={c.textMuted}
          maxLength={500}
          multiline
        />
      </View>

      {/* Emoji: any one emoji from the iPhone's own emoji keyboard. */}
      <View style={{ gap: space[1] }}>
        <FieldLabel>Emoji (optional)</FieldLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <HabitEmoji emoji={emoji} name={name || '?'} />
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            value={emoji ?? ''}
            onChangeText={handleEmojiChange}
            placeholder="Tap, then the 😀 key"
            placeholderTextColor={c.textMuted}
            autoCorrect={false}
            accessibilityLabel="Emoji"
          />
          {emoji && (
            <Pressable onPress={() => handleEmojiChange('')} accessibilityRole="button" hitSlop={8}>
              <Text style={{ color: c.accent, fontWeight: '600' }}>Remove</Text>
            </Pressable>
          )}
        </View>
        {emojiHint && <MutedText>{emojiHint}</MutedText>}
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
