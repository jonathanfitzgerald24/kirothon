import { useDemo } from '@/contexts/DemoContext';

export const DemoBanner = () => {
  const { isDemoMode } = useDemo();

  if (!isDemoMode) return null;

  return (
    <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
      You are in Demo Mode — changes will not be saved.
    </div>
  );
};
