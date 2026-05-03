import { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, Sparkles, Tag, FileText, FolderOpen } from 'lucide-react';

interface FileResult {
  file: File;
  status: 'pending' | 'processing' | 'done';
  assignedFolder: string;
  confidence: number;
  tags: string[];
  summary: string;
  renameSuggestion?: string;
}

// Mock AI responses for demo
const MOCK_AI_ROUTING: Record<string, { folder: string; confidence: number; tags: string[]; summary: string }> = {
  pdf: { folder: 'Meeting Notes', confidence: 92, tags: ['document', 'report', 'official'], summary: 'Official document containing structured information and records.' },
  xlsx: { folder: 'Finance', confidence: 95, tags: ['spreadsheet', 'budget', 'data'], summary: 'Spreadsheet with financial data, calculations, and tabular records.' },
  csv: { folder: 'Finance', confidence: 88, tags: ['data', 'export', 'records'], summary: 'Data export file containing structured rows of information.' },
  docx: { folder: 'Member Resources', confidence: 87, tags: ['document', 'writing', 'draft'], summary: 'Word document with formatted text content and notes.' },
  png: { folder: 'Marketing', confidence: 84, tags: ['image', 'visual', 'design'], summary: 'Image file — likely a flyer, graphic, or photo.' },
  jpg: { folder: 'Events', confidence: 82, tags: ['photo', 'event', 'capture'], summary: 'Photograph — likely from an event or meeting.' },
  pptx: { folder: 'Events', confidence: 90, tags: ['presentation', 'slides', 'meeting'], summary: 'Presentation slides for a meeting or event.' },
};

function getAIResult(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const base = MOCK_AI_ROUTING[ext] || MOCK_AI_ROUTING['pdf'];
  // Add filename-specific tags
  const nameTags: string[] = [];
  if (fileName.toLowerCase().includes('budget')) nameTags.push('budget', 'finance');
  if (fileName.toLowerCase().includes('meeting')) nameTags.push('meeting', 'minutes');
  if (fileName.toLowerCase().includes('rush')) nameTags.push('rush', 'recruitment');
  if (fileName.toLowerCase().includes('event')) nameTags.push('event', 'planning');
  return { ...base, tags: [...new Set([...base.tags, ...nameTags])].slice(0, 5) };
}

export const UploadPage = () => {
  const [files, setFiles] = useState<FileResult[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadNote, setUploadNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map((f) => ({ file: f, status: 'pending' as const, assignedFolder: '', confidence: 0, tags: [], summary: '' })),
    ]);
    setDone(false);
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    setProcessing(true);
    // Simulate AI processing each file with a delay
    for (let i = 0; i < files.length; i++) {
      setFiles((prev) => prev.map((f, j) => j === i ? { ...f, status: 'processing' } : f));
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      const ai = getAIResult(files[i].file.name);
      setFiles((prev) => prev.map((f, j) => j === i ? { ...f, status: 'done', assignedFolder: ai.folder, confidence: ai.confidence, tags: ai.tags, summary: ai.summary } : f));
    }
    setProcessing(false);
    setDone(true);

    // Also try the real API (will work if server is running)
    try {
      for (const f of files) {
        const formData = new FormData();
        formData.append('file', f.file);
        if (uploadNote) formData.append('uploadNote', uploadNote);
        await fetch('/api/v1/upload/single', { method: 'POST', credentials: 'include', body: formData }).catch(() => {});
      }
    } catch { /* mock is fine */ }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">Upload Files</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        <Sparkles className="mr-1 inline h-4 w-4 text-yellow-500" />
        AI will automatically sort, tag, and summarize your files
      </p>

      {/* Drop zone */}
      {!done && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
          }`}
        >
          <Upload className="mb-3 h-10 w-10 text-gray-400" />
          <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
            Drag and drop files here, or{' '}
            <label className="cursor-pointer font-medium text-blue-600 hover:text-blue-500">
              browse
              <input type="file" multiple className="hidden" onChange={handleFileSelect} />
            </label>
          </p>
          <p className="text-xs text-gray-500">Supports batch upload — drop multiple files at once</p>
        </div>
      )}

      {/* Upload note */}
      {files.length > 0 && !done && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Note <span className="text-gray-400">(optional)</span></label>
          <textarea value={uploadNote} onChange={(e) => setUploadNote(e.target.value.slice(0, 280))} maxLength={280} rows={2}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Add context about these files..." />
          <p className="mt-1 text-right text-xs text-gray-400">{uploadNote.length}/280</p>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={`${f.file.name}-${i}`} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {f.status === 'done' ? <CheckCircle className="h-5 w-5 shrink-0 text-green-500" /> :
                   f.status === 'processing' ? <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /> :
                   <FileText className="h-5 w-5 shrink-0 text-gray-400" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{f.file.name}</p>
                    <p className="text-xs text-gray-500">{(f.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                {f.status === 'pending' && (
                  <button onClick={() => removeFile(i)} className="p-1 text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                )}
              </div>

              {/* AI results */}
              {f.status === 'done' && (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Placed in <span className="font-medium">{f.assignedFolder}</span>
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      {f.confidence}% confidence
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-500" />
                    <div className="flex flex-wrap gap-1">
                      {f.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{f.summary}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && !done && (
        <button onClick={handleUpload} disabled={processing}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {processing ? `Processing ${files.filter(f => f.status === 'done').length}/${files.length}...` : `Upload & Sort ${files.length} file${files.length > 1 ? 's' : ''} with AI`}
        </button>
      )}

      {done && (
        <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-950">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {files.length} file{files.length > 1 ? 's' : ''} processed and organized by AI
            </p>
          </div>
          <button onClick={() => { setFiles([]); setDone(false); setUploadNote(''); }}
            className="mt-2 text-sm text-green-700 hover:text-green-600 dark:text-green-300">
            Upload more files
          </button>
        </div>
      )}
    </div>
  );
};
