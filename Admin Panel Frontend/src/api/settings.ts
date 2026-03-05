import { adminApi } from './admin';

export const settingsApi = {
  general: () => adminApi.moduleGet('/settings/general'),
  smtp: () => adminApi.moduleGet('/settings/smtp'),
  paymentMethods: () => adminApi.moduleGet('/settings/payment-methods'),
  thirdParty: () => adminApi.moduleGet('/settings/third-party'),
};
