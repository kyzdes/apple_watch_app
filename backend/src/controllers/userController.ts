import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { pool } from '../config/database';
import logger from '../utils/logger';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        last_seen: user.last_seen,
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get profile',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-20 characters (alphanumeric and underscore only)',
      });
    }

    // Check if username is already taken (by another user)
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser && existingUser.id !== req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken',
      });
    }

    const updatedUser = await UserModel.updateUsername(req.user.userId, username);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const users = await UserModel.searchUsers(q, 20);

    // Filter out the current user
    const filteredUsers = users
      .filter(user => user.id !== req.user!.userId)
      .map(user => ({
        id: user.id,
        username: user.username,
        last_seen: user.last_seen,
      }));

    return res.status(200).json({
      success: true,
      data: filteredUsers,
    });
  } catch (error) {
    logger.error('Search users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search users',
    });
  }
};

export const registerDeviceToken = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { token, deviceType } = req.body;

    if (!token || !deviceType) {
      return res.status(400).json({
        success: false,
        message: 'Token and device type are required',
      });
    }

    if (!['ios', 'watch'].includes(deviceType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device type',
      });
    }

    const query = `
      INSERT INTO device_tokens (user_id, device_type, token)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, device_type, token)
      DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    await pool.query(query, [req.user.userId, deviceType, token]);

    return res.status(200).json({
      success: true,
      message: 'Device token registered successfully',
    });
  } catch (error) {
    logger.error('Register device token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register device token',
    });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    await UserModel.delete(req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
};
