import { NativeTabs } from 'expo-router/native-tabs';
import { RequireUser } from '@/components/RequireUser';
import { useTheme } from '@/theme';

/**
 * The bottom tab bar: Today, Habits, Insights and Profile. NativeTabs is the iPhone's
 * own tab bar, so it looks and feels like every other iPhone app.
 */
export default function TabsLayout() {
  const c = useTheme();

  return (
    <RequireUser>
      <NativeTabs tintColor={c.accent}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
          <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="habits">
          <NativeTabs.Trigger.Icon
            sf={{ default: 'square.stack.3d.up', selected: 'square.stack.3d.up.fill' }}
          />
          <NativeTabs.Trigger.Label>Habits</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="insights">
          <NativeTabs.Trigger.Icon sf="chart.bar.fill" />
          <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </RequireUser>
  );
}
