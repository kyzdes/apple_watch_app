import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { VibrationModel } from '../models/Vibration';
import { FriendshipModel } from '../models/Friendship';
import { UserModel } from '../models/User';
import { isValidVibrationPattern } from '../middleware/validation';
import logger from '../utils/logger';
import { sendVibrationNotification } from '../services/pushNotification';

export const getPresetPatterns = async (req: AuthRequest, res: Response) => {
  try {
    const patterns = await VibrationModel.getPresetPatterns();

    return res.status(200).json({
      success: true,
      data: patterns,
    });
  } catch (error) {
    logger.error('Get preset patterns error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get preset patterns',
    });
  }
};

export const createCustomPattern = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { name, pattern } = req.body;

    if (!name || !pattern) {
      return res.status(400).json({
        success: false,
        message: 'Name and pattern are required',
      });
    }

    // Validate pattern
    if (!isValidVibrationPattern(pattern)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vibration pattern format',
      });
    }

    // Check if user already has 5 custom patterns
    const existingPatterns = await VibrationModel.getUserCustomPatterns(req.user.userId);
    if (existingPatterns.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 custom patterns allowed',
      });
    }

    const customPattern = await VibrationModel.createCustomPattern(req.user.userId, name, pattern);

    logger.info('Custom pattern created', {
      userId: req.user.userId,
      patternId: customPattern.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Custom pattern created successfully',
      data: customPattern,
    });
  } catch (error) {
    logger.error('Create custom pattern error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create custom pattern',
    });
  }
};

export const getUserCustomPatterns = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const patterns = await VibrationModel.getUserCustomPatterns(req.user.userId);

    return res.status(200).json({
      success: true,
      data: patterns,
    });
  } catch (error) {
    logger.error('Get custom patterns error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get custom patterns',
    });
  }
};

export const deleteCustomPattern = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { patternId } = req.params;

    if (!patternId) {
      return res.status(400).json({
        success: false,
        message: 'Pattern ID is required',
      });
    }

    await VibrationModel.deleteCustomPattern(patternId, req.user.userId);

    logger.info('Custom pattern deleted', {
      userId: req.user.userId,
      patternId,
    });

    return res.status(200).json({
      success: true,
      message: 'Custom pattern deleted successfully',
    });
  } catch (error) {
    logger.error('Delete custom pattern error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete custom pattern',
    });
  }
};

export const sendVibration = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { receiverId, vibrationType, patternId, customPatternId, emoji } = req.body;

    if (!receiverId || !vibrationType) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and vibration type are required',
      });
    }

    // Check if users are friends
    const areFriends = await FriendshipModel.areFriends(req.user.userId, receiverId);
    if (!areFriends) {
      return res.status(403).json({
        success: false,
        message: 'Can only send vibrations to friends',
      });
    }

    // Get receiver info
    const receiver = await UserModel.findById(receiverId);
    if (!receiver || !receiver.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found',
      });
    }

    // Create vibration history entry
    const vibration = await VibrationModel.sendVibration(
      req.user.userId,
      receiverId,
      vibrationType,
      patternId,
      customPatternId,
      emoji
    );

    // Get pattern info for notification
    let patternName = vibrationType;
    if (patternId) {
      const pattern = await VibrationModel.getPatternById(patternId);
      patternName = pattern?.name || vibrationType;
    }

    // Send push notification
    await sendVibrationNotification(
      receiverId,
      vibration.id,
      req.user.userId,
      req.user.username,
      emoji,
      patternName
    );

    logger.info('Vibration sent', {
      vibrationId: vibration.id,
      from: req.user.userId,
      to: receiverId,
      type: vibrationType,
    });

    return res.status(201).json({
      success: true,
      message: 'Vibration sent successfully',
      data: vibration,
    });
  } catch (error) {
    logger.error('Send vibration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send vibration',
    });
  }
};

export const getSentHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await VibrationModel.getSentHistory(req.user.userId, limit);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Get sent history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get sent history',
    });
  }
};

export const getReceivedHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await VibrationModel.getReceivedHistory(req.user.userId, limit);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Get received history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get received history',
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { vibrationId } = req.params;

    if (!vibrationId) {
      return res.status(400).json({
        success: false,
        message: 'Vibration ID is required',
      });
    }

    await VibrationModel.markAsRead(vibrationId);

    return res.status(200).json({
      success: true,
      message: 'Marked as read',
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
    });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const count = await VibrationModel.getUnreadCount(req.user.userId);

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
    });
  }
};
