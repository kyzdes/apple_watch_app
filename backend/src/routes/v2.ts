import express from 'express';
import { authenticate } from '../middleware/auth';

// Group Controllers
import {
  createGroup,
  getGroups,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  deleteGroup,
  sendGroupVibration,
  getGroupVibrationHistory
} from '../controllers/groupController';

// Profile Controllers
import {
  getUserProfile,
  updateProfile,
  getUserAnalytics
} from '../controllers/profileController';

// Achievement Controllers
import {
  getAchievements,
  getLeaderboard
} from '../controllers/achievementController';

// Story Controllers
import {
  createStory,
  getUserStories,
  getStoryDetails,
  getStoriesFeed,
  deleteStory
} from '../controllers/storyController';

// Scheduled Vibration Controllers
import {
  createScheduledVibration,
  getScheduledVibrations,
  updateScheduledVibration,
  deleteScheduledVibration
} from '../controllers/scheduledController';

// Social Feed Controllers
import {
  getSocialFeed,
  createFeedPost,
  likePost,
  unlikePost,
  commentOnPost,
  getPostComments,
  deleteFeedPost,
  getTrendingPatterns
} from '../controllers/feedController';

const router = express.Router();

// =============================================
// GROUP ROUTES
// =============================================
router.post('/groups', authenticate, createGroup);
router.get('/groups', authenticate, getGroups);
router.put('/groups/:groupId', authenticate, updateGroup);
router.post('/groups/:groupId/members', authenticate, addGroupMembers);
router.delete('/groups/:groupId/members/:memberId', authenticate, removeGroupMember);
router.delete('/groups/:groupId', authenticate, deleteGroup);
router.post('/groups/vibrations/send', authenticate, sendGroupVibration);
router.get('/groups/:groupId/vibrations/history', authenticate, getGroupVibrationHistory);

// =============================================
// PROFILE ROUTES
// =============================================
router.get('/profiles/:username', authenticate, getUserProfile);
router.put('/profiles/me', authenticate, updateProfile);
router.get('/profiles/me/analytics', authenticate, getUserAnalytics);

// =============================================
// ACHIEVEMENT ROUTES
// =============================================
router.get('/achievements', authenticate, getAchievements);
router.get('/leaderboard', authenticate, getLeaderboard);

// =============================================
// STORY ROUTES
// =============================================
router.post('/stories', authenticate, createStory);
router.get('/stories/feed', authenticate, getStoriesFeed);
router.get('/stories/:storyId', authenticate, getStoryDetails);
router.get('/stories/user/:username', authenticate, getUserStories);
router.delete('/stories/:storyId', authenticate, deleteStory);

// =============================================
// SCHEDULED VIBRATION ROUTES
// =============================================
router.post('/scheduled-vibrations', authenticate, createScheduledVibration);
router.get('/scheduled-vibrations', authenticate, getScheduledVibrations);
router.put('/scheduled-vibrations/:scheduledId', authenticate, updateScheduledVibration);
router.delete('/scheduled-vibrations/:scheduledId', authenticate, deleteScheduledVibration);

// =============================================
// SOCIAL FEED ROUTES
// =============================================
router.get('/feed', authenticate, getSocialFeed);
router.post('/feed/posts', authenticate, createFeedPost);
router.post('/feed/posts/:postId/like', authenticate, likePost);
router.delete('/feed/posts/:postId/like', authenticate, unlikePost);
router.post('/feed/posts/:postId/comments', authenticate, commentOnPost);
router.get('/feed/posts/:postId/comments', authenticate, getPostComments);
router.delete('/feed/posts/:postId', authenticate, deleteFeedPost);
router.get('/feed/trending', getTrendingPatterns);

export default router;
