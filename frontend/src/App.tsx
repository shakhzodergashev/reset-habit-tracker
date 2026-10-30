import { useState } from 'react';
import { logout, type User } from './api/auth';
import { AuthForm, type AuthMode } from './components/AuthForm';
import './App.css';

function App() {
  // Who is logged in (null = nobody), and which form to show.
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AuthMode>('login');

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">RESET</h1>
        <p className="app-tagline">Build better days. One habit at a time.</p>
      </header>

      {/* Show the welcome card when logged in, otherwise the form. */}
      {user ? (
        <section className="card welcome">
          <h2>Welcome, {user.email}</h2>
          <p>Your time zone: {user.timeZone}</p>
          <button
            className="button button-secondary"
            type="button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </section>
      ) : (
        <AuthForm
          mode={mode}
          onSuccess={setUser}
          onSwitchMode={() => setMode(mode === 'login' ? 'register' : 'login')}
        />
      )}
    </main>
  );
}

export default App;
