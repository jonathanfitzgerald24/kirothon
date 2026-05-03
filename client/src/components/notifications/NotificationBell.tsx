import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { notificationsApi } from '@/api/notifications';
import type { Notification } from '@/types';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    notificationsApi.getAll().then(setNotifications).catch(() => {});

    // SSE for real-time notifications
    const es = new EventSource(notificationsApi.streamUrl(), { withCredentials: true });
    es.onmessage = (event) => {
      try {
        const notif = JSON.parse(event.data) as Notification;
        setNotifications((prev) => [notif, ...prev]);
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleDismiss = async (id: string) => {
    await notificationsApi.dismiss(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationCenter
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
};
