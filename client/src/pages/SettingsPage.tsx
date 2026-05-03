import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, User } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>

      {/* Profile */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">Profile</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <User className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{user?.displayName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon className="h-5 w-5 text-gray-400" /> : <Sun className="h-5 w-5 text-gray-400" />}
            <div>
              <p className="text-sm text-gray-900 dark:text-gray-100">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isDarkMode ? 'Currently using dark theme' : 'Currently using light theme'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            role="switch"
            aria-checked={isDarkMode}
            aria-label="Toggle dark mode"
            className={`relative h-6 w-11 rounded-full transition-colors ${
              isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isDarkMode ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
