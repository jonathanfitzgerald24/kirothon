import type { RoutingResult, PaginatedResponse, FileMeta } from '@/types';
import { apiGet, apiPost, apiUpload } from './client';

export const uploadApi = {
  single: (file: File, uploadNote?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (uploadNote) formData.append('uploadNote', uploadNote);
    return apiUpload<RoutingResult>('/upload/single', formData);
  },

  batch: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiUpload<RoutingResult[]>('/upload/batch', formData);
  },

  dropToFolder: (categoryId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload<RoutingResult>(`/upload/drop/${categoryId}`, formData);
  },

  confirmRoute: (fileId: string, categoryId: string) =>
    apiPost<void>(`/upload/route/${fileId}/confirm`, { categoryId }),

  acceptNewCategory: (fileId: string) =>
    apiPost<void>(`/upload/route/${fileId}/new-category`),

  getHistory: (page = 1, pageSize = 20) =>
    apiGet<PaginatedResponse<FileMeta>>(`/upload/history?page=${page}&pageSize=${pageSize}`),
};
