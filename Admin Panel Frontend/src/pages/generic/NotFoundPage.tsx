import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="rounded-xl bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-800">Page not found</h2>
      <p className="mt-2 text-sm text-slate-500">The requested admin page does not exist.</p>
      <Link to="/admin-react/dashboard" className="mt-4 inline-block rounded bg-primary px-4 py-2 text-white">
        Go to Dashboard
      </Link>
    </div>
  );
}
