import { adminApi } from './admin';

export const blogApi = {
  list: (params?: Record<string, unknown>) => adminApi.moduleList('/blogs', params),
  categories: (params?: Record<string, unknown>) => adminApi.moduleList('/blog-categories', params),
};
