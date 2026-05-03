import type { Notification } from '@/types';
import { apiGet, apiPut, apiDelete } from './client';

export const notificationsApi = {
  getAll: () => apiGet<Notification[]>('/notifications'),

  markRead: (id: string) => apiPut<void>(`/notifications/${id}/read`),

  dismiss: (id: string) => apiDelete<void>(`/notifications/${id}`),

  streamUrl: () => `/api/v1/notifications/stream`,
};

export const activityApi = {
  getFeed: () =>
    apiGet<Array<{ id: string; action: string; user: string; resource: string; timestamp: string }>>('/activity/feed'),

  streamUrl: () => `/api/v1/activity/stream`,
};
