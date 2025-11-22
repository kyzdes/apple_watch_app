import { Request, Response } from 'express';
import { pool } from '../config/database';
import logger from '../utils/logger';
import { broadcastToUser } from '../services/websocket';

// Get all achievements with user progress
export const getAchievements = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT
        a.*,
        ua.progress,
        ua.is_unlocked,
        ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       WHERE a.is_secret = false OR ua.is_unlocked = true
       ORDER BY a.category, a.tier, a.requirement_value`,
      [userId]
    );

    const achievements = result.rows.map(row => ({
      ...row,
      progress: row.progress || 0,
      is_unlocked: row.is_unlocked || false,
      progress_percentage: row.requirement_value > 0
        ? Math.min(100, Math.round((row.progress || 0) / row.requirement_value * 100))
        : 0,
    }));

    // Group by category
    const groupedAchievements = achievements.reduce((acc: any, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        achievements,
        groupedAchievements,
      },
    });
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements',
    });
  }
};

// Check and update achievement progress
export const updateAchievementProgress = async (
  userId: string,
  requirementType: string,
  currentValue: number
) => {
  try {
    // Get relevant achievements
    const achievementsResult = await pool.query(
      `SELECT a.id, a.requirement_value, ua.progress, ua.is_unlocked
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       WHERE a.requirement_type = $2
       AND (ua.is_unlocked IS NULL OR ua.is_unlocked = false)`,
      [userId, requirementType]
    );

    const client = await pool.connect();
    const newlyUnlocked = [];

    try {
      await client.query('BEGIN');

      for (const achievement of achievementsResult.rows) {
        const shouldUnlock = currentValue >= achievement.requirement_value;

        // Upsert user achievement
        const result = await client.query(
          `INSERT INTO user_achievements (user_id, achievement_id, progress, is_unlocked, unlocked_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, achievement_id)
           DO UPDATE SET
             progress = $3,
             is_unlocked = $4,
             unlocked_at = CASE WHEN $4 = true AND user_achievements.is_unlocked = false THEN $5 ELSE user_achievements.unlocked_at END,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [userId, achievement.id, currentValue, shouldUnlock, shouldUnlock ? new Date() : null]
        );

        if (shouldUnlock && !achievement.is_unlocked) {
          // Get achievement details for notification
          const achievementDetails = await client.query(
            'SELECT * FROM achievements WHERE id = $1',
            [achievement.id]
          );

          newlyUnlocked.push(achievementDetails.rows[0]);

          // Create notification
          await client.query(
            `INSERT INTO notifications (user_id, notification_type, title, message, data)
             VALUES ($1, 'achievement_unlocked', $2, $3, $4)`,
            [
              userId,
              'Achievement Unlocked!',
              `You unlocked "${achievementDetails.rows[0].name}"`,
              JSON.stringify({ achievementId: achievement.id })
            ]
          );
        }
      }

      await client.query('COMMIT');

      // Notify user of newly unlocked achievements
      if (newlyUnlocked.length > 0) {
        broadcastToUser(userId, 'achievements_unlocked', {
          achievements: newlyUnlocked,
        });
      }

      return newlyUnlocked;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error updating achievement progress:', error);
    return [];
  }
};

// Get leaderboard
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { type = 'vibrations_sent', period = 'all_time' } = req.query;
    const userId = req.user?.id;

    let query = '';
    let params: any[] = [];

    if (type === 'vibrations_sent') {
      query = `
        SELECT
          u.id,
          u.username,
          u.avatar_url,
          u.total_vibrations_sent as score,
          ROW_NUMBER() OVER (ORDER BY u.total_vibrations_sent DESC) as rank
        FROM users u
        WHERE u.total_vibrations_sent > 0
        ORDER BY u.total_vibrations_sent DESC
        LIMIT 100
      `;
    } else if (type === 'streak') {
      query = `
        SELECT
          u.id,
          u.username,
          u.avatar_url,
          u.current_streak as score,
          ROW_NUMBER() OVER (ORDER BY u.current_streak DESC) as rank
        FROM users u
        WHERE u.current_streak > 0
        ORDER BY u.current_streak DESC
        LIMIT 100
      `;
    } else if (type === 'achievements') {
      query = `
        SELECT
          u.id,
          u.username,
          u.avatar_url,
          COUNT(ua.achievement_id) FILTER (WHERE ua.is_unlocked = true) as score,
          ROW_NUMBER() OVER (ORDER BY COUNT(ua.achievement_id) FILTER (WHERE ua.is_unlocked = true) DESC) as rank
        FROM users u
        LEFT JOIN user_achievements ua ON u.id = ua.user_id
        GROUP BY u.id
        HAVING COUNT(ua.achievement_id) FILTER (WHERE ua.is_unlocked = true) > 0
        ORDER BY score DESC
        LIMIT 100
      `;
    }

    const result = await pool.query(query, params);

    // Find current user's rank if logged in
    let userRank = null;
    if (userId) {
      const userEntry = result.rows.find(row => row.id === userId);
      if (userEntry) {
        userRank = userEntry.rank;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        leaderboard: result.rows,
        userRank,
      },
    });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
    });
  }
};
