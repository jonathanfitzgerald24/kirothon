import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Folder, FolderOpen, ChevronRight, FileText } from 'lucide-react';
import type { Category } from '@/types';

export const BrowseFilesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/portal/tree', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setCategories(data.tree || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const roots = categories.filter((c) => !c.parentId);
  const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">Browse Files</h2>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Your complete folder structure — click any folder to view its contents
      </p>

      {roots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
          <Folder className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No folders yet</p>
          <p className="mt-1 text-xs text-gray-400">Upload files or use AI Architecture to create your folder structure</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roots.map((folder) => {
            const children = getChildren(folder.id);
            const fileCount = categories.filter((c) => c.parentId === folder.id).length;
            return (
              <Link
                key={folder.id}
                to={`/portal/folder/${folder.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{folder.name}</h3>
                    {folder.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{folder.description}</p>
                    )}
                  </div>
                </div>

                {children.length > 0 && (
                  <div className="space-y-1 border-t border-gray-100 pt-3 dark:border-gray-800">
                    {children.slice(0, 3).map((child) => (
                      <div key={child.id} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Folder className="h-3 w-3 text-gray-400" />
                        <span>{child.name}</span>
                      </div>
                    ))}
                    {children.length > 3 && (
                      <p className="text-xs text-gray-400">+{children.length - 3} more</p>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>{children.length} subfolder{children.length !== 1 ? 's' : ''}</span>
                  <ChevronRight className="h-4 w-4 group-hover:text-blue-500" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
