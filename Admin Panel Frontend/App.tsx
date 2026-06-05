import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import BlankLayout from '@/layouts/BlankLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ModulePage from '@/pages/generic/ModulePage';
import { menuItems } from '@/utils/menu';

function RequireAuth({ children }: { children: JSX.Element }) {
    const loading = useAuthStore((s) => s.loading);
    const authenticated = useAuthStore((s) => s.authenticated);

    if (loading) return <LoadingSpinner />;
    if (!authenticated) return <Navigate to="/admin-react/login" replace />;
    return children;
}

export default function App() {
    const fetchMe = useAuthStore((s) => s.fetchMe);

    useEffect(() => {
        void fetchMe();
    }, [fetchMe]);

    return (
        <Routes>
            <Route
                path="/admin-react/login"
                element={
                    <BlankLayout>
                        <LoginPage />
                    </BlankLayout>
                }
            />

            <Route
                path="/admin-react"
                element={
                    <RequireAuth>
                        <AdminLayout />
                    </RequireAuth>
                }
            >
                <Route index element={<Navigate to="/admin-react/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                {menuItems
                    .filter((m) => m.path !== '/admin-react/dashboard')
                    .map((m) => (
                        <Route
                            key={m.path}
                            path={m.path.replace('/admin-react/', '')}
                            element={<ModulePage />}
                        />
                    ))}
                <Route path="*" element={<ModulePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/admin-react/login" replace />} />
        </Routes>
    );
}
