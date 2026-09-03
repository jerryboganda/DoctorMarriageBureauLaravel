import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

const configuredApiUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_API_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  '';

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const browserOrigin = () =>
  typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';

export const resolveApiBaseUrl = (value = configuredApiUrl): string => {
  const configured = `${value || ''}`.trim();
  if (!configured) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8080/api/v1';
    }
    return '/api/v1';
  }

  const normalized = withoutTrailingSlash(configured);
  if (normalized.endsWith('/api/v1')) return normalized;
  return normalized.endsWith('/api') ? `${normalized}/v1` : `${normalized}/api/v1`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const ASSET_BASE_URL = (() => {
  const configured = `${configuredApiUrl || ''}`.trim();
  if (configured) {
    return withoutTrailingSlash(resolveApiBaseUrl(configured).replace(/\/api\/v1$/, ''));
  }
  return browserOrigin();
})();

const assetPath = (path: string) => `${ASSET_BASE_URL}${path}`;

export const DEFAULT_AVATAR_URL = assetPath('/assets/img/avatar-place.png');
export const DEFAULT_FEMALE_AVATAR_URL = assetPath('/assets/img/female-avatar-place.png');

export const resolveAssetUrl = (
  value?: string | null,
  fallback: string = DEFAULT_AVATAR_URL,
): string => {
  const candidate = `${value ?? ''}`.trim();
  if (!candidate || /^\d+$/.test(candidate)) return fallback;
  if (candidate.includes('/public/uploads/')) {
    return resolveAssetUrl(candidate.replace('/public/uploads/', '/uploads/'), fallback);
  }
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
  if (candidate.startsWith('//')) return `https:${candidate}`;
  if (candidate.startsWith('/'))
    return ASSET_BASE_URL ? `${ASSET_BASE_URL}${candidate}` : candidate;

  return ASSET_BASE_URL
    ? `${ASSET_BASE_URL}/${candidate.replace(/^\/+/, '')}`
    : `/${candidate.replace(/^\/+/, '')}`;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject Bearer token and language headers
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // FormData multipart boundary handling
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }

      // Pass selected language
      const lang = localStorage.getItem('lang') || 'en';
      config.headers['App-Language'] = lang;
      config.headers['Accept-Language'] = lang === 'ur' ? 'ur,en;q=0.9' : 'en,ur;q=0.9';
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Pure API-driven — no mock fallback. Surface real errors.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const code = data?.code;

    if (
      status === 401 ||
      code === 'ACCOUNT_DEACTIVATED' ||
      code === 'ACCOUNT_BLOCKED' ||
      data?.status === 'deactivated' ||
      data?.status === 'blocked'
    ) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        const message =
          data?.message ||
          (status === 401
            ? 'Your session has expired. Please sign in again.'
            : 'Your account has been deactivated. Please contact support.');
        sessionStorage.setItem('auth_error', message);
        const currentPath = window.location.pathname;
        if (!['/', '/login', '/register', '/forgot-password'].includes(currentPath)) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export const api = apiClient;
export default apiClient;
