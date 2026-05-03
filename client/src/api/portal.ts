import type { Category, FileMeta, PaginatedResponse } from '@/types';
import { apiGet } from './client';

export interface FolderContents {
  category: Category;
  ancestors: Array<{ id: string; name: string }>;
  subfolders: Category[];
  files: FileMeta[];
}

export interface FolderHover {
  recentFiles: Array<{ id: string; name: string; mimeType: string; uploadedAt: string }>;
  totalCount: number;
}

export interface TimelineGroup {
  month: string;
  files: FileMeta[];
}

export const portalApi = {
  getTree: () =>
    apiGet<Category[]>('/portal/tree'),

  getFolder: (categoryId: string) =>
    apiGet<FolderContents>(`/portal/folder/${categoryId}`),

  getFile: (fileId: string) =>
    apiGet<FileMeta>(`/portal/file/${fileId}`),

  getFilePreviewUrl: (fileId: string) =>
    `/api/v1/portal/file/${fileId}/preview`,

  getFileDownloadUrl: (fileId: string) =>
    `/api/v1/portal/file/${fileId}/download`,

  getFolderHover: (categoryId: string) =>
    apiGet<FolderHover>(`/portal/folder/${categoryId}/hover`),

  getTimeline: (params?: { folder?: string; tag?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.folder) searchParams.set('folder', params.folder);
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.page) searchParams.set('page', String(params.page));
    const qs = searchParams.toString();
    return apiGet<PaginatedResponse<TimelineGroup>>(`/portal/timeline${qs ? `?${qs}` : ''}`);
  },

  getSimilarFiles: (fileId: string) =>
    apiGet<FileMeta[]>(`/portal/file/${fileId}/similar`),
};
