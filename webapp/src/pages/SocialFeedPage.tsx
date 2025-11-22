import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';

interface FeedPost {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  post_type: 'shared_pattern' | 'achievement' | 'story' | 'challenge_completed';
  pattern_name?: string;
  achievement_name?: string;
  achievement_icon?: string;
  caption?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  is_liked?: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  comment_text: string;
  created_at: string;
}

const SocialFeedPage: React.FC = () => {
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      // Mock data for demonstration
      const mockFeed: FeedPost[] = [
        {
          id: '1',
          user_id: 'user1',
          username: 'Sarah_M',
          avatar_url: 'https://i.pravatar.cc/150?img=1',
          post_type: 'shared_pattern',
          pattern_name: 'Sunset Vibes',
          caption: 'Just created this amazing pattern! Feel the warmth 🌅',
          like_count: 42,
          comment_count: 8,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          user_id: 'user2',
          username: 'Alex_K',
          avatar_url: 'https://i.pravatar.cc/150?img=2',
          post_type: 'achievement',
          achievement_name: 'Century Club',
          achievement_icon: 'fire',
          caption: '100 vibrations sent! 🎉',
          like_count: 67,
          comment_count: 12,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          user_id: 'user3',
          username: 'Mike_R',
          avatar_url: 'https://i.pravatar.cc/150?img=3',
          post_type: 'story',
          caption: 'Check out my new haptic story "Morning Routine" ☀️',
          like_count: 38,
          comment_count: 5,
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          user_id: 'user4',
          username: 'Emma_L',
          avatar_url: 'https://i.pravatar.cc/150?img=4',
          post_type: 'challenge_completed',
          caption: 'Completed today\'s challenge! Who else? 🎯',
          like_count: 89,
          comment_count: 23,
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setFeed(mockFeed);
      setLoading(false);
    } catch (error) {
      console.error('Error loading feed:', error);
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const likePost = async (postId: string) => {
    setFeed(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              like_count: post.is_liked ? post.like_count - 1 : post.like_count + 1,
              is_liked: !post.is_liked,
            }
          : post
      )
    );
  };

  const openComments = async (postId: string) => {
    setSelectedPost(postId);
    // Mock comments
    setComments([
      {
        id: '1',
        user_id: 'user5',
        username: 'John_D',
        avatar_url: 'https://i.pravatar.cc/150?img=5',
        comment_text: 'This is amazing! 🔥',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        user_id: 'user6',
        username: 'Lisa_W',
        avatar_url: 'https://i.pravatar.cc/150?img=6',
        comment_text: 'How did you create this?',
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user_id: 'current_user',
      username: 'You',
      avatar_url: 'https://i.pravatar.cc/150?img=10',
      comment_text: newComment,
      created_at: new Date().toISOString(),
    };

    setComments([...comments, comment]);
    setNewComment('');

    // Update comment count
    setFeed(prev =>
      prev.map(post =>
        post.id === selectedPost
          ? { ...post, comment_count: post.comment_count + 1 }
          : post
      )
    );
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'shared_pattern':
        return '🎨';
      case 'achievement':
        return '🏆';
      case 'story':
        return '📖';
      case 'challenge_completed':
        return '🎯';
      default:
        return '📱';
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              🌟 Social Feed
            </h1>
            <p className="text-gray-300">
              See what your friends are creating and achieving
            </p>
          </motion.div>

          {/* Feed */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
              <p className="text-white mt-4">Loading feed...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {feed.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
                  >
                    {/* Post Header */}
                    <div className="p-4 flex items-center gap-3">
                      <img
                        src={post.avatar_url}
                        alt={post.username}
                        className="w-12 h-12 rounded-full border-2 border-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{post.username}</h3>
                          <span className="text-2xl">{getPostIcon(post.post_type)}</span>
                        </div>
                        <p className="text-gray-400 text-sm">{formatTimeAgo(post.created_at)}</p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="px-4 pb-4">
                      {post.post_type === 'achievement' && (
                        <motion.div
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 mb-3 text-center"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="text-4xl mb-2">{post.achievement_icon}</div>
                          <div className="text-white font-bold text-xl">{post.achievement_name}</div>
                          <div className="text-yellow-100 text-sm mt-1">Achievement Unlocked!</div>
                        </motion.div>
                      )}

                      {post.post_type === 'shared_pattern' && (
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-bold text-lg">{post.pattern_name}</div>
                              <div className="text-purple-100 text-sm">Custom Haptic Pattern</div>
                            </div>
                            <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                              Try It
                            </button>
                          </div>
                        </div>
                      )}

                      {post.caption && (
                        <p className="text-white mb-3">{post.caption}</p>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t border-gray-700">
                        <button
                          onClick={() => likePost(post.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            post.is_liked
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <span>{post.is_liked ? '❤️' : '🤍'}</span>
                          <span>{post.like_count}</span>
                        </button>

                        <button
                          onClick={() => openComments(post.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        >
                          <span>💬</span>
                          <span>{post.comment_count}</span>
                        </button>

                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors ml-auto">
                          <span>🔗</span>
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Trending Patterns Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-gray-800 rounded-xl shadow-2xl p-6"
          >
            <h3 className="text-2xl font-bold text-white mb-4">🔥 Trending Patterns</h3>
            <div className="space-y-3">
              {['Heartbeat Symphony', 'Ocean Waves', 'Thunder Storm', 'Morning Sunshine'].map(
                (pattern, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-white font-semibold">{pattern}</div>
                      <div className="text-gray-400 text-sm">{Math.floor(Math.random() * 500 + 100)} uses</div>
                    </div>
                    <div className="text-2xl">⭐</div>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </div>

        {/* Comments Modal */}
        <AnimatePresence>
          {selectedPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedPost(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Comments</h3>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="p-4 max-h-96 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 mb-4">
                      <img
                        src={comment.avatar_url}
                        alt={comment.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-700 rounded-lg p-3">
                          <div className="text-white font-semibold text-sm">{comment.username}</div>
                          <div className="text-gray-300 text-sm">{comment.comment_text}</div>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {formatTimeAgo(comment.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addComment()}
                      placeholder="Write a comment..."
                      className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <button
                      onClick={addComment}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default SocialFeedPage;
