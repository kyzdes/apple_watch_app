import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import logger from '../utils/logger';
import { UserModel } from '../models/User';
import { VibrationModel } from '../models/Vibration';
import { setAdd, setRemove, setMembers } from '../config/redis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

let io: Server | null = null;

export const initializeWebSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000'),
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '5000'),
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.username = payload.username;

      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const username = socket.username!;

    logger.info('WebSocket client connected', { userId, username, socketId: socket.id });

    // Add user to online users set in Redis
    await setAdd('online_users', userId);
    await UserModel.updateLastSeen(userId);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Notify friends that user is online
    const friends = await getFriendIds(userId);
    friends.forEach(friendId => {
      io?.to(`user:${friendId}`).emit('friend_online', {
        userId,
        username,
      });
    });

    // Handle vibration events
    socket.on('vibration_sent', async (data) => {
      try {
        logger.info('Vibration sent via WebSocket', {
          from: userId,
          to: data.receiverId,
          type: data.vibrationType,
        });

        // Deliver vibration to receiver in real-time
        io?.to(`user:${data.receiverId}`).emit('vibration_received', {
          vibrationId: data.vibrationId,
          senderId: userId,
          senderUsername: username,
          vibrationType: data.vibrationType,
          emoji: data.emoji,
          patternName: data.patternName,
          timestamp: new Date().toISOString(),
        });

        // Mark as delivered
        if (data.vibrationId) {
          await VibrationModel.markAsDelivered(data.vibrationId);
        }
      } catch (error) {
        logger.error('Error handling vibration_sent:', error);
        socket.emit('error', { message: 'Failed to send vibration' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      io?.to(`user:${data.receiverId}`).emit('friend_typing', {
        userId,
        username,
      });
    });

    // Handle presence updates
    socket.on('presence_update', async (data) => {
      try {
        await UserModel.updateLastSeen(userId);

        // Notify friends
        friends.forEach(friendId => {
          io?.to(`user:${friendId}`).emit('friend_presence_updated', {
            userId,
            lastSeen: new Date().toISOString(),
          });
        });
      } catch (error) {
        logger.error('Error handling presence update:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info('WebSocket client disconnected', { userId, username, socketId: socket.id });

      // Check if user has other active connections
      const userSockets = await io?.in(`user:${userId}`).fetchSockets();

      if (!userSockets || userSockets.length === 0) {
        // User is completely offline
        await setRemove('online_users', userId);
        await UserModel.updateLastSeen(userId);

        // Notify friends that user is offline
        friends.forEach(friendId => {
          io?.to(`user:${friendId}`).emit('friend_offline', {
            userId,
            username,
            lastSeen: new Date().toISOString(),
          });
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error:', { userId, error });
    });
  });

  logger.info('WebSocket server initialized');
  return io;
};

// Helper function to get friend IDs
async function getFriendIds(userId: string): Promise<string[]> {
  const { FriendshipModel } = await import('../models/Friendship');
  const friends = await FriendshipModel.getFriends(userId);
  return friends.map(friend => friend.id);
}

// Export function to send events to specific users
export const sendToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    logger.debug('Event sent to user', { userId, event });
  }
};

// Export function to check if user is online
export const isUserOnline = async (userId: string): Promise<boolean> => {
  const onlineUsers = await setMembers('online_users');
  return onlineUsers.includes(userId);
};

// Export function to get online users count
export const getOnlineUsersCount = async (): Promise<number> => {
  const onlineUsers = await setMembers('online_users');
  return onlineUsers.length;
};

export const getIO = (): Server | null => {
  return io;
};

export default { initializeWebSocket, sendToUser, isUserOnline, getOnlineUsersCount, getIO };
