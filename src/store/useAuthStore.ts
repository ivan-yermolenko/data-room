import { create } from 'zustand';
import { sentryService } from '@/services/sentry';

const USER_STORAGE_KEY = 'dataroom-user';

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  login: (profile: UserProfile) => void;
  logout: () => void;
}

const getInitialUser = (): UserProfile | null => {
  try {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    return savedUser ? (JSON.parse(savedUser) as UserProfile) : null;
  } catch (error) {
    sentryService.captureException(error, { message: 'Failed to parse saved user from localStorage' });
    return null;
  }
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: getInitialUser(),
  loading: false,

  login: (profile) => {
    set({ user: profile });
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  },

  logout: () => {
    set({ user: null });
    localStorage.removeItem(USER_STORAGE_KEY);
  },
}));
