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
  register: (payload: RegisterPayload) =>
    apiPost<User>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    apiPost<User>('/auth/login', payload),

  logout: () =>
    apiPost<void>('/auth/logout'),

  me: () =>
    apiGet<User>('/auth/me'),

  googleAuthUrl: () => `/api/v1/auth/google`,
};
