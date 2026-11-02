import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { browserTimeZone } from '../api/auth';
import { ApiError } from '../api/client';
import {
  changeClimbLength,
  DEFAULT_CLIMB,
  getStats,
  startClimb,
} from '../api/stats';
import { useAuth } from '../auth/auth-context';
import {
  ChangePasswordCard,
  DeleteAccountCard,
} from '../components/AccountCards';
import { ClimberPicker } from '../components/ClimberPicker';
import { ClimbPicker } from '../components/ClimbPicker';
import { Segmented } from '../components/Segmented';
import type { Climber } from '../journey/kid';
import { getThemeChoice, setThemeChoice, type ThemeChoice } from '../theme';
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
    <section className="card profile-setting">
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

/**
 * Shown only when this computer's time zone differs from RESET's (after travel,
 * say), with a button to switch. Your day starts and ends in RESET's time zone.
 */
function TimeZoneNotice() {
  const { user, updateMe } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const here = browserTimeZone();

  if (!user || user.timeZone === here) return null;

  async function handleSwitch() {
    setError(null);
    setIsSaving(true);
    try {
      await updateMe({ timeZone: here }); // the page redraws and this notice goes away
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change it.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="card profile-setting">
      <p className="profile-note">
        This computer is in <strong>{here}</strong>, but RESET uses{' '}
        <strong>{user.timeZone}</strong>. Switch if you’ve moved or are
        travelling, so your days start at the right midnight.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button button-secondary"
        type="button"
        onClick={() => void handleSwitch()}
        disabled={isSaving}
      >
        {isSaving ? 'Switching…' : `Switch to ${here}`}
      </button>
    </section>
  );
}

/** "Climber": the boy or the girl on the hills. Saved on the account. */
function ClimberSetting() {
  const { user, updateMe } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  if (!user) return null;

  async function handleChange(climber: Climber) {
    setError(null);
    setIsSaving(true);
    try {
      await updateMe({ climber }); // every hill redraws with the new climber
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="card profile-setting">
      <h3>Climber</h3>
      <ClimberPicker
        value={user.climber}
        onChange={(climber) => void handleChange(climber)}
        disabled={isSaving}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** "Appearance": Automatic follows the computer; Light or Dark forces one look. */
function ThemeSetting() {
  const [choice, setChoice] = useState<ThemeChoice>(getThemeChoice);

  return (
    <section className="card profile-setting">
      <h3>Appearance</h3>
      <Segmented
        label="Appearance"
        options={[
          { value: 'auto', label: 'Automatic' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value={choice}
        onChange={(next) => {
          setChoice(next);
          setThemeChoice(next);
        }}
      />
      <p className="profile-note">
        {choice === 'auto'
          ? 'Follows your computer’s light or dark setting.'
          : 'Saved on this browser.'}
      </p>
    </section>
  );
}

/** The Profile tab: who is logged in, archived habits, and log out. */
export function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) return null; // RequireAuth only shows this page to logged-in users

  return (
    // On wide screens: you on the left, settings on the right.
    <div className="profile-page wide two-col">
      <div className="col">
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
        <TimeZoneNotice />
      </div>

      <div className="col">
        <ClimbSetting />
        <ClimberSetting />
        <ThemeSetting />
        <ChangePasswordCard />

        <p className="profile-note">
          The weather on your hills uses your location. It goes straight to
          Open-Meteo, a free weather service, and never to RESET’s server.
        </p>

        <button
          className="button button-secondary"
          type="button"
          onClick={() => void logout()}
        >
          Log out
        </button>

        {/* Last, so it's never tapped by accident. */}
        <DeleteAccountCard />
      </div>
    </div>
  );
}
