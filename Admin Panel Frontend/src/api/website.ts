import { adminApi } from './admin';

export const websiteApi = {
  header: () => adminApi.moduleGet('/website/header'),
  footer: () => adminApi.moduleGet('/website/footer'),
  appearances: () => adminApi.moduleGet('/website/appearances'),
};
