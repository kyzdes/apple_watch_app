import { Request, Response } from 'express';
import { pool } from '../config/database';
import logger from '../utils/logger';

// Get social feed
export const getSocialFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM social_feed
       WHERE user_id IN (
         SELECT friend_id FROM friendships
         WHERE user_id = $1 AND status = 'accepted'
         UNION
         SELECT $1
       )
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: { feed: result.rows },
    });
  } catch (error) {
    logger.error('Error fetching social feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed',
    });
  }
};

// Create feed post
export const createFeedPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postType, patternId, customPatternId, achievementId, storyId, caption, isPublic } = req.body;

    const result = await pool.query(
      `INSERT INTO feed_posts
       (user_id, post_type, pattern_id, custom_pattern_id, achievement_id, story_id, caption, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, postType, patternId || null, customPatternId || null, achievementId || null, storyId || null, caption || null, isPublic !== false]
    );

    logger.info('Feed post created:', { postId: result.rows[0].id, userId });

    res.status(201).json({
      success: true,
      data: { post: result.rows[0] },
    });
  } catch (error) {
    logger.error('Error creating feed post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
    });
  }
};

// Like a post
export const likePost = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Add like
      await client.query(
        `INSERT INTO post_likes (post_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (post_id, user_id) DO NOTHING`,
        [postId, userId]
      );

      // Update like count
      await client.query(
        'UPDATE feed_posts SET like_count = like_count + 1 WHERE id = $1',
        [postId]
      );

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Post liked successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error liking post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post',
    });
  }
};

// Unlike a post
export const unlikePost = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Remove like
      const result = await client.query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING id',
        [postId, userId]
      );

      if (result.rows.length > 0) {
        // Update like count
        await client.query(
          'UPDATE feed_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = $1',
          [postId]
        );
      }

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Post unliked successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error unliking post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike post',
    });
  }
};

// Comment on a post
export const commentOnPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;
    const { commentText } = req.body;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Add comment
      const result = await client.query(
        `INSERT INTO post_comments (post_id, user_id, comment_text)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [postId, userId, commentText]
      );

      // Update comment count
      await client.query(
        'UPDATE feed_posts SET comment_count = comment_count + 1 WHERE id = $1',
        [postId]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: { comment: result.rows[0] },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error commenting on post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
    });
  }
};

// Get post comments
export const getPostComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT
        pc.*,
        u.username,
        u.avatar_url
       FROM post_comments pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.post_id = $1
       ORDER BY pc.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: { comments: result.rows },
    });
  } catch (error) {
    logger.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
    });
  }
};

// Delete own post
export const deleteFeedPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;

    const result = await pool.query(
      'DELETE FROM feed_posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [postId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or not authorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
    });
  }
};

// Get trending patterns
export const getTrendingPatterns = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT
        fp.custom_pattern_id,
        cp.name,
        cp.pattern,
        u.username as creator_username,
        COUNT(*) as post_count,
        SUM(fp.like_count) as total_likes
       FROM feed_posts fp
       JOIN custom_patterns cp ON fp.custom_pattern_id = cp.id
       JOIN users u ON cp.user_id = u.id
       WHERE fp.post_type = 'shared_pattern'
       AND fp.created_at > NOW() - INTERVAL '7 days'
       GROUP BY fp.custom_pattern_id, cp.name, cp.pattern, u.username
       ORDER BY total_likes DESC, post_count DESC
       LIMIT $1`,
      [limit]
    );

    res.status(200).json({
      success: true,
      data: { trendingPatterns: result.rows },
    });
  } catch (error) {
    logger.error('Error fetching trending patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending patterns',
    });
  }
};
