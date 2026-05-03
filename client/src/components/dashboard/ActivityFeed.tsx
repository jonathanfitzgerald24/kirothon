import { useState, useEffect, useRef } from 'react';
import { Upload, FolderPlus, UserPlus, LogIn, RotateCcw, FileText } from 'lucide-react';
import { activityApi } from '@/api/notifications';
import { formatDate } from '@/lib/fileUtils';

interface ActivityEntry {
  id: string;
  action: string;
  user: string;
  resource: string;
  timestamp: string;
}

const ACTION_ICONS: Record<string, typeof Upload> = {
  FILE_UPLOAD: Upload,
  FILE_PLACEMENT: FileText,
  CATEGORY_CREATE: FolderPlus,
  INVITE: UserPlus,
  LOGIN: LogIn,
  ROLLBACK: RotateCcw,
};

export const ActivityFeed = () => {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    activityApi
      .getFeed()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));

    // SSE for real-time updates
    const es = new EventSource(activityApi.streamUrl(), { withCredentials: true });
    es.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data) as ActivityEntry;
        setEntries((prev) => [entry, ...prev].slice(0, 20));
      } catch {
        // ignore parse errors
      }
    };
    eventSourceRef.current = es;

    return () => es.close();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">No recent activity</p>;
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const Icon = ACTION_ICONS[entry.action] || FileText;
        return (
          <div key={entry.id} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <span className="font-medium">{entry.user}</span>{' '}
                {entry.action.replace(/_/g, ' ').toLowerCase()}{' '}
                {entry.resource && <span className="text-gray-500">{entry.resource}</span>}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(entry.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
