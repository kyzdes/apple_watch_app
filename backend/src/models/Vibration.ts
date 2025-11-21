import { pool } from '../config/database';

export interface VibrationPattern {
  id: string;
  name: string;
  pattern: {
    intervals: number[];
    intensities: number[];
  };
  is_preset: boolean;
  description?: string;
  created_at: Date;
}

export interface CustomPattern {
  id: string;
  user_id: string;
  name: string;
  pattern: {
    intervals: number[];
    intensities: number[];
  };
  created_at: Date;
  updated_at: Date;
}

export interface VibrationHistory {
  id: string;
  sender_id: string;
  receiver_id: string;
  vibration_type: string;
  pattern_id?: string;
  custom_pattern_id?: string;
  emoji?: string;
  sent_at: Date;
  delivered_at?: Date;
  read_at?: Date;
  metadata?: any;
}

export interface VibrationHistoryWithDetails extends VibrationHistory {
  sender_username: string;
  receiver_username: string;
  pattern?: VibrationPattern;
}

export class VibrationModel {
  static async getPresetPatterns(): Promise<VibrationPattern[]> {
    const query = 'SELECT * FROM vibration_patterns WHERE is_preset = true ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  static async getPatternById(patternId: string): Promise<VibrationPattern | null> {
    const query = 'SELECT * FROM vibration_patterns WHERE id = $1';
    const result = await pool.query(query, [patternId]);
    return result.rows[0] || null;
  }

  static async getPatternByName(name: string): Promise<VibrationPattern | null> {
    const query = 'SELECT * FROM vibration_patterns WHERE name = $1';
    const result = await pool.query(query, [name]);
    return result.rows[0] || null;
  }

  static async createCustomPattern(userId: string, name: string, pattern: any): Promise<CustomPattern> {
    const query = `
      INSERT INTO custom_patterns (user_id, name, pattern)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, name, JSON.stringify(pattern)]);
    return result.rows[0];
  }

  static async getUserCustomPatterns(userId: string): Promise<CustomPattern[]> {
    const query = 'SELECT * FROM custom_patterns WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async deleteCustomPattern(patternId: string, userId: string): Promise<void> {
    const query = 'DELETE FROM custom_patterns WHERE id = $1 AND user_id = $2';
    await pool.query(query, [patternId, userId]);
  }

  static async sendVibration(
    senderId: string,
    receiverId: string,
    vibrationType: string,
    patternId?: string,
    customPatternId?: string,
    emoji?: string,
    metadata?: any
  ): Promise<VibrationHistory> {
    const query = `
      INSERT INTO vibration_history
        (sender_id, receiver_id, vibration_type, pattern_id, custom_pattern_id, emoji, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [
      senderId,
      receiverId,
      vibrationType,
      patternId || null,
      customPatternId || null,
      emoji || null,
      metadata ? JSON.stringify(metadata) : null,
    ]);
    return result.rows[0];
  }

  static async markAsDelivered(vibrationId: string): Promise<void> {
    const query = `
      UPDATE vibration_history
      SET delivered_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND delivered_at IS NULL
    `;
    await pool.query(query, [vibrationId]);
  }

  static async markAsRead(vibrationId: string): Promise<void> {
    const query = `
      UPDATE vibration_history
      SET read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND read_at IS NULL
    `;
    await pool.query(query, [vibrationId]);
  }

  static async getSentHistory(userId: string, limit: number = 50): Promise<VibrationHistoryWithDetails[]> {
    const query = `
      SELECT
        vh.*,
        sender.username as sender_username,
        receiver.username as receiver_username,
        vp.name as pattern_name,
        vp.pattern as pattern_data
      FROM vibration_history vh
      JOIN users sender ON vh.sender_id = sender.id
      JOIN users receiver ON vh.receiver_id = receiver.id
      LEFT JOIN vibration_patterns vp ON vh.pattern_id = vp.id
      WHERE vh.sender_id = $1
      ORDER BY vh.sent_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  static async getReceivedHistory(userId: string, limit: number = 50): Promise<VibrationHistoryWithDetails[]> {
    const query = `
      SELECT
        vh.*,
        sender.username as sender_username,
        receiver.username as receiver_username,
        vp.name as pattern_name,
        vp.pattern as pattern_data
      FROM vibration_history vh
      JOIN users sender ON vh.sender_id = sender.id
      JOIN users receiver ON vh.receiver_id = receiver.id
      LEFT JOIN vibration_patterns vp ON vh.pattern_id = vp.id
      WHERE vh.receiver_id = $1
      ORDER BY vh.sent_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM vibration_history
      WHERE receiver_id = $1 AND read_at IS NULL
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}
