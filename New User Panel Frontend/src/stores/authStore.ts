import { create } from 'zustand';
import { api } from '../../utils/api';

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
    birthday?: string | null;
    age?: number | null;
    must_change_password?: boolean | number;
    is_visible?: boolean;
    incognito?: boolean;
    travel_mode?: boolean;
    travel_city?: string | null;
    travel_country?: string | null;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    checkAuth: () => Promise<void>;
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
        } finally {
            localStorage.removeItem('auth_token');
            set({
                user: null,
                isAuthenticated: false,
            });
        }
    },
}));
