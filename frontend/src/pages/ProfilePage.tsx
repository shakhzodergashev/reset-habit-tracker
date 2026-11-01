import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import {
  changeClimbLength,
  DEFAULT_CLIMB,
  getStats,
  startClimb,
} from '../api/stats';
import { useAuth } from '../auth/auth-context';
import { ClimbPicker } from '../components/ClimbPicker';
import { formatLongDate } from '../utils/dates';
import './ProfilePage.css';

/** "Climb length": change how long the current climb is (or pick the first one). */
function ClimbSetting() {
  const [goalDays, setGoalDays] = useState<number | null>(null); // null = loading
  const [hasClimb, setHasClimb] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    getStats()
      .then((stats) => {
        if (ignore) return;
        setGoalDays(stats.climb?.goalDays ?? DEFAULT_CLIMB);
        setHasClimb(stats.climb !== null);
      })
      .catch(() => {
        if (!ignore) setMessage('Could not load your climb.');
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleChange(days: number) {
    const before = goalDays;
    setGoalDays(days); // show the choice straight away
    setMessage(null);
    setIsSaving(true);
    try {
      await (hasClimb ? changeClimbLength(days) : startClimb(days));
      setHasClimb(true);
      setMessage(`Saved: your climb is now ${days} days.`);
    } catch (err) {
      setGoalDays(before); // put the old choice back
      setMessage(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="card profile-climb">
      <h3>Climb length</h3>
      {goalDays === null ? (
        <p className="profile-note">{message ?? 'Loading…'}</p>
      ) : (
        <ClimbPicker
          value={goalDays}
          onChange={(days) => void handleChange(days)}
          disabled={isSaving}
        />
      )}
      <p className="profile-note" role="status">
        {goalDays !== null && message
          ? message
          : 'Days you have already climbed still count.'}
      </p>
    </section>
  );
}

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

      <ClimbSetting />

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
