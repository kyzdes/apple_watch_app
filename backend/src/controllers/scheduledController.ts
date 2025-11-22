import { Request, Response } from 'express';
import { pool } from '../config/database';
import logger from '../utils/logger';

// Create scheduled vibration
export const createScheduledVibration = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      recipientId,
      groupId,
      vibrationType,
      patternId,
      customPatternId,
      emoji,
      message,
      scheduledTime,
      scheduledDate,
      recurrence,
      timezone
    } = req.body;

    if (!scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time is required',
      });
    }

    if (!recipientId && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Either recipientId or groupId is required',
      });
    }

    // Calculate next_send_at
    const nextSendAt = calculateNextSendTime(scheduledTime, scheduledDate, timezone || 'UTC');

    const result = await pool.query(
      `INSERT INTO scheduled_vibrations
       (user_id, recipient_id, group_id, vibration_type, pattern_id, custom_pattern_id,
        emoji, message, scheduled_time, scheduled_date, recurrence, timezone, next_send_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        userId,
        recipientId || null,
        groupId || null,
        vibrationType,
        patternId || null,
        customPatternId || null,
        emoji || null,
        message || null,
        scheduledTime,
        scheduledDate || null,
        recurrence || 'once',
        timezone || 'UTC',
        nextSendAt
      ]
    );

    logger.info('Scheduled vibration created:', {
      scheduledVibrationId: result.rows[0].id,
      userId,
      nextSendAt
    });

    res.status(201).json({
      success: true,
      data: { scheduledVibration: result.rows[0] },
    });
  } catch (error) {
    logger.error('Error creating scheduled vibration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheduled vibration',
    });
  }
};

// Get user's scheduled vibrations
export const getScheduledVibrations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { activeOnly = 'true' } = req.query;

    let query = `
      SELECT
        sv.*,
        u.username as recipient_username,
        u.avatar_url as recipient_avatar,
        fg.name as group_name
      FROM scheduled_vibrations sv
      LEFT JOIN users u ON sv.recipient_id = u.id
      LEFT JOIN friend_groups fg ON sv.group_id = fg.id
      WHERE sv.user_id = $1
    `;

    if (activeOnly === 'true') {
      query += ' AND sv.is_active = true';
    }

    query += ' ORDER BY sv.next_send_at ASC';

    const result = await pool.query(query, [userId]);

    res.status(200).json({
      success: true,
      data: { scheduledVibrations: result.rows },
    });
  } catch (error) {
    logger.error('Error fetching scheduled vibrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled vibrations',
    });
  }
};

// Update scheduled vibration
export const updateScheduledVibration = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { scheduledId } = req.params;
    const { isActive, scheduledTime, recurrence } = req.body;

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM scheduled_vibrations WHERE id = $1 AND user_id = $2',
      [scheduledId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this scheduled vibration',
      });
    }

    const result = await pool.query(
      `UPDATE scheduled_vibrations
       SET is_active = COALESCE($1, is_active),
           scheduled_time = COALESCE($2, scheduled_time),
           recurrence = COALESCE($3, recurrence),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [isActive, scheduledTime, recurrence, scheduledId]
    );

    res.status(200).json({
      success: true,
      data: { scheduledVibration: result.rows[0] },
    });
  } catch (error) {
    logger.error('Error updating scheduled vibration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled vibration',
    });
  }
};

// Delete scheduled vibration
export const deleteScheduledVibration = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { scheduledId } = req.params;

    const result = await pool.query(
      'DELETE FROM scheduled_vibrations WHERE id = $1 AND user_id = $2 RETURNING id',
      [scheduledId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled vibration not found or not authorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Scheduled vibration deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting scheduled vibration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheduled vibration',
    });
  }
};

// Helper function to calculate next send time
function calculateNextSendTime(
  scheduledTime: string,
  scheduledDate: string | null,
  timezone: string
): Date {
  const now = new Date();
  const [hours, minutes] = scheduledTime.split(':').map(Number);

  let nextSend = new Date();

  if (scheduledDate) {
    nextSend = new Date(scheduledDate);
  }

  nextSend.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (nextSend < now && !scheduledDate) {
    nextSend.setDate(nextSend.getDate() + 1);
  }

  return nextSend;
}

// Process scheduled vibrations (called by cron job)
export const processScheduledVibrations = async () => {
  try {
    const now = new Date();

    // Get all scheduled vibrations that need to be sent
    const result = await pool.query(
      `SELECT sv.*, u.username as sender_username
       FROM scheduled_vibrations sv
       JOIN users u ON sv.user_id = u.id
       WHERE sv.is_active = true
       AND sv.next_send_at <= $1`,
      [now]
    );

    for (const scheduled of result.rows) {
      try {
        if (scheduled.recipient_id) {
          // Send to individual
          await pool.query(
            `INSERT INTO vibration_history
             (sender_id, receiver_id, vibration_type, pattern_id, custom_pattern_id, emoji, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              scheduled.user_id,
              scheduled.recipient_id,
              scheduled.vibration_type,
              scheduled.pattern_id,
              scheduled.custom_pattern_id,
              scheduled.emoji,
              JSON.stringify({ scheduled: true, message: scheduled.message })
            ]
          );
        } else if (scheduled.group_id) {
          // Send to group (simplified - implement full group send logic)
          // This would call the group vibration endpoint internally
        }

        // Update last_sent_at and calculate next_send_at
        let nextSendAt: Date | null = null;

        if (scheduled.recurrence === 'daily') {
          nextSendAt = new Date(scheduled.next_send_at);
          nextSendAt.setDate(nextSendAt.getDate() + 1);
        } else if (scheduled.recurrence === 'weekly') {
          nextSendAt = new Date(scheduled.next_send_at);
          nextSendAt.setDate(nextSendAt.getDate() + 7);
        } else if (scheduled.recurrence === 'monthly') {
          nextSendAt = new Date(scheduled.next_send_at);
          nextSendAt.setMonth(nextSendAt.getMonth() + 1);
        } else {
          // 'once' - deactivate after sending
          await pool.query(
            'UPDATE scheduled_vibrations SET is_active = false, last_sent_at = $1 WHERE id = $2',
            [now, scheduled.id]
          );
          continue;
        }

        if (nextSendAt) {
          await pool.query(
            'UPDATE scheduled_vibrations SET last_sent_at = $1, next_send_at = $2 WHERE id = $3',
            [now, nextSendAt, scheduled.id]
          );
        }

        logger.info('Scheduled vibration sent:', { scheduledId: scheduled.id });
      } catch (error) {
        logger.error('Error processing scheduled vibration:', error);
      }
    }
  } catch (error) {
    logger.error('Error in processScheduledVibrations:', error);
  }
};
