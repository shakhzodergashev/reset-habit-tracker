import { Navigate, Route, Routes, useLocation } from 'react-router';
import { useAuth } from './auth/auth-context';
import { RequireAuth } from './auth/RequireAuth';
import { TabLayout } from './components/TabLayout';
import { ArchivedHabitsPage } from './pages/ArchivedHabitsPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditHabitPage } from './pages/EditHabitPage';
import { HabitDetailPage } from './pages/HabitDetailPage';
import { HabitsPage } from './pages/HabitsPage';
import { InsightsPage } from './pages/InsightsPage';
import { NewHabitPage } from './pages/NewHabitPage';
import { ProfilePage } from './pages/ProfilePage';
import { WelcomePage } from './pages/WelcomePage';
import './App.css';

function App() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  // The pages with the menu (TabLayout) show the logo in their own header.
  const showHeader = !user || pathname === '/welcome';

  return (
    <main className="app">
      {showHeader && (
        <header className="app-header">
          <h1 className="app-title">
            <span className="app-logo" aria-hidden="true" />
            Reset
          </h1>
          {/* The tagline greets people on the login and sign-up pages. */}
          {!user && (
            <p className="app-tagline">
              Build better days. One habit at a time.
            </p>
          )}
        </header>
      )}

      {/* Shows the one page that matches the address in the browser. */}
      <Routes>
        {/* Pages for logged-in users only. RequireAuth guards them all. */}
        <Route element={<RequireAuth />}>
          {/* Right after registering: choose a first climb (no tab bar yet). */}
          <Route path="/welcome" element={<WelcomePage />} />
          {/* TabLayout adds the bottom tab bar: Today, Habits, Insights, Profile. */}
          <Route element={<TabLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/habits/new" element={<NewHabitPage />} />
            <Route path="/habits/archived" element={<ArchivedHabitsPage />} />
            <Route path="/habits/:id" element={<HabitDetailPage />} />
            <Route path="/habits/:id/edit" element={<EditHabitPage />} />
          </Route>
        </Route>

        {/* The old Stats address now lives in Insights. */}
        <Route path="/stats" element={<Navigate to="/insights" replace />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        {/* Any other address: go home (which sends you to /login if needed). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
