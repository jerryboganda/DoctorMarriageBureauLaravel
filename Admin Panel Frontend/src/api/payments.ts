import { adminApi } from './admin';

export const paymentsApi = {
    list: (params?: Record<string, unknown>) => adminApi.moduleList('/package-payments', params),
    get: (id: string | number) => adminApi.moduleGet(`/package-payments/${id}`),
    acceptManual: (id: string | number) =>
        adminApi.moduleAction(`/package-payments/${id}/accept-manual`),
    invoice: (id: string | number) => adminApi.moduleGet(`/package-payments/${id}/invoice`),
};
