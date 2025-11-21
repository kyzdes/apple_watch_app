import { apiClient } from '../utils/api';
import { VibrationPattern, CustomPattern, VibrationHistory } from '../types';

export const vibrationsService = {
  async getPresetPatterns(): Promise<VibrationPattern[]> {
    return apiClient.get('/vibrations/patterns/presets');
  },

  async getCustomPatterns(): Promise<CustomPattern[]> {
    return apiClient.get('/vibrations/patterns/custom');
  },

  async createCustomPattern(
    name: string,
    pattern: { intervals: number[]; intensities: number[] }
  ): Promise<CustomPattern> {
    return apiClient.post('/vibrations/patterns/custom', { name, pattern });
  },

  async deleteCustomPattern(patternId: string): Promise<void> {
    await apiClient.delete(`/vibrations/patterns/custom/${patternId}`);
  },

  async sendVibration(
    receiverId: string,
    vibrationType: string,
    patternId?: string,
    customPatternId?: string,
    emoji?: string
  ): Promise<{ id: string }> {
    return apiClient.post('/vibrations/send', {
      receiverId,
      vibrationType,
      patternId,
      customPatternId,
      emoji,
    });
  },

  async getSentHistory(limit: number = 50): Promise<VibrationHistory[]> {
    return apiClient.get(`/vibrations/history/sent?limit=${limit}`);
  },

  async getReceivedHistory(limit: number = 50): Promise<VibrationHistory[]> {
    return apiClient.get(`/vibrations/history/received?limit=${limit}`);
  },

  async markAsRead(vibrationId: string): Promise<void> {
    await apiClient.put(`/vibrations/${vibrationId}/read`);
  },

  async getUnreadCount(): Promise<number> {
    const result = await apiClient.get<{ count: number }>('/vibrations/unread-count');
    return result.count;
  },
};
