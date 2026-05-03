import type { Category, FileMeta } from '@/types';
import { apiGet } from './client';

export interface FolderContents {
  folder: { id: string; name: string; description: string | null; lastUpdatedAt: string };
  ancestors: Array<{ id: string; name: string }>;
  subfolders: Array<{ id: string; name: string; lastUpdatedAt: string; isNew?: boolean }>;
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: string;
    uploadedAt: string;
    driveLastModified: string | null;
    uploader: string | null;
    tags: string[];
    isNew?: boolean;
  }>;
}

export interface FolderHover {
  recentFiles: Array<{ id: string; name: string; mimeType: string; driveLastModified: string | null }>;
  totalCount: number;
}

export interface TimelineGroup {
  month: string;
  files: FileMeta[];
}

export const portalApi = {
  getTree: async () => {
    const res = await apiGet<{ tree: Category[] }>('/portal/tree');
    return res.tree;
  },

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

  getTimeline: (params?: { folder?: string; tag?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.folder) searchParams.set('folder', params.folder);
    if (params?.tag) searchParams.set('tag', params.tag);
    const qs = searchParams.toString();
    return apiGet<{ timeline: TimelineGroup[] }>(`/portal/timeline${qs ? `?${qs}` : ''}`);
  },
};
