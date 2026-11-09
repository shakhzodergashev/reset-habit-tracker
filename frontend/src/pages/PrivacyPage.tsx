import { Link } from 'react-router';
import { MINIMUM_AGE, POLICIES_UPDATED, SUPPORT_EMAIL } from '../legal';
import './LegalPage.css';

/** /privacy: what RESET stores, why, and what you can ask for. Plain English. */
export function PrivacyPage() {
  const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;

  return (
    <article className="card legal">
      <h2>Privacy policy</h2>
      <p className="legal-updated">Last updated: {POLICIES_UPDATED}</p>
      <p>
        RESET is a habit tracker run by the RESET team. This page explains what
        we store about you, why, and what you can ask us to do with it. We keep
        it short and in plain words.
      </p>

      <h3>What we store</h3>
      <ul>
        <li>
          <strong>Your account:</strong> your email address and your password.
          The password is stored only as a scrambled “hash”, so nobody, not even
          us, can read it.
        </li>
        <li>
          <strong>Your settings:</strong> your time zone, your climber and your
          app colour.
        </li>
        <li>
          <strong>Your habits:</strong> their names, descriptions and emoji, and
          the days you ticked them.
        </li>
        <li>
          <strong>Your logins:</strong> when each login started and when it
          ends, so you can log out and so old logins stop working.
        </li>
      </ul>
      <p>
        We use this only to run RESET for you: to show your habits, streaks and
        progress on the website and in the iPhone app.
      </p>

      <h3>What we don’t do</h3>
      <ul>
        <li>No ads, no tracking and no analytics tools.</li>
        <li>We never sell or share your data with advertisers.</li>
        <li>We don’t store your location (see “Weather” below).</li>
      </ul>

      <h3>Weather</h3>
      <p>
        The hill shows the real weather where you are, if you allow it. Your
        device sends a rough position (about 1 km accurate) straight to{' '}
        <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>
        , a free weather service. It never goes to RESET’s server, and we never
        see it. If you don’t allow location, the hill simply shows no weather.
      </p>

      <h3>On your device</h3>
      <p>
        Your browser or iPhone keeps your login (so you stay logged in) and your
        light or dark choice. This is needed for RESET to work; it is not used
        for tracking.
      </p>

      <h3>Who else handles it</h3>
      <p>
        Your data is stored on servers rented from our hosting provider, who
        keeps it safe for us and may keep short technical logs (such as IP
        addresses) for a few days to run and protect the service. Our server
        also remembers IP addresses for about a minute to stop password
        guessing.
      </p>

      <h3>How long we keep it</h3>
      <p>
        As long as you have an account. When you delete your account (Profile →
        Delete account), everything above is deleted straight away. Backup
        copies are removed when our provider’s backups expire.
      </p>

      <h3>Your rights</h3>
      <p>
        You can see and change your data in the app, and delete your account
        there at any time. To get a copy of your data, or for any privacy
        question, email {mail}. If you live in the EU or UK, you also have the
        rights the GDPR gives you, and you can complain to your local data
        protection authority.
      </p>

      <h3>Children</h3>
      <p>
        RESET is for people aged {MINIMUM_AGE} and over. If you believe a child
        younger than that has an account, email us and we will delete it.
      </p>

      <h3>Changes</h3>
      <p>
        If we change this policy, we will update the date at the top, and tell
        you in the app if the change is important.
      </p>

      <p>
        See also the <Link to="/terms">terms of use</Link> and{' '}
        <Link to="/support">support</Link>.
      </p>
    </article>
  );
}
