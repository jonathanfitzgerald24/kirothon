import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Search, FolderTree as FolderTreeIcon, Star, Zap, Upload, Folder } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { DemoBanner } from './DemoBanner';
import { NotificationBell } from './notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import type { Category } from '@/types';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/v1/portal/tree', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const tree = data.tree || data || [];
        setCategories(Array.isArray(tree) ? tree : []);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Build tree from flat list
  const rootCategories = categories.filter((c) => !c.parentId);
  const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-950">
      <DemoBanner />

      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-lg font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
            IntakeFlow
          </Link>
        </div>

        <form onSubmit={handleSearch} className="flex flex-1 items-center justify-center px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files and folders..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              aria-label="Search files and folders"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Link
            to="/upload"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="mb-4">
              <h2 className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <FolderTreeIcon className="h-3.5 w-3.5" />
                Folders
              </h2>
              {rootCategories.length === 0 ? (
                <p className="px-2 text-xs text-gray-400 dark:text-gray-500">
                  No folders yet — upload files or connect Drive
                </p>
              ) : (
                <div className="space-y-0.5">
                  {rootCategories.map((cat) => (
                    <SidebarFolder key={cat.id} category={cat} getChildren={getChildren} depth={0} />
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <h2 className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Zap className="h-3.5 w-3.5" />
                Quick Access
              </h2>
              <p className="px-2 text-xs text-gray-400 dark:text-gray-500">
                No pinned files yet
              </p>
            </div>

            <div>
              <h2 className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Star className="h-3.5 w-3.5" />
                Favorites
              </h2>
              <p className="px-2 text-xs text-gray-400 dark:text-gray-500">
                No favorites yet
              </p>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Simple sidebar folder component
const SidebarFolder = ({ category, getChildren, depth }: { category: Category; getChildren: (id: string) => Category[]; depth: number }) => {
  const [expanded, setExpanded] = useState(depth === 0);
  const navigate = useNavigate();
  const children = getChildren(category.id);

  return (
    <div>
      <button
        onClick={() => navigate(`/portal/folder/${category.id}`)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {children.length > 0 && (
          <span
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="shrink-0 text-gray-400"
          >
            {expanded ? '▾' : '▸'}
          </span>
        )}
        <Folder className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="truncate">{category.name}</span>
      </button>
      {expanded && children.map((child) => (
        <SidebarFolder key={child.id} category={child} getChildren={getChildren} depth={depth + 1} />
      ))}
    </div>
  );
};
