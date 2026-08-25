import { create } from 'zustand';
import { api } from '../lib/api/client';

export interface AuthUser {
  id: number;
  type?: string;
  name?: string;
  membership?: number | string;
  email?: string;
  email_verified_at?: string | null;
  photo_approved?: boolean;
  blocked?: boolean | number;
  deactivated?: boolean | number;
  approved?: boolean | number;
  avatar?: string;
  avatar_original?: string;
  phone?: string;
  birthday?: string | null;
  age?: number | null;
  must_change_password?: boolean | number;
  is_visible?: boolean;
  incognito?: boolean;
  travel_mode?: boolean;
  travel_city?: string | null;
  travel_country?: string | null;
  gender?: string | number;
  specialty?: string;
  hospital?: string;
  location?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  updateUser: (fields) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...fields } : null,
    })),

  checkAuth: async () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    try {
      const response = await api.get('/user-by-token');
      const resolvedUser = response.data?.id ? response.data : (response.data?.user ?? null);
      set({
        user: resolvedUser,
        isAuthenticated: !!resolvedUser,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

export default useAuthStore;
