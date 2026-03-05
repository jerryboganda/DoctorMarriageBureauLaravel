import { api } from './axios';

const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
};

export const adminApi = {
  login: (payload: { email: string; password: string }) => api.post('/login', payload),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  dashboardStats: () => api.get('/dashboard/stats'),
  moduleList: (path: string, params?: Record<string, unknown>) => api.get(path, { params }),
  moduleGet: (path: string) => api.get(path),
  moduleCreate: (path: string, payload: Record<string, unknown> | FormData) =>
    payload instanceof FormData ? api.post(path, payload, multipartConfig) : api.post(path, payload),
  moduleUpdate: (path: string, payload: Record<string, unknown> | FormData) =>
    payload instanceof FormData ? api.put(path, payload, multipartConfig) : api.put(path, payload),
  moduleDelete: (path: string) => api.delete(path),
  moduleAction: (path: string, payload?: Record<string, unknown> | FormData) =>
    payload instanceof FormData ? api.post(path, payload, multipartConfig) : api.post(path, payload || {}),
};
