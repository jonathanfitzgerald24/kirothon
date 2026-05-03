import { useState, useEffect } from 'react';
import { Files, Upload, Users, AlertCircle } from 'lucide-react';
import { apiGet } from '@/api/client';

interface DashboardMetrics {
  totalFiles: number;
  uploadsLast30Days: number;
  topUploaders: Array<{ name: string; count: number }>;
  unresolvedItems: number;
}

export const ClubActivityDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DashboardMetrics>('/dashboard/admin')
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  if (!metrics) return null;

  const cards = [
    { label: 'Total Files', value: metrics.totalFiles, icon: Files, show: metrics.totalFiles > 0 },
    { label: 'Uploads (30d)', value: metrics.uploadsLast30Days, icon: Upload, show: metrics.uploadsLast30Days > 0 },
    { label: 'Unresolved', value: metrics.unresolvedItems, icon: AlertCircle, show: metrics.unresolvedItems > 0 },
  ].filter((c) => c.show);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Club Activity</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <card.icon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{card.label}</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{card.value}</p>
          </div>
        ))}
      </div>

      {metrics.topUploaders.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Top Uploaders</h4>
          <div className="space-y-1">
            {metrics.topUploaders.map((u) => (
              <div key={u.name} className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">{u.name}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">{u.count} files</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
