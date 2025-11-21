import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import FriendsPage from './pages/FriendsPage';
import SendPage from './pages/SendPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { useStore } from './store/useStore';
import { authService } from './services/auth.service';
import { websocketService } from './services/websocket.service';
import VibrationModal from './components/VibrationModal';

function App() {
  const { setAuthenticated, setUser, isAuthenticated } = useStore();

  useEffect(() => {
    // Check authentication on mount
    if (authService.isAuthenticated()) {
      setAuthenticated(true);
      // Load user profile
      authService.getProfile()
        .then(user => {
          setUser(user);
          // Connect WebSocket
          websocketService.connect();
        })
        .catch(() => {
          setAuthenticated(false);
        });
    }
  }, [setAuthenticated, setUser]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/"
            element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}
          >
            <Route index element={<Navigate to="/friends" replace />} />
            <Route path="friends" element={<FriendsPage />} />
            <Route path="send" element={<SendPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>

        {/* Vibration Modal */}
        <VibrationModal />

        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
