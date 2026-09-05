import React, { useState, useEffect } from 'react';
import { SeminarHallState, UserSession } from './types';
import { initializeHallsIfMissing, subscribeToHall } from './services/gameService';
import { LoginPage } from './pages/LoginPage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { MaterialSnackbar, SnackbarState } from './components/MaterialSnackbar';
import { MaterialDialog } from './components/MaterialDialog';

export default function App() {
  // Session handling (persists across refresh during session)
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('techquest_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Real-time state of the user's specific seminar hall
  const [hallState, setHallState] = useState<SeminarHallState | null>(null);

  // Snackbar notifications
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  // Logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const showSnackbarMessage = (
    message: string,
    type: 'info' | 'error' | 'success' = 'info'
  ) => {
    setSnackbar({ isOpen: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => (prev.message === message ? { ...prev, isOpen: false } : prev));
    }, 4000);
  };

  // Seed default halls in Firestore if not already present
  useEffect(() => {
    initializeHallsIfMissing();
  }, []);

  // Listen to real-time updates for the logged-in user's seminar hall
  useEffect(() => {
    if (!session?.hallId) {
      setHallState(null);
      return;
    }

    const unsubscribe = subscribeToHall(session.hallId, (state) => {
      setHallState(state);
    });

    return () => unsubscribe();
  }, [session?.hallId]);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    try {
      sessionStorage.setItem('techquest_session', JSON.stringify(newSession));
    } catch (err) {
      console.warn('SessionStorage unavailable:', err);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setSession(null);
    setHallState(null);
    setShowLogoutConfirm(false);
    try {
      sessionStorage.removeItem('techquest_session');
    } catch (err) {
      console.warn('SessionStorage unavailable:', err);
    }
    showSnackbarMessage('Logged out successfully.', 'info');
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans transition-colors duration-200">
      {!session ? (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onShowSnackbar={showSnackbarMessage}
        />
      ) : (
        <div className="flex flex-col flex-1">
          <Header
            session={session}
            hallState={hallState}
            onLogout={handleLogout}
            onBack={handleLogout}
          />

          <main className="flex-1 pb-16">
            {session.role === 'admin' ? (
              <AdminDashboard
                session={session}
                hallState={hallState}
                onShowSnackbar={showSnackbarMessage}
              />
            ) : (
              <StudentDashboard
                session={session}
                hallState={hallState}
                onShowSnackbar={showSnackbarMessage}
              />
            )}
          </main>

          <Footer currentHallName={session.hallName} />
        </div>
      )}

      {/* Global Transient Material Snackbar */}
      <MaterialSnackbar
        state={snackbar}
        onClose={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Material Logout / Exit Confirmation Dialog */}
      <MaterialDialog
        isOpen={showLogoutConfirm}
        title="Exit to Login"
        message="Are you sure you want to go back to the login screen? You can log back in anytime using your ID."
        confirmLabel="Exit"
        cancelLabel="Stay"
        isDestructive={true}
        icon="arrow_back"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
