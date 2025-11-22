import { Request, Response } from 'express';
import { pool } from '../config/database';
import logger from '../utils/logger';

// Create a haptic story
export const createStory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, sequences, isPublic, expiresIn24h } = req.body;

    if (!title || !sequences || !Array.isArray(sequences) || sequences.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title and sequences are required',
      });
    }

    const expiresAt = expiresIn24h
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create story
      const storyResult = await client.query(
        `INSERT INTO haptic_stories (user_id, title, is_public, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, title, isPublic || false, expiresAt]
      );

      const story = storyResult.rows[0];

      // Insert sequences
      for (let i = 0; i < sequences.length; i++) {
        const seq = sequences[i];
        await client.query(
          `INSERT INTO story_sequences
           (story_id, sequence_order, vibration_type, pattern_id, custom_pattern_id, emoji, text_content, duration_ms)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            story.id,
            i,
            seq.vibrationType || null,
            seq.patternId || null,
            seq.customPatternId || null,
            seq.emoji || null,
            seq.textContent || null,
            seq.durationMs || 2000
          ]
        );
      }

      await client.query('COMMIT');

      logger.info('Haptic story created:', { storyId: story.id, userId });

      res.status(201).json({
        success: true,
        data: { story },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create story',
    });
  }
};

// Get user's stories
export const getUserStories = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    // Get user ID from username
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const targetUserId = userResult.rows[0].id;
    const currentUserId = req.user?.id;

    // Get stories
    const result = await pool.query(
      `SELECT
        hs.*,
        u.username,
        u.avatar_url,
        (SELECT COUNT(*) FROM story_views WHERE story_id = hs.id) as view_count,
        EXISTS(SELECT 1 FROM story_views WHERE story_id = hs.id AND viewer_id = $2) as viewed_by_current_user
       FROM haptic_stories hs
       JOIN users u ON hs.user_id = u.id
       WHERE hs.user_id = $1
       AND (hs.expires_at IS NULL OR hs.expires_at > NOW())
       AND (hs.is_public = true OR hs.user_id = $2)
       ORDER BY hs.created_at DESC`,
      [targetUserId, currentUserId]
    );

    res.status(200).json({
      success: true,
      data: { stories: result.rows },
    });
  } catch (error) {
    logger.error('Error fetching user stories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stories',
    });
  }
};

// Get story details with sequences
export const getStoryDetails = async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id;

    // Get story
    const storyResult = await pool.query(
      `SELECT
        hs.*,
        u.username,
        u.avatar_url
       FROM haptic_stories hs
       JOIN users u ON hs.user_id = u.id
       WHERE hs.id = $1
       AND (hs.expires_at IS NULL OR hs.expires_at > NOW())`,
      [storyId]
    );

    if (storyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Story not found or expired',
      });
    }

    const story = storyResult.rows[0];

    // Check access
    if (!story.is_public && story.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this story',
      });
    }

    // Get sequences
    const sequencesResult = await pool.query(
      `SELECT * FROM story_sequences
       WHERE story_id = $1
       ORDER BY sequence_order`,
      [storyId]
    );

    // Record view if user is logged in and not the owner
    if (userId && userId !== story.user_id) {
      await pool.query(
        `INSERT INTO story_views (story_id, viewer_id)
         VALUES ($1, $2)
         ON CONFLICT (story_id, viewer_id) DO NOTHING`,
        [storyId, userId]
      );

      // Update view count
      await pool.query(
        'UPDATE haptic_stories SET view_count = view_count + 1 WHERE id = $1',
        [storyId]
      );
    }

    res.status(200).json({
      success: true,
      data: {
        story: {
          ...story,
          sequences: sequencesResult.rows,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching story details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch story',
    });
  }
};

// Get friends' stories feed
export const getStoriesFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT
        hs.*,
        u.username,
        u.avatar_url,
        (SELECT COUNT(*) FROM story_views WHERE story_id = hs.id) as view_count,
        EXISTS(SELECT 1 FROM story_views WHERE story_id = hs.id AND viewer_id = $1) as viewed_by_me
       FROM haptic_stories hs
       JOIN users u ON hs.user_id = u.id
       WHERE (
         hs.user_id IN (
           SELECT friend_id FROM friendships
           WHERE user_id = $1 AND status = 'accepted'
         )
         OR hs.user_id = $1
       )
       AND (hs.expires_at IS NULL OR hs.expires_at > NOW())
       ORDER BY hs.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: { stories: result.rows },
    });
  } catch (error) {
    logger.error('Error fetching stories feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stories feed',
    });
  }
};

// Delete story
export const deleteStory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { storyId } = req.params;

    const result = await pool.query(
      'DELETE FROM haptic_stories WHERE id = $1 AND user_id = $2 RETURNING id',
      [storyId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Story not found or not authorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete story',
    });
  }
};
