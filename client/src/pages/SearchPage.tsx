import { useState } from 'react';
import { searchApi } from '@/api/search';
import type { FileMeta } from '@/types';
import { SearchInput } from '@/components/search/SearchInput';
import { SearchResults } from '@/components/search/SearchResults';

export const SearchPage = () => {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [isAiAssisted, setIsAiAssisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string, semantic: boolean) => {
    setLoading(true);
    setSearched(true);
    try {
      if (semantic) {
        const result = await searchApi.semantic(query);
        setFiles(result.files);
        setTotal(result.total);
        setIsAiAssisted(true);
      } else {
        const result = await searchApi.search({ q: query });
        setFiles(result.files);
        setTotal(result.total);
        setIsAiAssisted(false);
      }
    } catch {
      setFiles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Search</h2>
      <div className="mb-6">
        <SearchInput onSearch={handleSearch} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
      ) : searched ? (
        <SearchResults files={files} total={total} isAiAssisted={isAiAssisted} />
      ) : null}
    </div>
  );
};
