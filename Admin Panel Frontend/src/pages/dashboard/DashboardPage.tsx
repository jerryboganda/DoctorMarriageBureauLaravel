import { useEffect, useState } from 'react';
import { adminApi } from '@/api/admin';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await adminApi.dashboardStats();
        setStats(res.data?.data || null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  const cards = [
    { label: 'Total Members', value: stats?.member_stats?.total ?? 0 },
    { label: 'Premium Members', value: stats?.member_stats?.premium ?? 0 },
    { label: 'Free Members', value: stats?.member_stats?.free ?? 0 },
    { label: 'Blocked Members', value: stats?.member_stats?.blocked ?? 0 },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Earnings Summary</h3>
          <div className="space-y-1 text-sm text-slate-600">
            <div>Total: {stats?.earnings?.currency_symbol || ''} {stats?.earnings?.total || 0}</div>
            <div>Last Month: {stats?.earnings?.currency_symbol || ''} {stats?.earnings?.last_month || 0}</div>
            <div>Last 6 Months: {stats?.earnings?.currency_symbol || ''} {stats?.earnings?.last_6_months || 0}</div>
            <div>Last 12 Months: {stats?.earnings?.currency_symbol || ''} {stats?.earnings?.last_12_months || 0}</div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Happy Stories</h3>
          <div className="space-y-1 text-sm text-slate-600">
            <div>Total: {stats?.happy_stories?.total || 0}</div>
            <div>Approved: {stats?.happy_stories?.approved || 0}</div>
            <div>Pending: {stats?.happy_stories?.pending || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
