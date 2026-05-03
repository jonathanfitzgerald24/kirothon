import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ClubActivityDashboard } from '@/components/dashboard/ClubActivityDashboard';
import { SetupWizard } from '@/components/setup/SetupWizard';
import { FirstLoginOrientation } from '@/components/FirstLoginOrientation';
import { Sparkles, Upload, FolderTree, Users } from 'lucide-react';

export const DashboardPage = () => {
  const { user, club, role } = useAuth();
  const showSetup = role === 'ADMIN' && club && club.setupStep < 4;

  return (
    <div>
      <FirstLoginOrientation />

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Welcome back, {user?.displayName}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {club?.name}
      </p>

      {/* Quick actions */}
      {role === 'ADMIN' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Link to="/admin/architecture" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-700">
            <Sparkles className="h-5 w-5 text-yellow-500" /> AI Architecture
          </Link>
          <Link to="/upload" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-700">
            <Upload className="h-5 w-5 text-blue-500" /> Upload Files
          </Link>
          <Link to="/" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-700">
            <FolderTree className="h-5 w-5 text-green-500" /> Browse Files
          </Link>
          <Link to="/admin/users" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-700">
            <Users className="h-5 w-5 text-purple-500" /> Manage Team
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {showSetup && <SetupWizard />}

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
            <ActivityFeed />
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="grid gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Google Drive</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {club?.driveConnected ? 'Connected' : 'Not Connected'}
                </p>
                {!club?.driveConnected && role === 'ADMIN' && (
                  <a
                    href="/api/v1/drive/connect"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Connect Google Drive
                  </a>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your Role</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.role}</p>
              </div>
            </div>
          </div>

          {role === 'ADMIN' && <ClubActivityDashboard />}
        </div>
      </div>
    </div>
  );
};
