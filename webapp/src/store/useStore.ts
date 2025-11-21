import { create } from 'zustand';
import { User, Friend, VibrationHistory, VibrationPattern, IncomingVibration } from '../types';

interface AppStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;

  // Friends
  friends: Friend[];
  setFriends: (friends: Friend[]) => void;

  // Vibrations
  presetPatterns: VibrationPattern[];
  setPresetPatterns: (patterns: VibrationPattern[]) => void;

  sentHistory: VibrationHistory[];
  setSentHistory: (history: VibrationHistory[]) => void;

  receivedHistory: VibrationHistory[];
  setReceivedHistory: (history: VibrationHistory[]) => void;

  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;

  // Real-time
  isConnected: boolean;
  setConnected: (value: boolean) => void;

  currentVibration: IncomingVibration | null;
  setCurrentVibration: (vibration: IncomingVibration | null) => void;

  // UI
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
}

export const useStore = create<AppStore>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),

  // Friends
  friends: [],
  setFriends: (friends) => set({ friends }),

  // Vibrations
  presetPatterns: [],
  setPresetPatterns: (patterns) => set({ presetPatterns: patterns }),

  sentHistory: [],
  setSentHistory: (history) => set({ sentHistory: history }),

  receivedHistory: [],
  setReceivedHistory: (history) => set({ receivedHistory: history }),

  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnreadCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  // Real-time
  isConnected: false,
  setConnected: (value) => set({ isConnected: value }),

  currentVibration: null,
  setCurrentVibration: (vibration) => set({ currentVibration: vibration }),

  // UI
  isMobileMenuOpen: false,
  setMobileMenuOpen: (value) => set({ isMobileMenuOpen: value }),
}));
