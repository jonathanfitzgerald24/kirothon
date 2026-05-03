import { Link } from 'react-router-dom';
import { Folder } from 'lucide-react';
import type { Category, FileMeta } from '@/types';
import { formatFileSize, formatDate, getFileIcon } from '@/lib/fileUtils';

interface FolderViewProps {
  subfolders: Category[];
  files: FileMeta[];
}

export const FolderView = ({ subfolders, files }: FolderViewProps) => {
  if (subfolders.length === 0 && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <Folder className="mb-3 h-12 w-12" />
        <p className="text-sm">This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="hidden px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400 sm:table-cell">Type</th>
            <th className="hidden px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400 md:table-cell">Size</th>
            <th className="hidden px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400 lg:table-cell">Uploaded by</th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Modified</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {subfolders.map((folder) => (
            <tr key={folder.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
              <td className="px-4 py-2.5">
                <Link
                  to={`/portal/folder/${folder.id}`}
                  className="flex items-center gap-2 text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                >
                  <Folder className="h-4 w-4 shrink-0 text-blue-500" />
                  <span className="truncate">{folder.name}</span>
                  {folder.isNew && (
                    <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      New
                    </span>
                  )}
                </Link>
              </td>
              <td className="hidden px-4 py-2.5 text-gray-500 dark:text-gray-400 sm:table-cell">Folder</td>
              <td className="hidden px-4 py-2.5 text-gray-500 dark:text-gray-400 md:table-cell">—</td>
              <td className="hidden px-4 py-2.5 text-gray-500 dark:text-gray-400 lg:table-cell">—</td>
              <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                {formatDate(folder.lastUpdatedAt)}
              </td>
            </tr>
          ))}

          {files.map((file) => {
            const FileIcon = getFileIcon(file.mimeType);
            return (
              <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-4 py-2.5">
                  <Link
                    to={`/portal/file/${file.id}`}
                    className="flex items-center gap-2 text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                  >
                    <FileIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate">{file.name}</span>
                    {file.isNew && (
                      <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                        New
                      </span>
                    )}
                  </Link>
                </td>
                <td className="hidden px-4 py-2.5 text-gray-500 dark:text-gray-400 sm:table-cell">
                  {file.mimeType.split('/').pop()?.toUpperCase() ?? '—'}
                </td>
                <td className="hidden px-4 py-2.5 text-gray-500 dark:text-gray-400 md:table-cell">
                  {formatFileSize(file.sizeBytes)}
                </td>
                <td className="hidden px-4 py-2.5 text-gray-500 dark:text-gray-400 lg:table-cell">
                  {file.uploader?.displayName ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                  {formatDate(file.uploadedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
