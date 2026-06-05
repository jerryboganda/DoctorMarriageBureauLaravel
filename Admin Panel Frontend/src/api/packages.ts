import { adminApi } from './admin';

export const packagesApi = {
    list: (params?: Record<string, unknown>) => adminApi.moduleList('/packages', params),
    get: (id: string | number) => adminApi.moduleGet(`/packages/${id}`),
    create: (payload: Record<string, unknown>) => adminApi.moduleCreate('/packages', payload),
    update: (id: string | number, payload: Record<string, unknown>) =>
        adminApi.moduleUpdate(`/packages/${id}`, payload),
    delete: (id: string | number) => adminApi.moduleDelete(`/packages/${id}`),
};
