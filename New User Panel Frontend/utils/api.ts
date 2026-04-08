import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL;
let secureUrl = envUrl || '/api';

if (secureUrl.startsWith('http') && !secureUrl.endsWith('/api')) {
  secureUrl = secureUrl.replace(/\/$/, '') + '/api';
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || secureUrl,
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

  // Send selected language to backend (read by AppLanguage middleware)
  const lang = localStorage.getItem('lang') || 'en';
  config.headers['App-Language'] = lang;

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
