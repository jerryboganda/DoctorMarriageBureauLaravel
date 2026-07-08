import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { menuItems } from '@/utils/menu';

const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const BlankLayout = lazy(() => import('@/layouts/BlankLayout'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ModulePage = lazy(() => import('@/pages/generic/ModulePage'));

function RequireAuth({ children }: { children: JSX.Element }) {
    const loading = useAuthStore((s) => s.loading);
    const authenticated = useAuthStore((s) => s.authenticated);

    if (loading) return <LoadingSpinner />;
    if (!authenticated) return <Navigate to="/admin-panel/login" replace />;
    return children;
}

export default function App() {
    const fetchMe = useAuthStore((s) => s.fetchMe);

    useEffect(() => {
        void fetchMe();
    }, [fetchMe]);

    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route
                    path="/admin-panel/login"
                    element={
                        <BlankLayout>
                            <LoginPage />
                        </BlankLayout>
                    }
                />

                <Route
                    path="/admin-panel"
                    element={
                        <RequireAuth>
                            <AdminLayout />
                        </RequireAuth>
                    }
                >
                    <Route index element={<Navigate to="/admin-panel/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    {menuItems
                        .filter((m) => m.path !== '/admin-panel/dashboard')
                        .map((m) => (
                            <Route
                                key={m.path}
                                path={m.path.replace('/admin-panel/', '')}
                                element={<ModulePage />}
                            />
                        ))}
                    <Route path="*" element={<ModulePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/admin-panel/login" replace />} />
            </Routes>
        </Suspense>
    );
}
