import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../utils/api';

interface User {
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
    birthday?: number | string;
    code?: string;
    referral_code?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    checkAuth: () => Promise<void>;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        }),

    checkAuth: async () => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) {
                set({ user: null, isAuthenticated: false, isLoading: false });
                return;
            }

            const response = await api.get('/user-by-token');
            const resolvedUser = response.data?.id ? response.data : (response.data?.user ?? null);

            set({
                user: resolvedUser,
                isAuthenticated: !!resolvedUser,
                isLoading: false,
            });
        } catch (error) {
            // If token is invalid, clear it
            await SecureStore.deleteItemAsync('auth_token');
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    login: async (token: string, user: User) => {
        await SecureStore.setItemAsync('auth_token', token);
        set({
            user,
            isAuthenticated: true,
            isLoading: false,
        });
    },

    logout: async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            console.warn('Logout API call failed', e);
        } finally {
            await SecureStore.deleteItemAsync('auth_token');
            set({
                user: null,
                isAuthenticated: false,
            });
        }
    },
}));
