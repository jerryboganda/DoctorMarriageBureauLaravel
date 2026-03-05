import { useAuthStore } from '@/stores/authStore';

export function usePermission(permission?: string) {
  const user = useAuthStore((s) => s.user);
  if (!permission) return true;
  if (!user) return false;
  return user.permissions.includes(permission);
}
