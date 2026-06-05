import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate('/admin-react/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-1 text-2xl font-semibold text-slate-800">Admin Login</h2>
                <p className="mb-6 text-sm text-slate-500">Sign in to access the admin panel.</p>

                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mb-4 w-full rounded border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
                    required
                />

                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mb-4 w-full rounded border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
                    required
                />

                {error && (
                    <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-70"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
        </div>
    );
}
