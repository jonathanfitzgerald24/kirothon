import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { uploadApi } from '@/api/upload';
import type { FileMeta } from '@/types';
import { formatDate, getFileIcon } from '@/lib/fileUtils';

export const UploadHistoryPage = () => {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    uploadApi
      .getHistory(page)
      .then((res) => { setFiles(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Upload History</h2>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
      ) : files.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No uploads yet</p>
      ) : (
        <>
          <div className="space-y-1">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.mimeType);
              return (
                <Link
                  key={file.id}
                  to={`/portal/file/${file.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <FileIcon className="h-5 w-5 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(file.uploadedAt)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    file.placementStatus === 'PLACED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : file.placementStatus === 'PENDING'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {file.placementStatus}
                  </span>
                </Link>
              );
            })}
          </div>

          {total > 20 && (
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700">Previous</button>
              <span className="px-3 py-1.5 text-sm text-gray-500">Page {page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
