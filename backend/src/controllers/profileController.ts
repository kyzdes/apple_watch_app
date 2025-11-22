import { Request, Response } from 'express';
import { pool } from '../config/database';
import logger from '../utils/logger';

// Get user profile with full stats
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;

    const result = await pool.query(
      `SELECT * FROM user_profiles WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const profile = result.rows[0];

    // Get user's showcased patterns
    const patternsResult = await pool.query(
      `SELECT cp.id, cp.name, cp.pattern, cp.created_at
       FROM custom_patterns cp
       WHERE cp.user_id = $1
       ORDER BY cp.created_at DESC
       LIMIT 6`,
      [profile.id]
    );

    // Get user's recent achievements
    const achievementsResult = await pool.query(
      `SELECT a.id, a.name, a.description, a.icon, a.tier, a.points, ua.unlocked_at
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = $1 AND ua.is_unlocked = true
       ORDER BY ua.unlocked_at DESC
       LIMIT 6`,
      [profile.id]
    );

    // Check if current user is friends with this user
    let friendshipStatus = null;
    if (currentUserId && currentUserId !== profile.id) {
      const friendshipResult = await pool.query(
        `SELECT status FROM friendships
         WHERE (user_id = $1 AND friend_id = $2)
         OR (user_id = $2 AND friend_id = $1)
         LIMIT 1`,
        [currentUserId, profile.id]
      );
      friendshipStatus = friendshipResult.rows[0]?.status || 'none';
    }

    res.status(200).json({
      success: true,
      data: {
        profile,
        showcasedPatterns: patternsResult.rows,
        recentAchievements: achievementsResult.rows,
        friendshipStatus,
      },
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
};

// Update current user's profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bio, statusMessage, profileTheme, avatarUrl } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET bio = COALESCE($1, bio),
           status_message = COALESCE($2, status_message),
           profile_theme = COALESCE($3, profile_theme),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, username, bio, status_message, profile_theme, avatar_url`,
      [bio, statusMessage, profileTheme, avatarUrl, userId]
    );

    res.status(200).json({
      success: true,
      data: { profile: result.rows[0] },
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

// Get user's analytics
export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { days = 30 } = req.query;

    const result = await pool.query(
      `SELECT *
       FROM user_analytics
       WHERE user_id = $1
       AND date >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
       ORDER BY date DESC`,
      [userId]
    );

    // Get top friends by interaction count
    const topFriendsResult = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.avatar_url,
        COUNT(*) as interaction_count,
        COUNT(CASE WHEN vh.sender_id = $1 THEN 1 END) as sent_count,
        COUNT(CASE WHEN vh.receiver_id = $1 THEN 1 END) as received_count
       FROM vibration_history vh
       JOIN users u ON (
         CASE
           WHEN vh.sender_id = $1 THEN vh.receiver_id
           ELSE vh.sender_id
         END = u.id
       )
       WHERE vh.sender_id = $1 OR vh.receiver_id = $1
       GROUP BY u.id, u.username, u.avatar_url
       ORDER BY interaction_count DESC
       LIMIT 5`,
      [userId]
    );

    // Get most used patterns
    const topPatternsResult = await pool.query(
      `SELECT
        vp.id,
        vp.name,
        COUNT(*) as usage_count
       FROM vibration_history vh
       JOIN vibration_patterns vp ON vh.pattern_id = vp.id
       WHERE vh.sender_id = $1
       GROUP BY vp.id, vp.name
       ORDER BY usage_count DESC
       LIMIT 5`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        dailyStats: result.rows,
        topFriends: topFriendsResult.rows,
        topPatterns: topPatternsResult.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};
