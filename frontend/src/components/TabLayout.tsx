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

/**
 * The logged-in pages: a site header with the logo and the main menu.
 * On a computer the menu sits at the top, like a website. In a narrow
 * (phone-sized) window it moves to a bar at the bottom, within thumb reach.
 */
export function TabLayout() {
  return (
    <>
      <header className="site-header">
        <span className="app-title">
          <span className="app-logo" aria-hidden="true" />
          Reset
        </span>
        <nav className="site-nav" aria-label="Main">
          {TABS.map((tab) => (
            // NavLink knows when its page is open and adds the "active" class.
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className="site-nav-link"
            >
              <Icon name={tab.icon} size={20} />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      {/* The page itself. Wide pages use the whole width; others stay a neat column. */}
      <div className="page">
        <Outlet />
      </div>
    </>
  );
}
