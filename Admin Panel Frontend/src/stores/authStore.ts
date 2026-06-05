import { create } from 'zustand';
import { adminApi } from '@/api/admin';
import type { AdminUser } from '@/types/auth';

interface AuthState {
    user: AdminUser | null;
    loading: boolean;
    authenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    fetchMe: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    authenticated: false,

    login: async (email, password) => {
        const res = await adminApi.login({ email, password });
        const token = res.data?.access_token;
        if (!token) {
            throw new Error(res.data?.message || 'Login failed');
        }
        localStorage.setItem('admin_auth_token', token);
        const user = res.data?.user as AdminUser;
        set({ user, authenticated: true, loading: false });
    },

    fetchMe: async () => {
        const token = localStorage.getItem('admin_auth_token');
        if (!token) {
            set({ user: null, authenticated: false, loading: false });
            return;
        }
        try {
            const res = await adminApi.me();
            const user = (res.data?.user || res.data?.data?.user) as AdminUser;
            set({ user, authenticated: true, loading: false });
        } catch {
            localStorage.removeItem('admin_auth_token');
            set({ user: null, authenticated: false, loading: false });
        }
    },

    logout: async () => {
        try {
            await adminApi.logout();
        } finally {
            localStorage.removeItem('admin_auth_token');
            set({ user: null, authenticated: false, loading: false });
        }
    },
}));
