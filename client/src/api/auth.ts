import type { User } from '@/types';
import { apiGet, apiPost } from './client';

export interface RegisterPayload {
  email: string;
  password: string;
  clubName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<User> => {
    const res = await apiPost<{ user: User }>('/auth/register', payload);
    return res.user;
  },

  login: async (payload: LoginPayload): Promise<User> => {
    const res = await apiPost<{ user: User }>('/auth/login', payload);
    return res.user;
  },

  logout: () =>
    apiPost<void>('/auth/logout'),

  me: async (): Promise<User> => {
    const res = await apiGet<{ user: User }>('/auth/me');
    return res.user;
  },

  googleAuthUrl: () => `/api/v1/auth/google`,
};
