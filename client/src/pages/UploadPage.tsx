import { UploadFlow } from '@/components/upload/UploadFlow';

export const UploadPage = () => {
  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Upload Files</h2>
      <UploadFlow />
    </div>
  );
};
