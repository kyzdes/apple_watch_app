import apn from 'node-apn';
import logger from '../utils/logger';
import { pool } from '../config/database';

let apnProvider: apn.Provider | null = null;

export const initializeAPNS = () => {
  try {
    const options: apn.ProviderOptions = {
      token: {
        key: process.env.APNS_KEY_PATH || '',
        keyId: process.env.APNS_KEY_ID || '',
        teamId: process.env.APNS_TEAM_ID || '',
      },
      production: process.env.APNS_PRODUCTION === 'true',
    };

    apnProvider = new apn.Provider(options);
    logger.info('APNS initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize APNS:', error);
  }
};

export interface PushNotificationData {
  type: 'vibration' | 'friend_request' | 'friend_accepted';
  vibrationId?: string;
  senderId?: string;
  senderUsername?: string;
  emoji?: string;
  patternName?: string;
  [key: string]: any;
}

export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data: PushNotificationData,
  deviceType: 'ios' | 'watch' = 'ios'
): Promise<void> => {
  if (!apnProvider) {
    logger.warn('APNS not initialized, skipping push notification');
    return;
  }

  try {
    // Get device tokens for the user
    const query = `
      SELECT token FROM device_tokens
      WHERE user_id = $1 AND device_type = $2 AND is_active = true
    `;
    const result = await pool.query(query, [userId, deviceType]);

    if (result.rows.length === 0) {
      logger.debug(`No ${deviceType} device tokens found for user ${userId}`);
      return;
    }

    const tokens = result.rows.map(row => row.token);

    // Create notification
    const notification = new apn.Notification({
      alert: {
        title,
        body,
      },
      topic: process.env.APNS_TOPIC || 'com.hapticfriends.app',
      sound: data.type === 'vibration' ? undefined : 'default',
      badge: 0,
      contentAvailable: true,
      payload: data,
      priority: data.type === 'vibration' ? 10 : 5,
    });

    // For vibrations, use silent notification
    if (data.type === 'vibration') {
      notification.pushType = 'background';
      notification.sound = undefined;
    }

    // Send to all tokens
    const results = await apnProvider.send(notification, tokens);

    // Log failures
    results.failed.forEach((failure) => {
      logger.error('APNS send failed:', {
        device: failure.device,
        status: failure.status,
        response: failure.response,
      });

      // Mark token as inactive if permanently failed
      if (failure.status === '410' || failure.status === '400') {
        pool.query(
          'UPDATE device_tokens SET is_active = false WHERE token = $1',
          [failure.device]
        ).catch(err => logger.error('Failed to deactivate token:', err));
      }
    });

    logger.info(`Push notification sent to ${results.sent.length} devices`, {
      userId,
      deviceType,
      type: data.type,
    });
  } catch (error) {
    logger.error('Error sending push notification:', error);
  }
};

export const sendVibrationNotification = async (
  receiverId: string,
  vibrationId: string,
  senderId: string,
  senderUsername: string,
  emoji?: string,
  patternName?: string
): Promise<void> => {
  const data: PushNotificationData = {
    type: 'vibration',
    vibrationId,
    senderId,
    senderUsername,
    emoji,
    patternName,
  };

  // Send to both iOS and Watch
  await Promise.all([
    sendPushNotification(
      receiverId,
      `Vibration from ${senderUsername}`,
      emoji ? `${emoji}` : 'Tap to view',
      data,
      'ios'
    ),
    sendPushNotification(
      receiverId,
      senderUsername,
      emoji || '',
      data,
      'watch'
    ),
  ]);
};

export const shutdownAPNS = () => {
  if (apnProvider) {
    apnProvider.shutdown();
    logger.info('APNS shutdown complete');
  }
};
