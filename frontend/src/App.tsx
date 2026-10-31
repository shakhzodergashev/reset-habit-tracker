import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { TabLayout } from './components/TabLayout';
import { ArchivedHabitsPage } from './pages/ArchivedHabitsPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditHabitPage } from './pages/EditHabitPage';
import { NewHabitPage } from './pages/NewHabitPage';
import { ProfilePage } from './pages/ProfilePage';
import { StatsPage } from './pages/StatsPage';
import './App.css';

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">RESET</h1>
        <p className="app-tagline">Build better days. One habit at a time.</p>
      </header>

      {/* Shows the one page that matches the address in the browser. */}
      <Routes>
        {/* Pages for logged-in users only. RequireAuth guards them all. */}
        <Route element={<RequireAuth />}>
          {/* TabLayout adds the bottom tab bar: Today, Stats, Profile. */}
          <Route element={<TabLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/habits/new" element={<NewHabitPage />} />
            <Route path="/habits/archived" element={<ArchivedHabitsPage />} />
            <Route path="/habits/:id/edit" element={<EditHabitPage />} />
          </Route>
        </Route>

        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        {/* Any other address: go home (which sends you to /login if needed). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
