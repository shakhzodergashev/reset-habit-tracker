import { NativeTabs } from 'expo-router/native-tabs';
import { RequireUser } from '@/components/RequireUser';
import { useTheme } from '@/theme';

/**
 * The bottom tab bar: Today, Stats and Profile. NativeTabs is the iPhone's own tab bar,
 * so it looks and feels like every other iPhone app.
 */
export default function TabsLayout() {
  const c = useTheme();

  return (
    <RequireUser>
      <NativeTabs tintColor={c.accent}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} />
          <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="stats">
          <NativeTabs.Trigger.Icon sf="chart.bar.fill" />
          <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon
            sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </RequireUser>
  );
}
