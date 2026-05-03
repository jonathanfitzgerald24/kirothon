import { Link } from 'react-router-dom';
import type { FileMeta } from '@/types';
import { formatFileSize, getFileIcon } from '@/lib/fileUtils';

interface TimelineGroup {
  month: string;
  files: FileMeta[];
}

interface TimelineViewProps {
  groups: TimelineGroup[];
}

export const TimelineView = ({ groups }: TimelineViewProps) => {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <p className="text-sm">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.month}>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {group.month}
          </h3>
          <div className="space-y-1">
            {group.files.map((file) => {
              const FileIcon = getFileIcon(file.mimeType);
              return (
                <Link
                  key={file.id}
                  to={`/portal/file/${file.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <FileIcon className="h-5 w-5 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.sizeBytes)}
                      {file.uploader && ` · ${file.uploader.displayName}`}
                    </p>
                  </div>
                  {file.tags && file.tags.length > 0 && (
                    <div className="hidden gap-1 sm:flex">
                      {file.tags.slice(0, 2).map((tag) => (
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
      ))}
    </div>
  );
};
