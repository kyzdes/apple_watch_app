import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User, Wifi, WifiOff, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { authService } from '../services/auth.service';
import { websocketService } from '../services/websocket.service';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isConnected, setAuthenticated, setUser } = useStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      websocketService.disconnect();
      setAuthenticated(false);
      setUser(null);
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <User size={20} className="text-gray-600" />
            <h3 className="font-semibold text-lg">Profile</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            {isConnected ? (
              <Wifi size={20} className="text-green-600" />
            ) : (
              <WifiOff size={20} className="text-red-600" />
            )}
            <h3 className="font-semibold text-lg">Connection Status</h3>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">WebSocket</span>
            <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Info size={20} className="text-gray-600" />
            <h3 className="font-semibold text-lg">About</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform</span>
              <span className="font-medium">Web</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Build</span>
              <span className="font-medium">React + TypeScript</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t space-y-2">
            <a
              href="https://hapticfriends.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:text-blue-700"
            >
              Privacy Policy
            </a>
            <a
              href="https://hapticfriends.app/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:text-blue-700"
            >
              Terms of Service
            </a>
          </div>
        </div>

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </motion.button>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Made with ❤️ by Haptic Friends Team
        </p>
      </div>
    </div>
  );
}
