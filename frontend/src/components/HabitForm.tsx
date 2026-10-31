import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import type { HabitInput } from '../api/habits';
import { lastEmoji } from '../utils/emoji';
import { HabitEmoji } from './HabitEmoji';
import './HabitForm.css';

interface HabitFormProps {
  title: string;
  submitLabel: string;
  initialValues?: HabitInput; // filled in when editing; empty when creating
  onSubmit: (values: HabitInput) => Promise<void>;
  onCancel: () => void;
}

/** One form for creating and editing a habit. */
export function HabitForm({
  title,
  submitLabel,
  initialValues,
  onSubmit,
  onCancel,
}: HabitFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  );
  const [emoji, setEmoji] = useState<string | null>(
    initialValues?.emoji ?? null,
  );
  const [emojiHint, setEmojiHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Keeps only the newest emoji typed, so picking another one replaces the old one. */
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
      setEmojiHint('Only emojis here. Letters and numbers are not used.');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // An empty description is sent as null ("no description").
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        emoji,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not save the habit. Please try again.',
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card habit-form" onSubmit={handleSubmit}>
      <h2>{title}</h2>

      <label className="field">
        <span>Name</span>
        <input
          type="text"
          required
          maxLength={100}
          placeholder="e.g. Read 20 pages"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label className="field">
        <span>
          Description <small>(optional)</small>
        </span>
        <textarea
          rows={2}
          maxLength={500}
          placeholder="e.g. Before bed, no phone"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      {/* Emoji: any one emoji from the keyboard. */}
      <div className="field">
        <label htmlFor="habit-emoji">
          Emoji <small>(optional)</small>
        </label>
        <div className="emoji-row">
          <HabitEmoji emoji={emoji} name={name || '?'} size={48} />
          <input
            id="habit-emoji"
            type="text"
            className="emoji-input"
            placeholder="Tap here, then pick an emoji"
            value={emoji ?? ''}
            onChange={(event) => handleEmojiChange(event.target.value)}
            aria-describedby="habit-emoji-help"
          />
          {emoji && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => handleEmojiChange('')}
            >
              Remove
            </button>
          )}
        </div>
        <small id="habit-emoji-help" className="emoji-help">
          {emojiHint ??
            'On Windows press Win + . (full stop); on a Mac press Ctrl + Cmd + Space.'}
        </small>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="button button-primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
