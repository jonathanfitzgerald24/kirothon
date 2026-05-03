import { useState, useEffect } from 'react';
import { Cloud, CloudOff, AlertTriangle, Check, X } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { formatDate } from '@/lib/fileUtils';

interface DriftItem {
  id: string;
  changeType: string;
  drivePath: string;
  createdAt: string;
}

export const DriveSyncPanel = () => {
  const [status, setStatus] = useState<{ connected: boolean; lastSyncAt: string | null; driftCount: number } | null>(null);
  const [driftItems, setDriftItems] = useState<DriftItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [driveStatus, drift] = await Promise.all([
          adminApi.getDriveStatus(),
          adminApi.getDriftItems(),
        ]);
        setStatus(driveStatus);
        setDriftItems(drift);
      } catch {
        // will show disconnected state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleResolve = async (id: string, resolution: 'ACCEPTED' | 'IGNORED') => {
    try {
      await adminApi.resolveDrift(id, resolution);
      setDriftItems((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // error handling
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Google Drive Sync</h2>

      {/* Status card */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          {status?.connected ? (
            <Cloud className="h-6 w-6 text-green-500" />
          ) : (
            <CloudOff className="h-6 w-6 text-gray-400" />
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {status?.connected ? 'Connected' : 'Not Connected'}
            </p>
            {status?.lastSyncAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last synced {formatDate(status.lastSyncAt)}
              </p>
            )}
          </div>
          {status?.connected && status.driftCount > 0 && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {status.driftCount} unresolved
            </span>
          )}
        </div>
      </div>

      {/* Drift items */}
      {driftItems.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
            Structural Changes Detected
          </h3>
          <div className="space-y-2">
            {driftItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                <div>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{item.drivePath}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.changeType.replace('_', ' ').toLowerCase()} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleResolve(item.id, 'ACCEPTED')}
                    className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    aria-label="Accept change"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleResolve(item.id, 'IGNORED')}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    aria-label="Ignore change"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
