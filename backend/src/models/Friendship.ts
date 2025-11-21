import { pool } from '../config/database';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  requested_at: Date;
  responded_at?: Date;
}

export interface FriendWithDetails {
  id: string;
  username: string;
  email: string;
  last_seen?: Date;
  is_active: boolean;
  friendship_status: string;
  has_watch: boolean;
}

export class FriendshipModel {
  static async sendRequest(userId: string, friendId: string): Promise<Friendship> {
    const query = `
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `;
    const result = await pool.query(query, [userId, friendId]);
    return result.rows[0];
  }

  static async acceptRequest(requestId: string): Promise<Friendship> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update the original request
      const updateQuery = `
        UPDATE friendships
        SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(updateQuery, [requestId]);
      const friendship = result.rows[0];

      // Create reciprocal friendship
      const reciprocalQuery = `
        INSERT INTO friendships (user_id, friend_id, status, responded_at)
        VALUES ($1, $2, 'accepted', CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, friend_id) DO NOTHING
      `;
      await client.query(reciprocalQuery, [friendship.friend_id, friendship.user_id]);

      await client.query('COMMIT');
      return friendship;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async declineRequest(requestId: string): Promise<Friendship> {
    const query = `
      UPDATE friendships
      SET status = 'declined', responded_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [requestId]);
    return result.rows[0];
  }

  static async removeFriend(userId: string, friendId: string): Promise<void> {
    const query = `
      DELETE FROM friendships
      WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
    `;
    await pool.query(query, [userId, friendId]);
  }

  static async getFriends(userId: string): Promise<FriendWithDetails[]> {
    const query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.last_seen,
        u.is_active,
        f.status as friendship_status,
        CASE WHEN dt.id IS NOT NULL THEN true ELSE false END as has_watch
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      LEFT JOIN device_tokens dt ON u.id = dt.user_id AND dt.device_type = 'watch' AND dt.is_active = true
      WHERE f.user_id = $1 AND f.status = 'accepted'
      ORDER BY u.last_seen DESC NULLS LAST
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getPendingRequests(userId: string): Promise<FriendWithDetails[]> {
    const query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.last_seen,
        u.is_active,
        f.status as friendship_status,
        f.id as request_id,
        f.requested_at,
        false as has_watch
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = $1 AND f.status = 'pending'
      ORDER BY f.requested_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getSentRequests(userId: string): Promise<FriendWithDetails[]> {
    const query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.last_seen,
        u.is_active,
        f.status as friendship_status,
        f.id as request_id,
        f.requested_at,
        false as has_watch
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1 AND f.status = 'pending'
      ORDER BY f.requested_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async areFriends(userId: string, friendId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM friendships
        WHERE user_id = $1 AND friend_id = $2 AND status = 'accepted'
      ) as are_friends
    `;
    const result = await pool.query(query, [userId, friendId]);
    return result.rows[0].are_friends;
  }

  static async getFriendshipStatus(userId: string, friendId: string): Promise<string | null> {
    const query = `
      SELECT status FROM friendships
      WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
      LIMIT 1
    `;
    const result = await pool.query(query, [userId, friendId]);
    return result.rows[0]?.status || null;
  }
}
