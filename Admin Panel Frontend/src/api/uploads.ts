import { adminApi } from './admin';

export const uploadsApi = {
  list: (params?: Record<string, unknown>) => adminApi.moduleList('/uploaded-files', params),
  info: (id: string | number) => adminApi.moduleGet(`/uploaded-files/${id}/info`),
  bulkDelete: (ids: number[]) => adminApi.moduleAction('/uploaded-files/bulk-delete', { ids }),
};
