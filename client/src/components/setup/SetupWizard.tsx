import { useState, useEffect } from 'react';
import { Check, Lock, Cloud, Search, FolderTree, UserPlus } from 'lucide-react';
import { adminApi } from '@/api/admin';
import type { SetupStatus } from '@/types';

const STEP_CONFIG = [
  { label: 'Connect Drive', icon: Cloud, description: 'Link your Google Drive account' },
  { label: 'Analyze Structure', icon: Search, description: 'Scan existing files and folders' },
  { label: 'Approve Architecture', icon: FolderTree, description: 'Review and approve folder structure' },
  { label: 'Invite Team', icon: UserPlus, description: 'Add your club members' },
];

export const SetupWizard = () => {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getSetupStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  if (!status) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Setup Progress</h3>

      <div className="space-y-3">
        {STEP_CONFIG.map((step, i) => {
          const stepData = status.steps[i];
          const isCompleted = stepData?.completed ?? false;
          const isUnlocked = stepData?.unlocked ?? false;
          const isCurrent = status.currentStep === i;

          return (
            <div
              key={step.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                isCurrent
                  ? 'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                  : isCompleted
                    ? 'bg-green-50/50 dark:bg-green-950/20'
                    : ''
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isCompleted
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                  : isCurrent
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              }`}>
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : !isUnlocked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isCompleted
                    ? 'text-green-700 dark:text-green-400'
                    : isCurrent
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{step.description}</p>
              </div>

              {isCurrent && isUnlocked && (
                <a
                  href={i === 0 ? '/api/v1/drive/connect' : undefined}
                  onClick={i !== 0 ? undefined : undefined}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Start
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
