import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { portalApi } from '@/api/portal';
import type { FolderContents } from '@/api/portal';
import { Folder, FileText, ChevronRight } from 'lucide-react';

export const PortalFolderPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [data, setData] = useState<FolderContents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    portalApi
      .getFolder(categoryId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  if (error || !data) {
    return <div className="py-12 text-center text-sm text-red-500">{error || 'Folder not found'}</div>;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
        {data.ancestors.map((a) => (
          <span key={a.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/portal/folder/${a.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">{a.name}</Link>
          </span>
        ))}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-900 dark:text-gray-100">{data.folder.name}</span>
      </nav>

      {data.folder.description && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{data.folder.description}</p>
      )}

      {data.subfolders.length === 0 && data.files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Folder className="mb-3 h-12 w-12" />
          <p className="text-sm">This folder is empty</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Name</th>
                <th className="hidden px-4 py-2.5 text-left font-medium text-gray-500 sm:table-cell">Type</th>
                <th className="hidden px-4 py-2.5 text-left font-medium text-gray-500 md:table-cell">Size</th>
                <th className="hidden px-4 py-2.5 text-left font-medium text-gray-500 lg:table-cell">Uploaded by</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.subfolders.map((folder) => (
                <tr key={folder.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-4 py-2.5">
                    <Link to={`/portal/folder/${folder.id}`} className="flex items-center gap-2 text-gray-900 hover:text-blue-600 dark:text-gray-100">
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span>{folder.name}</span>
                      {folder.isNew && <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">New</span>}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-2.5 text-gray-500 sm:table-cell">Folder</td>
                  <td className="hidden px-4 py-2.5 text-gray-500 md:table-cell">—</td>
                  <td className="hidden px-4 py-2.5 text-gray-500 lg:table-cell">—</td>
                  <td className="px-4 py-2.5 text-gray-500">{new Date(folder.lastUpdatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-4 py-2.5">
                    <Link to={`/portal/file/${file.id}`} className="flex items-center gap-2 text-gray-900 hover:text-blue-600 dark:text-gray-100">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>{file.name}</span>
                      {file.isNew && <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">New</span>}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-2.5 text-gray-500 sm:table-cell">{file.mimeType.split('/').pop()?.toUpperCase()}</td>
                  <td className="hidden px-4 py-2.5 text-gray-500 md:table-cell">{(parseInt(file.sizeBytes) / 1024).toFixed(0)} KB</td>
                  <td className="hidden px-4 py-2.5 text-gray-500 lg:table-cell">{file.uploader || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
