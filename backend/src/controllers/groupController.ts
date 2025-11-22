import { Request, Response } from 'express';
import { pool } from '../config/database';
import logger from '../utils/logger';
import { broadcastToUsers } from '../services/websocket';

// Create a friend group
export const createGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, description, emoji, memberIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required',
      });
    }

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create group
      const groupResult = await client.query(
        `INSERT INTO friend_groups (user_id, name, description, emoji)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, name, description, emoji]
      );

      const group = groupResult.rows[0];

      // Add members
      if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
        const values = memberIds.map((memberId: string, idx: number) =>
          `($1, $${idx + 2})`
        ).join(',');

        await client.query(
          `INSERT INTO friend_group_members (group_id, user_id)
           VALUES ${values}
           ON CONFLICT (group_id, user_id) DO NOTHING`,
          [group.id, ...memberIds]
        );
      }

      await client.query('COMMIT');

      logger.info('Group created:', { groupId: group.id, userId });

      res.status(201).json({
        success: true,
        data: { group },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
    });
  }
};

// Get user's groups
export const getGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT
        fg.*,
        COUNT(fgm.user_id) as member_count,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id', u.id,
            'username', u.username,
            'avatar_url', u.avatar_url
          )
        ) as members
       FROM friend_groups fg
       LEFT JOIN friend_group_members fgm ON fg.id = fgm.group_id
       LEFT JOIN users u ON fgm.user_id = u.id
       WHERE fg.user_id = $1
       GROUP BY fg.id
       ORDER BY fg.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: { groups: result.rows },
    });
  } catch (error) {
    logger.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups',
    });
  }
};

// Update group
export const updateGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;
    const { name, description, emoji } = req.body;

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM friend_groups WHERE id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this group',
      });
    }

    const result = await pool.query(
      `UPDATE friend_groups
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           emoji = COALESCE($3, emoji),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, description, emoji, groupId]
    );

    res.status(200).json({
      success: true,
      data: { group: result.rows[0] },
    });
  } catch (error) {
    logger.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group',
    });
  }
};

// Add members to group
export const addGroupMembers = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Member IDs are required',
      });
    }

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM friend_groups WHERE id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this group',
      });
    }

    const values = memberIds.map((memberId: string, idx: number) =>
      `($1, $${idx + 2})`
    ).join(',');

    await pool.query(
      `INSERT INTO friend_group_members (group_id, user_id)
       VALUES ${values}
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [groupId, ...memberIds]
    );

    res.status(200).json({
      success: true,
      message: 'Members added successfully',
    });
  } catch (error) {
    logger.error('Error adding group members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add members',
    });
  }
};

// Remove member from group
export const removeGroupMember = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { groupId, memberId } = req.params;

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM friend_groups WHERE id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this group',
      });
    }

    await pool.query(
      'DELETE FROM friend_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, memberId]
    );

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    logger.error('Error removing group member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
    });
  }
};

// Delete group
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;

    const result = await pool.query(
      'DELETE FROM friend_groups WHERE id = $1 AND user_id = $2 RETURNING id',
      [groupId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or not authorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group',
    });
  }
};

// Send vibration to group
export const sendGroupVibration = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { groupId, vibrationType, patternId, customPatternId, emoji, message } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required',
      });
    }

    // Get group members
    const membersResult = await pool.query(
      `SELECT fgm.user_id, u.username
       FROM friend_group_members fgm
       JOIN users u ON fgm.user_id = u.id
       WHERE fgm.group_id = $1 AND fgm.user_id != $2`,
      [groupId, userId]
    );

    if (membersResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients in group',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create group vibration record
      const vibrationResult = await client.query(
        `INSERT INTO group_vibrations
         (sender_id, group_id, vibration_type, pattern_id, custom_pattern_id, emoji, message)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, groupId, vibrationType, patternId || null, customPatternId || null, emoji || null, message || null]
      );

      const groupVibration = vibrationResult.rows[0];

      // Create recipient records
      const recipientValues = membersResult.rows.map((member, idx) =>
        `($1, $${idx + 2})`
      ).join(',');

      await client.query(
        `INSERT INTO group_vibration_recipients (group_vibration_id, recipient_id)
         VALUES ${recipientValues}`,
        [groupVibration.id, ...membersResult.rows.map((m: any) => m.user_id)]
      );

      await client.query('COMMIT');

      // Get sender info for WebSocket
      const senderResult = await pool.query(
        'SELECT username, avatar_url FROM users WHERE id = $1',
        [userId]
      );
      const sender = senderResult.rows[0];

      // Broadcast to all recipients via WebSocket
      const recipientIds = membersResult.rows.map((m: any) => m.user_id);
      broadcastToUsers(recipientIds, 'group_vibration_received', {
        id: groupVibration.id,
        groupId,
        senderId: userId,
        senderUsername: sender.username,
        senderAvatar: sender.avatar_url,
        vibrationType,
        patternId,
        customPatternId,
        emoji,
        message,
        sentAt: groupVibration.sent_at,
      });

      logger.info('Group vibration sent:', {
        groupVibrationId: groupVibration.id,
        senderId: userId,
        recipientCount: recipientIds.length,
      });

      res.status(201).json({
        success: true,
        data: {
          groupVibration,
          recipientCount: recipientIds.length,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error sending group vibration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send group vibration',
    });
  }
};

// Get group vibration history
export const getGroupVibrationHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await pool.query(
      `SELECT
        gv.*,
        u.username as sender_username,
        u.avatar_url as sender_avatar,
        fg.name as group_name,
        COUNT(gvr.recipient_id) as recipient_count,
        COUNT(gvr.delivered_at) as delivered_count,
        COUNT(gvr.read_at) as read_count
       FROM group_vibrations gv
       JOIN users u ON gv.sender_id = u.id
       JOIN friend_groups fg ON gv.group_id = fg.id
       LEFT JOIN group_vibration_recipients gvr ON gv.id = gvr.group_vibration_id
       WHERE gv.group_id = $1
       AND (gv.sender_id = $2 OR EXISTS (
         SELECT 1 FROM friend_group_members
         WHERE group_id = $1 AND user_id = $2
       ))
       GROUP BY gv.id, u.username, u.avatar_url, fg.name
       ORDER BY gv.sent_at DESC
       LIMIT $3`,
      [groupId, userId, limit]
    );

    res.status(200).json({
      success: true,
      data: { vibrations: result.rows },
    });
  } catch (error) {
    logger.error('Error fetching group vibration history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
    });
  }
};
