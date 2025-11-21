import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { friendsService } from '../services/friends.service';
import { vibrationsService } from '../services/vibrations.service';
import { websocketService } from '../services/websocket.service';
import { useVibration } from '../hooks/useVibration';
import { Friend, VibrationPattern } from '../types';

const EMOJIS = ['❤️', '👋', '👍', '😄', '🔥', '⭐', '🎉', '💯', '✨', '🌟', '💜', '😍'];

export default function SendPage() {
  const { friends, setFriends, presetPatterns, setPresetPatterns } = useStore();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<VibrationPattern | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { vibratePattern } = useVibration();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsData, patternsData] = await Promise.all([
        friendsService.getFriends(),
        vibrationsService.getPresetPatterns(),
      ]);
      setFriends(friendsData);
      setPresetPatterns(patternsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    }
  };

  const handleSend = async () => {
    if (!selectedFriend || !selectedPattern) {
      toast.error('Please select a friend and pattern');
      return;
    }

    setIsSending(true);
    try {
      const result = await vibrationsService.sendVibration(
        selectedFriend.id,
        selectedPattern.name,
        selectedPattern.id,
        undefined,
        selectedEmoji || undefined
      );

      // Send via WebSocket
      websocketService.sendVibration({
        vibrationId: result.id,
        receiverId: selectedFriend.id,
        vibrationType: selectedPattern.name,
        emoji: selectedEmoji || undefined,
        patternName: selectedPattern.name,
      });

      // Play haptic preview
      vibratePattern(selectedPattern.pattern.intervals, selectedPattern.pattern.intensities);

      toast.success(`Vibration sent to ${selectedFriend.username}!`);
      setSelectedEmoji('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send vibration');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Vibration</h1>
          <p className="text-gray-600">Choose a friend and pattern</p>
        </div>

        {/* Select Friend */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">Send To</h3>
          {friends.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <p className="text-gray-500">No friends available. Add some friends first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {friends.map((friend) => (
                <motion.button
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative p-4 rounded-xl transition-all ${
                    selectedFriend?.id === friend.id
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white hover:shadow-lg'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedFriend?.id === friend.id
                          ? 'bg-white/20'
                          : 'bg-gradient-to-br from-blue-400 to-purple-500'
                      }`}>
                        <span className={`font-bold ${
                          selectedFriend?.id === friend.id ? 'text-white' : 'text-white'
                        }`}>
                          {friend.username[0].toUpperCase()}
                        </span>
                      </div>
                      {friend.has_watch && (
                        <Circle
                          className="absolute -bottom-1 -right-1 fill-green-500 text-green-500"
                          size={12}
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium truncate w-full text-center">
                      {friend.username}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Select Pattern */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">Vibration Pattern</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presetPatterns.map((pattern) => (
              <motion.button
                key={pattern.id}
                onClick={() => {
                  setSelectedPattern(pattern);
                  vibratePattern(pattern.pattern.intervals, pattern.pattern.intensities);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-5 rounded-xl text-left transition-all ${
                  selectedPattern?.id === pattern.id
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white hover:shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`text-2xl ${
                    selectedPattern?.id === pattern.id ? 'animate-wiggle' : ''
                  }`}>
                    📳
                  </div>
                  <div>
                    <h4 className="font-semibold capitalize">
                      {pattern.name.replace(/_/g, ' ')}
                    </h4>
                    {pattern.description && (
                      <p className={`text-sm ${
                        selectedPattern?.id === pattern.id ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {pattern.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Select Emoji */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">Add Emoji (Optional)</h3>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`aspect-square rounded-xl flex items-center justify-center text-3xl transition-all ${
                  selectedEmoji === emoji
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
                    : 'bg-white hover:shadow-lg'
                }`}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <motion.button
          onClick={handleSend}
          disabled={!selectedFriend || !selectedPattern || isSending}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSending ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send size={24} />
              <span>Send Vibration</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
