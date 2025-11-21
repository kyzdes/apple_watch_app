import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FriendshipModel } from '../models/Friendship';
import { UserModel } from '../models/User';
import logger from '../utils/logger';
import { sendPushNotification } from '../services/pushNotification';

export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: 'Friend ID is required',
      });
    }

    // Check if trying to add themselves
    if (friendId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as a friend',
      });
    }

    // Check if friend exists
    const friend = await UserModel.findById(friendId);
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if friendship already exists
    const existingStatus = await FriendshipModel.getFriendshipStatus(req.user.userId, friendId);
    if (existingStatus) {
      return res.status(400).json({
        success: false,
        message: `Friend request already ${existingStatus}`,
      });
    }

    // Send friend request
    const friendship = await FriendshipModel.sendRequest(req.user.userId, friendId);

    // Send push notification to friend
    await sendPushNotification(
      friendId,
      'New Friend Request',
      `${req.user.username} wants to be your friend`,
      {
        type: 'friend_request',
        senderId: req.user.userId,
        senderUsername: req.user.username,
      }
    );

    logger.info('Friend request sent', {
      from: req.user.userId,
      to: friendId,
    });

    return res.status(201).json({
      success: true,
      message: 'Friend request sent successfully',
      data: friendship,
    });
  } catch (error) {
    logger.error('Send friend request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send friend request',
    });
  }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
      });
    }

    const friendship = await FriendshipModel.acceptRequest(requestId);

    // Send push notification to requester
    const requester = await UserModel.findById(friendship.user_id);
    if (requester) {
      await sendPushNotification(
        requester.id,
        'Friend Request Accepted',
        `${req.user.username} accepted your friend request`,
        {
          type: 'friend_accepted',
          senderId: req.user.userId,
          senderUsername: req.user.username,
        }
      );
    }

    logger.info('Friend request accepted', {
      requestId,
      acceptedBy: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message: 'Friend request accepted',
      data: friendship,
    });
  } catch (error) {
    logger.error('Accept friend request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept friend request',
    });
  }
};

export const declineFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
      });
    }

    const friendship = await FriendshipModel.declineRequest(requestId);

    logger.info('Friend request declined', {
      requestId,
      declinedBy: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message: 'Friend request declined',
      data: friendship,
    });
  } catch (error) {
    logger.error('Decline friend request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to decline friend request',
    });
  }
};

export const removeFriend = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { friendId } = req.params;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: 'Friend ID is required',
      });
    }

    await FriendshipModel.removeFriend(req.user.userId, friendId);

    logger.info('Friend removed', {
      userId: req.user.userId,
      friendId,
    });

    return res.status(200).json({
      success: true,
      message: 'Friend removed successfully',
    });
  } catch (error) {
    logger.error('Remove friend error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove friend',
    });
  }
};

export const getFriends = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const friends = await FriendshipModel.getFriends(req.user.userId);

    return res.status(200).json({
      success: true,
      data: friends,
    });
  } catch (error) {
    logger.error('Get friends error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get friends',
    });
  }
};

export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const requests = await FriendshipModel.getPendingRequests(req.user.userId);

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    logger.error('Get pending requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get pending requests',
    });
  }
};

export const getSentRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const requests = await FriendshipModel.getSentRequests(req.user.userId);

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    logger.error('Get sent requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get sent requests',
    });
  }
};
