import { useAuth } from '@/contexts/AuthContext';

export const DashboardPage = () => {
  const { user, club } = useAuth();

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Welcome back, {user?.displayName}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {club?.name} Dashboard
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Setup Progress</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Step {club?.setupStep ?? 0} / 4
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Google Drive</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {club?.driveConnected ? 'Connected' : 'Not Connected'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Role</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {user?.role}
          </p>
        </div>
      </div>
    </div>
  );
};
