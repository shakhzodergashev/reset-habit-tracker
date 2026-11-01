import { NavLink, Outlet } from 'react-router';
import { Icon, type IconName } from './Icon';
import './TabLayout.css';

const TABS: { to: string; label: string; icon: IconName; end: boolean }[] = [
  { to: '/', label: 'Today', icon: 'home', end: true },
  // Habits stays lit on a habit's own pages too (/habits/...).
  { to: '/habits', label: 'Habits', icon: 'layers', end: false },
  { to: '/insights', label: 'Insights', icon: 'chart', end: true },
  { to: '/profile', label: 'Profile', icon: 'user', end: true },
];

/** The logged-in pages, with a tab bar fixed to the bottom of the screen. */
export function TabLayout() {
  return (
    <>
      <Outlet />
      <nav className="tab-bar" aria-label="Main">
        {TABS.map((tab) => (
          // NavLink knows when its page is open and adds the "active" class.
          <NavLink key={tab.to} to={tab.to} end={tab.end} className="tab">
            <Icon name={tab.icon} />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
