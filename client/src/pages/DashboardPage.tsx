import { useAuth } from '@/contexts/AuthContext';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ClubActivityDashboard } from '@/components/dashboard/ClubActivityDashboard';
import { SetupWizard } from '@/components/setup/SetupWizard';
import { FirstLoginOrientation } from '@/components/FirstLoginOrientation';

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
