import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import { HomePage } from './pages/HomePage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { StandingsPage } from './pages/StandingsPage';
import { TeamsPage } from './pages/TeamsPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { PlayersPage } from './pages/PlayersPage';
import { PlayerDetailPage } from './pages/PlayerDetailPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <div className="flex flex-col min-h-screen bg-bgmi-dark text-slate-100 selection:bg-amber-500 selection:text-black">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/tournaments" element={<TournamentsPage />} />
                    <Route path="/tournaments/:slug" element={<TournamentDetailPage />} />
                    <Route path="/standings" element={<StandingsPage />} />
                    <Route path="/teams" element={<TeamsPage />} />
                    <Route path="/teams/:id" element={<TeamDetailPage />} />
                    <Route path="/players" element={<PlayersPage />} />
                    <Route path="/players/:id" element={<PlayerDetailPage />} />
                    <Route path="/announcements" element={<AnnouncementsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/organizer" element={<OrganizerDashboardPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
