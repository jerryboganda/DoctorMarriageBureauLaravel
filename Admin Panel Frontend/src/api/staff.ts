import { adminApi } from './admin';

export const staffApi = {
  staffs: (params?: Record<string, unknown>) => adminApi.moduleList('/staffs', params),
  roles: (params?: Record<string, unknown>) => adminApi.moduleList('/roles', params),
};
