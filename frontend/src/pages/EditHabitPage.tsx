import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import type { Habit } from '../api/dashboard';
import {
  archiveHabit,
  deleteHabit,
  getHabit,
  updateHabit,
} from '../api/habits';
import { HabitActionCard } from '../components/HabitActionCard';
import { HabitForm } from '../components/HabitForm';

/** /habits/:id/edit: change a habit's name, description or emoji. */
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
            err instanceof ApiError &&
              (err.status === 404 || err.status === 400)
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
        <Link to="/habits">Back to your habits</Link>
      </section>
    );
  }
  if (!habit) {
    return <p className="status-message">Loading…</p>;
  }

  return (
    // <> … </> is a "fragment": it groups siblings without adding an extra element.
    <>
      <HabitForm
        title="Edit habit"
        submitLabel="Save changes"
        // Pre-fill the form with the habit's current values.
        initialValues={{
          name: habit.name,
          description: habit.description,
          emoji: habit.emoji,
        }}
        onSubmit={async (values) => {
          await updateHabit(habit.id, values);
          navigate(`/habits/${habit.id}`); // back to the habit's page
        }}
        onCancel={() => navigate(`/habits/${habit.id}`)}
      />

      {!habit.isArchived && (
        <HabitActionCard
          title="Archive habit"
          explanation="It disappears from your dashboard, but its history is kept. You can restore it any time from “Archived habits”."
          question={
            <>
              Archive <strong>{habit.name}</strong>?
            </>
          }
          startLabel="Archive habit…"
          confirmLabel="Archive"
          busyLabel="Archiving…"
          failMessage="Could not archive the habit. Please try again."
          onConfirm={async () => {
            await archiveHabit(habit.id);
            navigate('/habits');
          }}
        />
      )}

      {/* Last, so it's never clicked by accident. */}
      <HabitActionCard
        isDanger
        title="Delete habit"
        explanation="Deletes the habit and all its ticks, for good. Your insights will no longer count it. To keep its history, archive it instead."
        question={
          <>
            Delete <strong>{habit.name}</strong> forever? This can’t be undone.
          </>
        }
        startLabel="Delete habit…"
        confirmLabel="Delete forever"
        busyLabel="Deleting…"
        failMessage="Could not delete the habit. Please try again."
        onConfirm={async () => {
          await deleteHabit(habit.id);
          // The habit's own page is gone, so go to the list it came from.
          navigate(habit.isArchived ? '/habits/archived' : '/habits');
        }}
      />
    </>
  );
}
