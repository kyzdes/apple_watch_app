import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { apiLimiter, searchLimiter } from '../middleware/rateLimiter';
import * as userController from '../controllers/userController';

const router = Router();

// Get current user profile
router.get('/profile', authenticate, apiLimiter, userController.getProfile);

// Update profile
router.put(
  '/profile',
  authenticate,
  apiLimiter,
  validate([
    body('username')
      .matches(/^[a-zA-Z0-9_]{3,20}$/)
      .withMessage('Username must be 3-20 characters (alphanumeric and underscore only)'),
  ]),
  userController.updateProfile
);

// Search users
router.get('/search', authenticate, searchLimiter, userController.searchUsers);

// Register device token
router.post(
  '/device-token',
  authenticate,
  apiLimiter,
  validate([
    body('token').notEmpty().withMessage('Token is required'),
    body('deviceType')
      .isIn(['ios', 'watch'])
      .withMessage('Device type must be ios or watch'),
  ]),
  userController.registerDeviceToken
);

// Delete account
router.delete('/profile', authenticate, apiLimiter, userController.deleteAccount);

export default router;
