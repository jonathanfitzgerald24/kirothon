import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import type { CategoryAncestor } from '@/types';

interface BreadcrumbProps {
  ancestors: CategoryAncestor[];
  currentName: string;
}

export const Breadcrumb = ({ ancestors, currentName }: BreadcrumbProps) => {
  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {ancestors.map((ancestor) => (
        <span key={ancestor.id} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <Link
            to={`/portal/folder/${ancestor.id}`}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {ancestor.name}
          </Link>
        </span>
      ))}

      <span className="flex items-center gap-1">
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {currentName}
        </span>
      </span>
    </nav>
  );
};
