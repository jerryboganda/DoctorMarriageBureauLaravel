import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL;
let secureUrl = envUrl || '/api';

if (secureUrl.startsWith('http') && !secureUrl.endsWith('/api')) {
  secureUrl = secureUrl.replace(/\/$/, '') + '/api';
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || secureUrl,
  timeout: 20000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token and language header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Browser FormData must set its own multipart boundary. The axios instance
  // defaults to JSON, so remove Content-Type for file uploads.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  // Send selected language to backend (read by AppLanguage middleware)
  const lang = localStorage.getItem('lang') || 'en';
  config.headers['App-Language'] = lang;

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: auto-logout on deactivated/blocked account
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    const code = data?.code;
    if (code === 'ACCOUNT_DEACTIVATED' || code === 'ACCOUNT_BLOCKED' || data?.status === 'deactivated' || data?.status === 'blocked') {
      localStorage.removeItem('auth_token');
      const message = data?.message || 'Your account has been deactivated. Please contact support.';
      // Redirect to login with error message
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_error', message);
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
