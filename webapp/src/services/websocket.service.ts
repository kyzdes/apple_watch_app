import { io, Socket } from 'socket.io-client';
import { IncomingVibration } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || '';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No access token found, skipping WebSocket connection');
      return;
    }

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('connection_status', true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.emit('connection_status', false);
    });

    this.socket.on('vibration_received', (data: IncomingVibration) => {
      console.log('Vibration received:', data);
      this.emit('vibration_received', data);
    });

    this.socket.on('friend_online', (data: any) => {
      console.log('Friend online:', data);
      this.emit('friend_online', data);
    });

    this.socket.on('friend_offline', (data: any) => {
      console.log('Friend offline:', data);
      this.emit('friend_offline', data);
    });

    this.socket.on('friend_request', (data: any) => {
      console.log('Friend request:', data);
      this.emit('friend_request', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendVibration(data: {
    vibrationId: string;
    receiverId: string;
    vibrationType: string;
    emoji?: string;
    patternName?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit('vibration_sent', data);
    }
  }

  updatePresence() {
    if (this.socket?.connected) {
      this.socket.emit('presence_update', {});
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
