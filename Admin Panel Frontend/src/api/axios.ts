import axios from 'axios';

const configuredBaseUrl = `${import.meta.env.VITE_API_BASE_URL || ''}`.replace(/\/+$/, '');
const baseURL = configuredBaseUrl
    ? configuredBaseUrl.endsWith('/admin')
        ? configuredBaseUrl
        : `${configuredBaseUrl.replace(/\/api$/, '')}/api/admin`
    : '/api/admin';

export const api = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            localStorage.removeItem('admin_auth_token');
            if (window.location.pathname !== '/admin-panel/login') {
                window.location.href = '/admin-panel/login';
            }
        }
        return Promise.reject(error);
    },
);
