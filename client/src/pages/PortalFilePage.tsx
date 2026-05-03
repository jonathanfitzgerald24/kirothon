import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { portalApi } from '@/api/portal';
import type { FileMeta } from '@/types';
import { FileDetailView } from '@/components/portal/FileDetailView';

export const PortalFilePage = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [file, setFile] = useState<FileMeta | null>(null);
  const [similarFiles, setSimilarFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fileId) return;
    setLoading(true);
    Promise.all([
      portalApi.getFile(fileId),
      portalApi.getSimilarFiles(fileId).catch(() => []),
    ])
      .then(([fileData, similar]) => {
        setFile(fileData);
        setSimilarFiles(similar);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fileId]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  if (error || !file) {
    return <div className="py-12 text-center text-sm text-red-500">{error || 'File not found'}</div>;
  }

  return <FileDetailView file={file} similarFiles={similarFiles} />;
};
