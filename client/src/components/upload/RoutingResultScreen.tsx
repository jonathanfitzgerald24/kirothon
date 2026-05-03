import { CheckCircle, AlertTriangle, FolderPlus, ArrowRight } from 'lucide-react';
import type { RoutingResult } from '@/types';

interface RoutingResultScreenProps {
  result: RoutingResult;
  onDone: () => void;
}

export const RoutingResultScreen = ({ result, onDone }: RoutingResultScreenProps) => {
  return (
    <div className="space-y-4">
      {/* Auto-placed */}
      {result.autoPlaced && result.categoryName && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="font-medium text-green-800 dark:text-green-300">Auto-placed</h3>
          </div>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            <span className="font-medium">{result.fileName}</span> was placed in{' '}
            <span className="font-medium">{result.categoryName}</span>
            {result.confidenceScore && ` (${result.confidenceScore}% confidence)`}
          </p>
          {result.explanation && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-500">{result.explanation}</p>
          )}
        </div>
      )}

      {/* Rename suggestion */}
      {result.renameSuggestion && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-medium text-amber-800 dark:text-amber-300">Rename suggestion</h3>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-gray-500 line-through">{result.fileName}</span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-medium text-amber-800 dark:text-amber-300">{result.renameSuggestion}</span>
          </div>
        </div>
      )}

      {/* Duplicate warning */}
      {result.duplicateWarning && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="font-medium text-red-800 dark:text-red-300">Possible duplicate</h3>
          </div>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            A file named <span className="font-medium">{result.duplicateWarning.existingFileName}</span> already exists in this folder.
          </p>
        </div>
      )}

      {/* Alternatives (needs selection) */}
      {!result.autoPlaced && result.alternatives.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Choose a folder for <span className="font-medium">{result.fileName}</span>
          </h3>
          {result.alternatives.map((alt) => (
            <button
              key={alt.categoryId}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:bg-blue-950"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{alt.categoryName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{alt.explanation}</p>
              </div>
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {alt.score}%
              </span>
            </button>
          ))}
        </div>
      )}

      {/* New category suggestion */}
      {result.newCategorySuggestion && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-medium text-purple-800 dark:text-purple-300">New folder suggested</h3>
          </div>
          <p className="mt-1 text-sm text-purple-700 dark:text-purple-400">
            Create <span className="font-medium">{result.newCategorySuggestion.name}</span>
          </p>
          <p className="mt-1 text-xs text-purple-600 dark:text-purple-500">
            {result.newCategorySuggestion.rationale}
          </p>
        </div>
      )}

      <button
        onClick={onDone}
        className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        Done
      </button>
    </div>
  );
};
