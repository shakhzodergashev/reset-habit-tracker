import { NavLink, Outlet } from 'react-router';
import './TabLayout.css';

const TABS = [
  { to: '/', label: 'Today', icon: '☀️' },
  { to: '/stats', label: 'Stats', icon: '📊' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

/** The logged-in pages, with a tab bar fixed to the bottom of the screen. */
export function TabLayout() {
  return (
    <>
      <Outlet />
      <nav className="tab-bar" aria-label="Main">
        {TABS.map((tab) => (
          // NavLink knows when its page is open and adds the "active" class.
          <NavLink key={tab.to} to={tab.to} end className="tab">
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
