import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import type { HabitInput } from '../api/habits';
import './HabitForm.css';

/** The colors a habit can have. Upper case, like the backend stores them. */
const HABIT_COLORS = [
  { value: '#0F766E', name: 'Teal' },
  { value: '#2563EB', name: 'Blue' },
  { value: '#7C3AED', name: 'Violet' },
  { value: '#DB2777', name: 'Pink' },
  { value: '#DC2626', name: 'Red' },
  { value: '#EA580C', name: 'Orange' },
  { value: '#CA8A04', name: 'Amber' },
  { value: '#16A34A', name: 'Green' },
];

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
  const [color, setColor] = useState(
    initialValues?.color ?? HABIT_COLORS[0].value,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // An empty description is sent as null ("no description").
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        color,
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

      {/* Radio buttons = "pick exactly one". Styled as colored circles. */}
      <fieldset className="color-picker">
        <legend>Color</legend>
        <div className="color-options">
          {HABIT_COLORS.map((option) => (
            <label key={option.value} className="color-option">
              <input
                type="radio"
                name="color"
                value={option.value}
                checked={color === option.value}
                onChange={() => setColor(option.value)}
              />
              <span
                className="color-swatch"
                style={{ backgroundColor: option.value }}
              />
              <span className="visually-hidden">{option.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
