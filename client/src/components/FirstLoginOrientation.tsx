import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const FirstLoginOrientation = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user && !user.firstLoginComplete) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 20_000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50" onClick={() => setVisible(false)}>
      <div className="absolute left-64 top-14 m-4 max-w-sm rounded-xl border border-blue-200 bg-white p-5 shadow-xl dark:border-blue-800 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          aria-label="Close orientation"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
          Welcome to FileAtlas
        </h3>

        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">1</span>
            <p><span className="font-medium text-gray-900 dark:text-gray-100">Folder tree</span> — Browse your club's organized files in the sidebar</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">2</span>
            <p><span className="font-medium text-gray-900 dark:text-gray-100">Search</span> — Find any file instantly with the search bar above</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">3</span>
            <p><span className="font-medium text-gray-900 dark:text-gray-100">Quick Access</span> — Pinned files appear in the sidebar for fast access</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-400">Click anywhere to dismiss</p>
      </div>
    </div>
  );
};
