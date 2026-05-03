import { useState, useEffect } from 'react';
import { Folder, Plus, Pencil, Trash2, Play, History, RotateCcw, Shield } from 'lucide-react';
import { adminApi } from '@/api/admin';
import type { Category, ArchitectureVersion, Role } from '@/types';

export const ArchitectureEditor = () => {
  const [tree, setTree] = useState<Category[]>([]);
  const [versions, setVersions] = useState<ArchitectureVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [currentTree, versionList] = await Promise.all([
          adminApi.getCurrentArchitecture(),
          adminApi.getVersions(),
        ]);
        setTree(currentTree);
        setVersions(versionList);
      } catch {
        // will show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Architecture Editor</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <Plus className="h-4 w-4" /> Add Folder
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              <Play className="h-4 w-4" /> Activate
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          {tree.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No architecture configured yet. Run the setup wizard to get started.
            </p>
          ) : (
            <div className="space-y-1">
              {tree.map((cat) => (
                <ArchitectureNode key={cat.id} category={cat} depth={0} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Version history sidebar */}
      <div className="w-64">
        <button
          onClick={() => setShowVersions(!showVersions)}
          className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <History className="h-4 w-4" />
          Version History ({versions.length})
        </button>
        {showVersions && (
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">v{v.version}</span>
                  {v.isActive && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">Active</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {v.activatedAt ? new Date(v.activatedAt).toLocaleDateString() : 'Draft'}
                </p>
                {!v.isActive && (
                  <button className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400">
                    <RotateCcw className="h-3 w-3" /> Rollback
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ArchitectureNode = ({ category, depth }: { category: Category; depth: number }) => {
  const roleBadge: Record<Role, string> = {
    ADMIN: 'text-red-600',
    MOD: 'text-blue-600',
    MEMBER: 'text-gray-400',
  };

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <Folder className="h-4 w-4 shrink-0 text-blue-500" />
        <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{category.name}</span>

        {category.minimumRole !== 'MEMBER' && (
          <Shield className={`h-3.5 w-3.5 ${roleBadge[category.minimumRole]}`} />
        )}

        <div className="hidden gap-1 group-hover:flex">
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Rename">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-gray-400 hover:text-red-500" aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {category.children?.map((child) => (
        <ArchitectureNode key={child.id} category={child} depth={depth + 1} />
      ))}
    </div>
  );
};
