interface NewBadgeProps {
  isNew: boolean;
}

export const NewBadge = ({ isNew }: NewBadgeProps) => {
  if (!isNew) return null;

  return (
    <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
      New
    </span>
  );
};
