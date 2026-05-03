import { useState, useEffect } from 'react';
import { adminApi } from '@/api/admin';
import type { AuditLogEntry } from '@/types';
import { formatDate } from '@/lib/fileUtils';

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Login',
  INVITE: 'Invitation',
  ROLE_CHANGE: 'Role Change',
  FILE_UPLOAD: 'File Upload',
  FILE_PLACEMENT: 'File Placement',
  CATEGORY_CREATE: 'Folder Created',
  CATEGORY_RENAME: 'Folder Renamed',
  CATEGORY_DELETE: 'Folder Deleted',
  ARCHITECTURE_ACTIVATE: 'Architecture Activated',
  ROLLBACK: 'Rollback',
};

export const AuditLogView = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getAuditLogs({ action: actionFilter || undefined, page })
      .then((res) => { setLogs(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Audit Log</h2>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          aria-label="Filter by action"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Time</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Action</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{log.user?.displayName ?? 'System'}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{log.resourceId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 20 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
