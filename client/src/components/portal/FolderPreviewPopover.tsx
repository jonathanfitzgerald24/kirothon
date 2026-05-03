import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { portalApi } from '@/api/portal';
import type { FolderHover } from '@/api/portal';

interface FolderPreviewPopoverProps {
  categoryId: string;
}

export const FolderPreviewPopover = ({ categoryId }: FolderPreviewPopoverProps) => {
  const [data, setData] = useState<FolderHover | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const result = await portalApi.getFolderHover(categoryId);
        setData(result);
        setVisible(true);
      } catch {
        // silently fail — popover is non-critical
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [categoryId]);

  if (!visible || !data) return null;

  return (
    <div className="absolute left-full top-0 z-50 ml-2 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {data.totalCount} file{data.totalCount !== 1 ? 's' : ''}
      </p>
      {data.recentFiles.length > 0 ? (
        <ul className="space-y-1">
          {data.recentFiles.map((file) => (
            <li key={file.id} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              <FileText className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="truncate">{file.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400">No files yet</p>
      )}
    </div>
  );
};
