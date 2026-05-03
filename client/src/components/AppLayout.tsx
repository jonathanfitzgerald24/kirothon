import { Outlet, Link } from 'react-router-dom';
import { Search, FolderTree, Star, Zap } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { DemoBanner } from './DemoBanner';
import { NotificationBell } from './notifications/NotificationBell';

export const AppLayout = () => {
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

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files and folders..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              aria-label="Search files and folders"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                <FolderTree className="h-3.5 w-3.5" />
                Folders
              </h2>
              <p className="px-2 text-xs text-gray-400 dark:text-gray-500">
                Connect Google Drive to see folders
              </p>
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
