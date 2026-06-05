import { adminApi } from './admin';

export const walletApi = {
    transactions: (params?: Record<string, unknown>) =>
        adminApi.moduleList('/wallet/transactions', params),
    manualRequests: (params?: Record<string, unknown>) =>
        adminApi.moduleList('/wallet/manual-requests', params),
    paymentDetail: (id: string | number) => adminApi.moduleGet(`/wallet/payment/${id}`),
    acceptManual: (id: string | number) => adminApi.moduleAction(`/wallet/manual-accept/${id}`),
};
