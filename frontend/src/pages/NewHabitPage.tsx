import { useNavigate } from 'react-router';
import { createHabit } from '../api/habits';
import { HabitForm } from '../components/HabitForm';

/** /habits/new: create a habit, then go back to the dashboard. */
export function NewHabitPage() {
  const navigate = useNavigate();

  return (
    <HabitForm
      title="New habit"
      submitLabel="Create habit"
      onSubmit={async (values) => {
        await createHabit(values);
        navigate('/');
      }}
      onCancel={() => navigate('/')}
    />
  );
}
