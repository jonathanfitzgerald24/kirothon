import { Link } from 'react-router-dom';
import { Download, Info, Tag as TagIcon, User, Clock, MessageSquare } from 'lucide-react';
import type { FileMeta } from '@/types';
import { portalApi } from '@/api/portal';
import { formatFileSize, formatDate, getFileIcon, isPreviewable } from '@/lib/fileUtils';

interface FileDetailViewProps {
  file: FileMeta;
  similarFiles?: FileMeta[];
}

export const FileDetailView = ({ file, similarFiles }: FileDetailViewProps) => {
  const FileIcon = getFileIcon(file.mimeType);
  const previewable = isPreviewable(file.mimeType);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Main content */}
      <div className="flex-1">
        {/* File header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileIcon className="h-8 w-8 text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {file.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(file.sizeBytes)} · {file.mimeType.split('/').pop()?.toUpperCase()}
              </p>
            </div>
          </div>
          <a
            href={portalApi.getFileDownloadUrl(file.id)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            download
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>

        {/* Preview */}
        {previewable ? (
          <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <iframe
              src={portalApi.getFilePreviewUrl(file.id)}
              className="h-[600px] w-full"
              title={`Preview of ${file.name}`}
            />
          </div>
        ) : (
          <div className="mb-6 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900">
            <FileIcon className="mb-3 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Preview not available for this file type
            </p>
          </div>
        )}

        {/* AI Summary */}
        {file.aiSummary && (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300">
              <Info className="h-4 w-4" />
              AI Summary
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">{file.aiSummary}</p>
          </div>
        )}

        {/* Upload Note */}
        {file.uploadNote && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <MessageSquare className="h-4 w-4" />
              Upload Note
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{file.uploadNote}</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-full space-y-4 lg:w-72">
        {/* Metadata */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <dt className="text-gray-500 dark:text-gray-400">Uploaded by</dt>
              <dd className="ml-auto text-gray-900 dark:text-gray-100">
                {file.uploader?.displayName ?? 'Unknown'}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <dt className="text-gray-500 dark:text-gray-400">Uploaded</dt>
              <dd className="ml-auto text-gray-900 dark:text-gray-100">
                {formatDate(file.uploadedAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <TagIcon className="h-4 w-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {file.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Why Here? */}
        {file.routingExplanation && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Why here?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{file.routingExplanation}</p>
          </div>
        )}

        {/* Similar Files */}
        {similarFiles && similarFiles.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
              Files Like This
            </h3>
            <ul className="space-y-2">
              {similarFiles.map((sf) => {
                const SfIcon = getFileIcon(sf.mimeType);
                return (
                  <li key={sf.id}>
                    <Link
                      to={`/portal/file/${sf.id}`}
                      className="flex items-center gap-2 text-xs text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                    >
                      <SfIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{sf.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
