import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadApi } from '@/api/upload';
import type { RoutingResult } from '@/types';
import { RoutingResultScreen } from './RoutingResultScreen';

interface UploadFlowProps {
  onComplete?: () => void;
}

export const UploadFlow = ({ onComplete }: UploadFlowProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadNote, setUploadNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RoutingResult | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      if (files.length === 1) {
        const routingResult = await uploadApi.single(files[0], uploadNote || undefined);
        setResult(routingResult);
      } else {
        await uploadApi.batch(files);
      }
      setProgress(100);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (result) {
    return <RoutingResultScreen result={result} onDone={() => { setResult(null); setFiles([]); setUploadNote(''); }} />;
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
        }`}
      >
        <Upload className="mb-3 h-10 w-10 text-gray-400" />
        <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
          Drag and drop files here, or{' '}
          <label className="cursor-pointer font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
            browse
            <input type="file" multiple className="hidden" onChange={handleFileSelect} />
          </label>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Max 100 MB per file</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button onClick={() => removeFile(i)} className="ml-2 p-1 text-gray-400 hover:text-red-500" aria-label={`Remove ${file.name}`}>
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload note */}
      {files.length > 0 && (
        <div>
          <label htmlFor="uploadNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Note <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="uploadNote"
            value={uploadNote}
            onChange={(e) => setUploadNote(e.target.value.slice(0, 280))}
            maxLength={280}
            rows={2}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Add a note about this upload..."
          />
          <p className="mt-1 text-right text-xs text-gray-400">{uploadNote.length}/280</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
};
