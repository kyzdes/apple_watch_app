import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { verifyAppleToken } from '../services/appleAuth';
import { verifyGoogleToken } from '../services/googleAuth';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import logger from '../utils/logger';
import { setWithExpiry } from '../config/redis';

export const registerOrLoginApple = async (req: AuthRequest, res: Response) => {
  try {
    const { identityToken, username } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        message: 'Identity token is required',
      });
    }

    // Verify Apple token
    const appleData = await verifyAppleToken(identityToken);

    // Check if user exists
    let user = await UserModel.findByProvider('apple', appleData.sub);

    if (!user) {
      // New user - require username
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username is required for new users',
          requiresUsername: true,
        });
      }

      // Validate username
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-20 characters (alphanumeric and underscore only)',
        });
      }

      // Check username availability
      const isAvailable = await UserModel.isUsernameAvailable(username);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }

      // Create new user
      user = await UserModel.create({
        email: appleData.email,
        username,
        auth_provider: 'apple',
        provider_id: appleData.sub,
      });

      logger.info('New user registered via Apple', { userId: user.id, username });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Store refresh token in Redis
    await setWithExpiry(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    // Update last seen
    await UserModel.updateLastSeen(user.id);

    return res.status(200).json({
      success: true,
      message: user ? 'Login successful' : 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Apple auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const registerOrLoginGoogle = async (req: AuthRequest, res: Response) => {
  try {
    const { idToken, username } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required',
      });
    }

    // Verify Google token
    const googleData = await verifyGoogleToken(idToken);

    // Check if user exists
    let user = await UserModel.findByProvider('google', googleData.sub);

    if (!user) {
      // New user - require username
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username is required for new users',
          requiresUsername: true,
        });
      }

      // Validate username
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-20 characters (alphanumeric and underscore only)',
        });
      }

      // Check username availability
      const isAvailable = await UserModel.isUsernameAvailable(username);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }

      // Create new user
      user = await UserModel.create({
        email: googleData.email,
        username,
        auth_provider: 'google',
        provider_id: googleData.sub,
      });

      logger.info('New user registered via Google', { userId: user.id, username });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Store refresh token in Redis
    await setWithExpiry(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    // Update last seen
    await UserModel.updateLastSeen(user.id);

    return res.status(200).json({
      success: true,
      message: user ? 'Login successful' : 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Google auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const refreshTokens = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    });

    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    });

    // Update refresh token in Redis
    await setWithExpiry(`refresh_token:${payload.userId}`, newRefreshToken, 7 * 24 * 60 * 60);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    // Remove refresh token from Redis
    const { del } = await import('../config/redis');
    await del(`refresh_token:${req.user.userId}`);

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

export const checkUsername = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    // Validate format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Invalid username format',
      });
    }

    const isAvailable = await UserModel.isUsernameAvailable(username);

    return res.status(200).json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username is taken',
    });
  } catch (error) {
    logger.error('Check username error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check username',
    });
  }
};
