import { adminApi } from './admin';

export const membersApi = {
  list: (params?: Record<string, unknown>) => adminApi.moduleList('/members', params),
  get: (id: string | number) => adminApi.moduleGet(`/members/${id}`),
  create: (payload: Record<string, unknown>) => adminApi.moduleCreate('/members', payload),
  update: (id: string | number, payload: Record<string, unknown>) => adminApi.moduleUpdate(`/members/${id}`, payload),
  delete: (id: string | number) => adminApi.moduleDelete(`/members/${id}`),
};
