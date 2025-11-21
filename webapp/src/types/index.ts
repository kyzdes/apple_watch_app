export interface User {
  id: string;
  email: string;
  username: string;
  created_at?: string;
  last_seen?: string;
}

export interface Friend {
  id: string;
  username: string;
  email?: string;
  last_seen?: string;
  is_active: boolean;
  friendship_status: string;
  has_watch: boolean;
}

export interface FriendRequest {
  id: string;
  username: string;
  email?: string;
  requested_at: string;
  request_id: string;
}

export interface VibrationPattern {
  id: string;
  name: string;
  pattern: {
    intervals: number[];
    intensities: number[];
  };
  is_preset: boolean;
  description?: string;
}

export interface CustomPattern {
  id: string;
  user_id: string;
  name: string;
  pattern: {
    intervals: number[];
    intensities: number[];
  };
  created_at: string;
}

export interface VibrationHistory {
  id: string;
  sender_id: string;
  receiver_id: string;
  vibration_type: string;
  pattern_id?: string;
  custom_pattern_id?: string;
  emoji?: string;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  sender_username?: string;
  receiver_username?: string;
  pattern_name?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  requiresUsername?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface IncomingVibration {
  vibrationId: string;
  senderId: string;
  senderUsername: string;
  vibrationType: string;
  emoji?: string;
  patternName?: string;
  timestamp: string;
}
