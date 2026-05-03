import type { FileMeta } from '@/types';
import { apiGet } from './client';

export interface SearchParams {
  q: string;
  type?: string;
  folder?: string;
  dateFrom?: string;
  dateTo?: string;
  uploader?: string;
  tag?: string;
}

export interface SearchResult {
  files: FileMeta[];
  total: number;
}

export const searchApi = {
  search: (params: SearchParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    return apiGet<SearchResult>(`/search?${searchParams.toString()}`);
  },

  semantic: (q: string) =>
    apiGet<SearchResult>(`/search/semantic?q=${encodeURIComponent(q)}`),
};
