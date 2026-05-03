import { Link } from 'react-router-dom';
import type { FileMeta } from '@/types';
import { formatFileSize, formatDate, getFileIcon } from '@/lib/fileUtils';

interface SearchResultsProps {
  files: FileMeta[];
  total: number;
  isAiAssisted?: boolean;
}

export const SearchResults = ({ files, total, isAiAssisted }: SearchResultsProps) => {
  if (files.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        No results found
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total} result{total !== 1 ? 's' : ''}
        </p>
        {isAiAssisted && (
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            AI-assisted
          </span>
        )}
      </div>

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
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.sizeBytes)} · {formatDate(file.uploadedAt)}
                </p>
              </div>
              {file.tags && file.tags.length > 0 && (
                <div className="hidden gap-1 sm:flex">
                  {file.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
