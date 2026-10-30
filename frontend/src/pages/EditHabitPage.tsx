import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import type { Habit } from '../api/dashboard';
import { archiveHabit, getHabit, updateHabit } from '../api/habits';
import { ArchiveHabitCard } from '../components/ArchiveHabitCard';
import { HabitForm } from '../components/HabitForm';

/** /habits/:id/edit: change a habit's name, description or color. */
export function EditHabitPage() {
  // useParams reads the :id part of the address, e.g. /habits/36bc.../edit
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load the habit when the page opens (and again if the id in the address changes).
  useEffect(() => {
    let ignore = false;

    getHabit(id)
      .then((data) => {
        if (!ignore) setHabit(data);
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(
            err instanceof ApiError && (err.status === 404 || err.status === 400)
              ? 'Habit not found.'
              : 'Could not load this habit.',
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]); // [id] = run again whenever the id changes

  if (error) {
    return (
      <section className="card welcome">
        <h2>{error}</h2>
        <Link to="/">Back to your habits</Link>
      </section>
    );
  }
  if (!habit) {
    return <p className="status-message">Loading…</p>;
  }

  return (
    // <> … </> is a "fragment": it groups two siblings without adding an extra element.
    <>
      <HabitForm
        title="Edit habit"
        submitLabel="Save changes"
        // Pre-fill the form with the habit's current values.
        initialValues={{
          name: habit.name,
          description: habit.description,
          color: habit.color,
        }}
        onSubmit={async (values) => {
          await updateHabit(habit.id, values);
          navigate('/');
        }}
        onCancel={() => navigate('/')}
      />

      {!habit.isArchived && (
        <ArchiveHabitCard
          habitName={habit.name}
          onArchive={async () => {
            await archiveHabit(habit.id);
            navigate('/');
          }}
        />
      )}
    </>
  );
}
