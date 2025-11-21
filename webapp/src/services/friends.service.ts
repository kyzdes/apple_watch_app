import { apiClient } from '../utils/api';
import { Friend, FriendRequest, User } from '../types';

export const friendsService = {
  async getFriends(): Promise<Friend[]> {
    return apiClient.get('/friends');
  },

  async getPendingRequests(): Promise<FriendRequest[]> {
    return apiClient.get('/friends/requests/pending');
  },

  async getSentRequests(): Promise<FriendRequest[]> {
    return apiClient.get('/friends/requests/sent');
  },

  async sendFriendRequest(friendId: string): Promise<void> {
    await apiClient.post('/friends/request', { friendId });
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    await apiClient.put(`/friends/request/${requestId}/accept`);
  },

  async declineFriendRequest(requestId: string): Promise<void> {
    await apiClient.put(`/friends/request/${requestId}/decline`);
  },

  async removeFriend(friendId: string): Promise<void> {
    await apiClient.delete(`/friends/${friendId}`);
  },

  async searchUsers(query: string): Promise<User[]> {
    return apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
  },
};
