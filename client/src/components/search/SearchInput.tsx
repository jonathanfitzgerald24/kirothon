import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

interface SearchInputProps {
  onSearch: (query: string, semantic: boolean) => void;
}

export const SearchInput = ({ onSearch }: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [semantic, setSemantic] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 2) {
      onSearch(query, semantic);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files and folders..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
          aria-label="Search files and folders"
          minLength={2}
        />
      </div>
      <button
        type="button"
        onClick={() => setSemantic(!semantic)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
          semantic
            ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
        }`}
        aria-label={semantic ? 'Disable AI search' : 'Enable AI search'}
        aria-pressed={semantic}
      >
        <Sparkles className="h-4 w-4" />
        AI
      </button>
    </form>
  );
};
