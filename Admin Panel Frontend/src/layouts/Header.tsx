import { useAuthStore } from '@/stores/authStore';
import { adminApi } from '@/api/admin';

export default function Header() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const clearCache = async () => {
        try {
            await adminApi.moduleAction('/cache/clear');
            window.alert('Application cache cleared successfully.');
        } catch (error: any) {
            window.alert(error?.response?.data?.message || 'Failed to clear cache.');
        }
    };

    return (
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
            <h1 className="text-base font-semibold text-slate-800">DMB Admin Panel</h1>
            <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600">{user?.name || 'Admin'}</div>
                <button
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => void clearCache()}
                >
                    Clear Cache
                </button>
                <button
                    className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
                    onClick={() => void logout()}
                >
                    Logout
                </button>
            </div>
        </header>
    );
}
