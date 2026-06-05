import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get URL from environment or fallback to localhost for development
// Note: localhost on Android is 10.0.2.2, on iOS it's localhost
const DEV_API_URL = Platform.select({
    ios: 'http://localhost:8000/api',
    android: 'http://10.0.2.2:8000/api',
    default: 'http://localhost:8000/api',
});

// Since we are in the same repo, we assume the backend is served locally for now
// Replace this with your production URL when deploying
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;

// Base URL for images/uploads (without /api)
const UPLOADS_BASE_URL = BASE_URL?.replace('/api', '') || 'http://localhost:8000';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

// Helper function to get full URL for profile images
export const getProfileImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    // If already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Otherwise, prepend the uploads base URL
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${UPLOADS_BASE_URL}${cleanPath}`;
};

// Attach Bearer token and language header
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            // Send selected language to backend (read by AppLanguage middleware)
            const lang = (await SecureStore.getItemAsync('lang')) || 'en';
            config.headers['App-Language'] = lang;
        } catch (error) {
            console.error('Error retrieving token', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Normalize API responses to always use 'result' for backward compatibility
// Some controllers return 'success', others return 'result'
api.interceptors.response.use(
    (response) => {
        if (response.data && typeof response.data === 'object') {
            // If response has 'success' but not 'result', copy success to result
            if ('success' in response.data && !('result' in response.data)) {
                response.data.result = response.data.success;
            }
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default api;
