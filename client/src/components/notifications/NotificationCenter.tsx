import { Check, X, FileText, FolderPlus, Shield, AlertTriangle, Bell } from 'lucide-react';
import type { Notification } from '@/types';
import { formatDate } from '@/lib/fileUtils';

const TYPE_ICONS: Record<string, typeof Bell> = {
  FILE_REQUEST: FileText,
  CATEGORY_APPROVAL: FolderPlus,
  DRIFT_ALERT: AlertTriangle,
  ACCESS_REQUEST: Shield,
  FILE_ADDED: FileText,
};

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const NotificationCenter = ({ notifications, onMarkRead, onDismiss }: NotificationCenterProps) => {
  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No notifications</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] || Bell;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-3 border-b border-gray-50 px-4 py-3 dark:border-gray-800 ${
                  !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                }`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{notif.title}</p>
                  {notif.body && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{notif.body}</p>
                  )}
                  <p className="mt-1 text-[10px] text-gray-400">{formatDate(notif.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  {!notif.isRead && (
                    <button
                      onClick={() => onMarkRead(notif.id)}
                      className="rounded p-1 text-gray-400 hover:text-blue-500"
                      aria-label="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDismiss(notif.id)}
                    className="rounded p-1 text-gray-400 hover:text-red-500"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
