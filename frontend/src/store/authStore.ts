import { create } from 'zustand';
import { authService } from '../services/authService';

interface User {
  _id: string;
  email: string;
  username: string;
  fullName?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ user: User; token: string }>;
  register: (userData: {
    email: string;
    password: string;
    username: string;
    fullName?: string;
  }) => Promise<{ user: User; token: string }>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: true }),

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error al iniciar sesión';
      set({
        error: message,
        loading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error al registrar usuario';
      set({
        error: message,
        loading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
