import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { portalApi } from '@/api/portal';
import type { FolderContents } from '@/api/portal';
import { Breadcrumb } from '@/components/portal/Breadcrumb';
import { FolderView } from '@/components/portal/FolderView';

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
      <div className="mb-4">
        <Breadcrumb ancestors={data.ancestors} currentName={data.category.name} />
      </div>
      {data.category.description && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{data.category.description}</p>
      )}
      <FolderView subfolders={data.subfolders} files={data.files} />
    </div>
  );
};
