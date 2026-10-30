import { useRouter } from 'expo-router';
import { createHabit } from '@/api/habits';
import { HabitForm } from '@/components/HabitForm';
import { RequireUser } from '@/components/RequireUser';
import { Screen } from '@/components/ui';

/** New habit: opens as a sheet from the bottom, closes after saving. */
export default function NewHabitScreen() {
  const router = useRouter();

  return (
    <RequireUser>
      <Screen>
        <HabitForm
          submitLabel="Create habit"
          onSubmit={async (values) => {
            await createHabit(values);
            router.back(); // the dashboard reloads when it comes back into view
          }}
        />
      </Screen>
    </RequireUser>
  );
}
