import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-admin-bg">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
