import { Link } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { formatLongDate } from '../utils/dates';
import './ProfilePage.css';

/** The Profile tab: who is logged in, archived habits, and log out. */
export function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) return null; // RequireAuth only shows this page to logged-in users

  return (
    <div className="profile-page">
      <section className="profile-who">
        <span className="profile-avatar" aria-hidden="true">
          {user.email.charAt(0).toUpperCase()}
        </span>
        <h2>{user.email}</h2>
        <p>Member since {formatLongDate(user.createdAt.slice(0, 10))}</p>
      </section>

      {/* A list of rows, like phone settings */}
      <ul className="card profile-rows">
        <li className="profile-row">
          <span>Time zone</span>
          <span className="profile-value">{user.timeZone}</span>
        </li>
        <li>
          <Link to="/habits/archived">
            <span>Archived habits</span>
            <span aria-hidden="true">›</span>
          </Link>
        </li>
      </ul>

      <p className="profile-note">
        The weather on your hills uses your location. It goes straight to
        Open-Meteo, a free weather service, and never to RESET’s server.
      </p>

      <button
        className="button button-danger"
        type="button"
        onClick={() => void logout()}
      >
        Log out
      </button>
    </div>
  );
}
