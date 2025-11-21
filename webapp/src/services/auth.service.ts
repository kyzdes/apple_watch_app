import { apiClient } from '../utils/api';
import { AuthResponse, User } from '../types';

export const authService = {
  async loginWithGoogle(idToken: string, username?: string): Promise<AuthResponse> {
    return apiClient.post('/auth/google', { idToken, username });
  },

  async checkUsername(username: string): Promise<boolean> {
    const result = await apiClient.get<{ available: boolean }>(
      `/auth/username/${username}`
    );
    return result.available;
  },

  async getProfile(): Promise<User> {
    return apiClient.get('/users/profile');
  },

  async updateProfile(username: string): Promise<User> {
    return apiClient.put('/users/profile', { username });
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
  },

  async registerDeviceToken(token: string): Promise<void> {
    await apiClient.post('/users/device-token', {
      token,
      deviceType: 'web',
    });
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getCurrentUserId(): string | null {
    return localStorage.getItem('user_id');
  },

  getCurrentUsername(): string | null {
    return localStorage.getItem('username');
  },
};
