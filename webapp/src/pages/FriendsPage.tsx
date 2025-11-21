import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Check, X, Loader2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { friendsService } from '../services/friends.service';
import { Friend, FriendRequest, User } from '../types';

export default function FriendsPage() {
  const { friends, setFriends } = useStore();
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendsService.getFriends(),
        friendsService.getPendingRequests(),
      ]);
      setFriends(friendsData);
      setPendingRequests(requestsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await friendsService.searchUsers(query);
      setSearchResults(results);
    } catch (error: any) {
      toast.error(error.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers(searchQuery);
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      await friendsService.sendFriendRequest(userId);
      toast.success('Friend request sent!');
      setSearchResults(searchResults.filter(u => u.id !== userId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await friendsService.acceptFriendRequest(requestId);
      toast.success('Friend request accepted!');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept request');
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      await friendsService.declineFriendRequest(requestId);
      toast.success('Friend request declined');
      setPendingRequests(pendingRequests.filter(r => r.request_id !== requestId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline request');
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends</h1>
          <p className="text-gray-600">Manage your connections</p>
        </div>

        {/* Add Friend Button */}
        <button
          onClick={() => setShowAddFriend(!showAddFriend)}
          className="mb-6 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <UserPlus size={20} />
          <span>Add Friend</span>
        </button>

        {/* Search Section */}
        <AnimatePresence>
          {showAddFriend && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Search Users</h3>
                <form onSubmit={handleSearch} className="flex space-x-2 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by username..."
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
                  </button>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Friend Requests</h3>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <motion.div
                  key={request.request_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl shadow p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{request.username}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => acceptRequest(request.request_id)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => declineRequest(request.request_id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h3 className="font-semibold text-lg mb-3">
            My Friends ({friends.length})
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500">No friends yet. Add some!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  const isOnline = friend.last_seen &&
    new Date(friend.last_seen) > new Date(Date.now() - 5 * 60 * 1000);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-lg p-5 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {friend.username[0].toUpperCase()}
              </span>
            </div>
            <Circle
              className={`absolute -bottom-1 -right-1 ${
                isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
              }`}
              size={16}
            />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{friend.username}</h4>
            <p className="text-sm text-gray-500">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {friend.has_watch && (
          <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span>Watch</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
