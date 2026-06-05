import { adminApi } from './admin';

export const referralApi = {
    dashboard: () => adminApi.moduleGet('/referral/dashboard'),
    settings: () => adminApi.moduleGet('/referral/settings'),
    rules: (params?: Record<string, unknown>) => adminApi.moduleList('/referral/rules', params),
    referrals: (params?: Record<string, unknown>) =>
        adminApi.moduleList('/referral/referrals', params),
    rewards: (params?: Record<string, unknown>) => adminApi.moduleList('/referral/rewards', params),
};
