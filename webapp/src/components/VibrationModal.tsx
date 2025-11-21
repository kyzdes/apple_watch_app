import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { websocketService } from '../services/websocket.service';
import { useVibration } from '../hooks/useVibration';
import { IncomingVibration } from '../types';

export default function VibrationModal() {
  const { currentVibration, setCurrentVibration, incrementUnreadCount } = useStore();
  const { vibrate } = useVibration();

  useEffect(() => {
    const handleVibrationReceived = (vibration: IncomingVibration) => {
      setCurrentVibration(vibration);
      incrementUnreadCount();

      // Play vibration
      vibrate([200, 100, 200]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setCurrentVibration(null);
      }, 5000);
    };

    websocketService.on('vibration_received', handleVibrationReceived);

    return () => {
      websocketService.off('vibration_received', handleVibrationReceived);
    };
  }, [setCurrentVibration, incrementUnreadCount, vibrate]);

  return (
    <AnimatePresence>
      {currentVibration && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setCurrentVibration(null)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setCurrentVibration(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Emoji */}
                {currentVibration.emoji && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="text-8xl mb-6"
                  >
                    {currentVibration.emoji}
                  </motion.div>
                )}

                {/* Vibration Icon (if no emoji) */}
                {!currentVibration.emoji && (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    className="text-6xl mb-6"
                  >
                    📳
                  </motion.div>
                )}

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Vibration from
                </h2>

                {/* Sender Name */}
                <p className="text-3xl font-bold gradient-text mb-4">
                  {currentVibration.senderUsername}
                </p>

                {/* Pattern Name */}
                <p className="text-gray-600 mb-6 capitalize">
                  {currentVibration.patternName?.replace(/_/g, ' ')}
                </p>

                {/* Timestamp */}
                <p className="text-sm text-gray-500">
                  {new Date(currentVibration.timestamp).toLocaleTimeString()}
                </p>

                {/* Dismiss Button */}
                <motion.button
                  onClick={() => setCurrentVibration(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg"
                >
                  Got it!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
