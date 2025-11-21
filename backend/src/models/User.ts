import { pool } from '../config/database';

export interface User {
  id: string;
  email: string;
  username: string;
  auth_provider: 'apple' | 'google';
  provider_id: string;
  is_active: boolean;
  biometric_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  last_seen?: Date;
}

export interface CreateUserInput {
  email: string;
  username: string;
  auth_provider: 'apple' | 'google';
  provider_id: string;
}

export class UserModel {
  static async create(userData: CreateUserInput): Promise<User> {
    const query = `
      INSERT INTO users (email, username, auth_provider, provider_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [userData.email, userData.username, userData.auth_provider, userData.provider_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  static async findByProvider(provider: string, providerId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE auth_provider = $1 AND provider_id = $2';
    const result = await pool.query(query, [provider, providerId]);
    return result.rows[0] || null;
  }

  static async updateUsername(userId: string, username: string): Promise<User> {
    const query = `
      UPDATE users
      SET username = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [username, userId]);
    return result.rows[0];
  }

  static async updateLastSeen(userId: string): Promise<void> {
    const query = 'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [userId]);
  }

  static async searchUsers(searchTerm: string, limit: number = 20): Promise<User[]> {
    const query = `
      SELECT * FROM users
      WHERE username ILIKE $1 AND is_active = true
      LIMIT $2
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, limit]);
    return result.rows;
  }

  static async delete(userId: string): Promise<void> {
    const query = 'UPDATE users SET is_active = false WHERE id = $1';
    await pool.query(query, [userId]);
  }

  static async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user === null;
  }
}
