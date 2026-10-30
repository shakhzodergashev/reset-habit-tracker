import { useAuth } from '../auth/auth-context';

/** The page for logged-in users. The dashboard arrives here in Milestone 8. */
export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <section className="card welcome">
      <h2>Welcome, {user?.email}</h2>
      <p>Your time zone: {user?.timeZone}</p>
      <p>Your habits dashboard is coming next.</p>
      <button
        className="button button-secondary"
        type="button"
        onClick={() => void logout()}
      >
        Log out
      </button>
    </section>
  );
}
