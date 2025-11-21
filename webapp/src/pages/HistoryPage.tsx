import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { vibrationsService } from '../services/vibrations.service';

export default function HistoryPage() {
  const { sentHistory, setSentHistory, receivedHistory, setReceivedHistory, unreadCount, setUnreadCount } = useStore();
  const [selectedTab, setSelectedTab] = useState<'received' | 'sent'>('received');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const [received, sent, count] = await Promise.all([
        vibrationsService.getReceivedHistory(),
        vibrationsService.getSentHistory(),
        vibrationsService.getUnreadCount(),
      ]);
      setReceivedHistory(received);
      setSentHistory(sent);
      setUnreadCount(count);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await vibrationsService.markAsRead(id);
      setUnreadCount(Math.max(0, unreadCount - 1));
      setReceivedHistory(
        receivedHistory.map((v) =>
          v.id === id ? { ...v, read_at: new Date().toISOString() } : v
        )
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as read');
    }
  };

  const history = selectedTab === 'received' ? receivedHistory : sentHistory;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">History</h1>
          <p className="text-gray-600">View your vibration history</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 bg-white rounded-xl p-1 shadow">
          <button
            onClick={() => setSelectedTab('received')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'received'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Received {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setSelectedTab('sent')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'sent'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sent
          </button>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Clock className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500">No {selectedTab} vibrations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (selectedTab === 'received' && !item.read_at) {
                    markAsRead(item.id);
                  }
                }}
                className={`bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-lg transition-all ${
                  selectedTab === 'received' && !item.read_at ? 'border-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Emoji or Icon */}
                  <div className="flex-shrink-0">
                    {item.emoji ? (
                      <div className="text-4xl">{item.emoji}</div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">📳</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {selectedTab === 'received' ? item.sender_username : item.receiver_username}
                      </h4>
                      {item.delivered_at && (
                        <CheckCircle className="text-green-500" size={16} />
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2 capitalize">
                      {item.pattern_name?.replace(/_/g, ' ') || item.vibration_type}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(item.sent_at).toLocaleString()}
                      </span>
                      {selectedTab === 'received' && !item.read_at && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
