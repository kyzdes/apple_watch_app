import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { apiLimiter, vibrationLimiter } from '../middleware/rateLimiter';
import * as vibrationController from '../controllers/vibrationController';

const router = Router();

// Get preset patterns
router.get('/patterns/presets', authenticate, apiLimiter, vibrationController.getPresetPatterns);

// Get user custom patterns
router.get('/patterns/custom', authenticate, apiLimiter, vibrationController.getUserCustomPatterns);

// Create custom pattern
router.post(
  '/patterns/custom',
  authenticate,
  apiLimiter,
  validate([
    body('name').notEmpty().withMessage('Pattern name is required'),
    body('pattern').notEmpty().withMessage('Pattern is required'),
    body('pattern.intervals').isArray().withMessage('Pattern intervals must be an array'),
    body('pattern.intensities').isArray().withMessage('Pattern intensities must be an array'),
  ]),
  vibrationController.createCustomPattern
);

// Delete custom pattern
router.delete(
  '/patterns/custom/:patternId',
  authenticate,
  apiLimiter,
  validate([
    param('patternId').notEmpty().withMessage('Pattern ID is required'),
  ]),
  vibrationController.deleteCustomPattern
);

// Send vibration
router.post(
  '/send',
  authenticate,
  vibrationLimiter,
  validate([
    body('receiverId').notEmpty().withMessage('Receiver ID is required'),
    body('vibrationType').notEmpty().withMessage('Vibration type is required'),
    body('emoji').optional().isString().withMessage('Emoji must be a string'),
  ]),
  vibrationController.sendVibration
);

// Get sent history
router.get('/history/sent', authenticate, apiLimiter, vibrationController.getSentHistory);

// Get received history
router.get('/history/received', authenticate, apiLimiter, vibrationController.getReceivedHistory);

// Get unread count
router.get('/unread-count', authenticate, apiLimiter, vibrationController.getUnreadCount);

// Mark as read
router.put(
  '/:vibrationId/read',
  authenticate,
  apiLimiter,
  validate([
    param('vibrationId').notEmpty().withMessage('Vibration ID is required'),
  ]),
  vibrationController.markAsRead
);

export default router;
