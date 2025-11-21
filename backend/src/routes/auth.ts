import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Register/Login with Apple
router.post(
  '/apple',
  authLimiter,
  validate([
    body('identityToken').notEmpty().withMessage('Identity token is required'),
    body('username')
      .optional()
      .matches(/^[a-zA-Z0-9_]{3,20}$/)
      .withMessage('Username must be 3-20 characters (alphanumeric and underscore only)'),
  ]),
  authController.registerOrLoginApple
);

// Register/Login with Google
router.post(
  '/google',
  authLimiter,
  validate([
    body('idToken').notEmpty().withMessage('ID token is required'),
    body('username')
      .optional()
      .matches(/^[a-zA-Z0-9_]{3,20}$/)
      .withMessage('Username must be 3-20 characters (alphanumeric and underscore only)'),
  ]),
  authController.registerOrLoginGoogle
);

// Refresh tokens
router.post(
  '/refresh',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  authController.refreshTokens
);

// Logout
router.post('/logout', authenticate, authController.logout);

// Check username availability
router.get('/username/:username', authController.checkUsername);

export default router;
