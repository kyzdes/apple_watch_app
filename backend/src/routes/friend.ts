import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as friendController from '../controllers/friendController';

const router = Router();

// Get friends list
router.get('/', authenticate, apiLimiter, friendController.getFriends);

// Get pending friend requests
router.get('/requests/pending', authenticate, apiLimiter, friendController.getPendingRequests);

// Get sent friend requests
router.get('/requests/sent', authenticate, apiLimiter, friendController.getSentRequests);

// Send friend request
router.post(
  '/request',
  authenticate,
  apiLimiter,
  validate([
    body('friendId').notEmpty().withMessage('Friend ID is required'),
  ]),
  friendController.sendFriendRequest
);

// Accept friend request
router.put(
  '/request/:requestId/accept',
  authenticate,
  apiLimiter,
  validate([
    param('requestId').notEmpty().withMessage('Request ID is required'),
  ]),
  friendController.acceptFriendRequest
);

// Decline friend request
router.put(
  '/request/:requestId/decline',
  authenticate,
  apiLimiter,
  validate([
    param('requestId').notEmpty().withMessage('Request ID is required'),
  ]),
  friendController.declineFriendRequest
);

// Remove friend
router.delete(
  '/:friendId',
  authenticate,
  apiLimiter,
  validate([
    param('friendId').notEmpty().withMessage('Friend ID is required'),
  ]),
  friendController.removeFriend
);

export default router;
