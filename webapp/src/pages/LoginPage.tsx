import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wand2, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { authService } from '../services/auth.service';
import { websocketService } from '../services/websocket.service';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setAuthenticated } = useStore();
  const [username, setUsername] = useState('');
  const [showUsername, setShowUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const handleDemoLogin = async () => {
    // For demo purposes - create a quick login
    if (showUsername) {
      if (!username || username.length < 3) {
        toast.error('Username must be at least 3 characters');
        return;
      }

      setIsLoading(true);
      try {
        // Simulate demo login - in production, you'd integrate with real OAuth
        const demoToken = btoa(JSON.stringify({ username, timestamp: Date.now() }));

        localStorage.setItem('access_token', demoToken);
        localStorage.setItem('refresh_token', demoToken);
        localStorage.setItem('username', username);
        localStorage.setItem('user_id', `demo-${Date.now()}`);

        const user = {
          id: `demo-${Date.now()}`,
          email: `${username}@demo.hapticfriends.app`,
          username: username,
        };

        setUser(user);
        setAuthenticated(true);

        // Connect WebSocket
        websocketService.connect();

        toast.success('Welcome to Haptic Friends!');
        navigate('/friends');
      } catch (error: any) {
        toast.error(error.message || 'Login failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowUsername(true);
    }
  };

  const checkUsername = async (value: string) => {
    if (value.length < 3 || value.length > 20) {
      setUsernameAvailable(null);
      return;
    }

    const regex = /^[a-zA-Z0-9_]+$/;
    if (!regex.test(value)) {
      setUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const available = await authService.checkUsername(value);
      setUsernameAvailable(available);
    } catch (error) {
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full z-10"
      >
        <div className="glass rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Wand2 size={40} className="text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Haptic Friends
            </h1>
            <p className="text-gray-600">
              Send vibrations to your friends in real-time
            </p>
          </div>

          {/* Username Input (if shown) */}
          {showUsername && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose your username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUsername(value);
                    if (value.length >= 3) {
                      checkUsername(value);
                    } else {
                      setUsernameAvailable(null);
                    }
                  }}
                  placeholder="username"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                  maxLength={20}
                />
                {isCheckingUsername && (
                  <Loader2 className="absolute right-3 top-3 animate-spin text-gray-400" size={20} />
                )}
                {!isCheckingUsername && usernameAvailable !== null && (
                  <div className={`absolute right-3 top-3 w-5 h-5 rounded-full ${
                    usernameAvailable ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                3-20 characters (letters, numbers, underscore)
              </p>
            </motion.div>
          )}

          {/* Login Button */}
          <motion.button
            onClick={handleDemoLogin}
            disabled={isLoading || (showUsername && (!username || usernameAvailable === false))}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>{showUsername ? 'Get Started' : 'Start Demo'}</span>
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {showUsername ? 'Create your account to continue' : 'Quick demo - no OAuth required'}
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 space-y-3">
            {[
              'Real-time vibration delivery',
              'Send emojis with haptic feedback',
              'Friend management system',
              'Works on mobile & desktop',
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-2 text-sm text-gray-600"
              >
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Made with ❤️ using React, TypeScript & Tailwind CSS
        </p>
      </motion.div>
    </div>
  );
}
