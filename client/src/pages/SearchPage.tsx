import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchApi } from '@/api/search';
import { FileText } from 'lucide-react';

interface SearchFile {
  id: string;
  name: string;
  mimeType: string;
  category?: { id: string; name: string } | null;
  tags?: Array<{ id: string; name: string }>;
  uploadedAt: string;
  aiSummary?: string | null;
}

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [files, setFiles] = useState<SearchFile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) return;
    setLoading(true);
    searchApi
      .search({ q: query })
      .then((result) => {
        setFiles(result.files as unknown as SearchFile[]);
        setTotal(result.total);
      })
      .catch(() => {
        setFiles([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Search Results
      </h2>
      {query && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : files.length === 0 && query ? (
        <div className="py-12 text-center text-sm text-gray-400">
          No files found matching "{query}"
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Link
              key={file.id}
              to={`/portal/file/${file.id}`}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {file.category && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">{file.category.name}</span>
                  )}
                  <span>{file.mimeType.split('/').pop()?.toUpperCase()}</span>
                  <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                </div>
                {file.tags && file.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {file.tags.map((tag) => (
                      <span key={tag.id || tag.name} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                {file.aiSummary && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{file.aiSummary}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
