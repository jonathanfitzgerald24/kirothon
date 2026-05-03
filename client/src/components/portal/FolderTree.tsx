import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import type { Category } from '@/types';
import { FolderPreviewPopover } from './FolderPreviewPopover';

interface FolderTreeProps {
  categories: Category[];
  activeCategoryId?: string;
}

export const FolderTree = ({ categories, activeCategoryId }: FolderTreeProps) => {
  return (
    <div className="space-y-0.5">
      {categories.map((cat) => (
        <FolderTreeNode
          key={cat.id}
          category={cat}
          activeCategoryId={activeCategoryId}
          depth={0}
        />
      ))}
    </div>
  );
};

interface FolderTreeNodeProps {
  category: Category;
  activeCategoryId?: string;
  depth: number;
}

const FolderTreeNode = ({ category, activeCategoryId, depth }: FolderTreeNodeProps) => {
  const [expanded, setExpanded] = useState(depth === 0);
  const [hovering, setHovering] = useState(false);
  const navigate = useNavigate();
  const hasChildren = category.children && category.children.length > 0;
  const isActive = category.id === activeCategoryId;

  const handleClick = () => {
    navigate(`/portal/folder/${category.id}`);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div>
      <div
        className="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <button
          onClick={handleClick}
          className={`flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          aria-label={`Open folder ${category.name}`}
        >
          {hasChildren ? (
            <span onClick={handleToggle} className="shrink-0 p-0.5" role="button" aria-label={expanded ? 'Collapse' : 'Expand'}>
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
          ) : (
            <span className="w-4.5 shrink-0" />
          )}

          {expanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          )}

          <span className="truncate">{category.name}</span>

          {category.isNew && (
            <span className="ml-auto shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
              New
            </span>
          )}
        </button>

        {hovering && (
          <FolderPreviewPopover categoryId={category.id} />
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {category.children!.map((child) => (
            <FolderTreeNode
              key={child.id}
              category={child}
              activeCategoryId={activeCategoryId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
