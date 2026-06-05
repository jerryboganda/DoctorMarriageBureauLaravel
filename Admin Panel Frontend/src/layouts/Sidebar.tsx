import { Link, useLocation } from 'react-router-dom';
import { menuItems } from '@/utils/menu';
import PermissionGate from '@/components/common/PermissionGate';

export default function Sidebar() {
    const location = useLocation();

    return (
        <aside className="h-screen w-72 overflow-y-auto bg-admin-sidebar px-3 py-4">
            <div className="mb-4 px-2 text-lg font-semibold text-white">Doctor Marriage Bureau</div>
            <nav className="space-y-1">
                {menuItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <PermissionGate key={item.path} permission={item.permission}>
                            <Link
                                to={item.path}
                                className={`block rounded px-3 py-2 text-sm ${active ? 'bg-white text-admin-sidebar' : 'text-slate-100 hover:bg-white/10'}`}
                            >
                                {item.label}
                            </Link>
                        </PermissionGate>
                    );
                })}
            </nav>
        </aside>
    );
}
