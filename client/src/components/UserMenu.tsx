import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Moon, Sun, Settings, LogOut } from 'lucide-react';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const roleBadgeColor = {
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    MOD: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    MEMBER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }[user.role];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <span className="hidden sm:inline text-gray-700 dark:text-gray-300">
          {user.displayName}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user.displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeColor}`}>
              {user.role}
            </span>
          </div>

          <button
            onClick={toggleDarkMode}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

          <div className="border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
