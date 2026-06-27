import React from 'react';

import { type FilterType, type SortByType } from '@/types/dataroom';

interface NodeFiltersProps {
  filterType: FilterType;
  onFilterTypeChange: (type: FilterType) => void;
  sortBy: SortByType;
  onSortByChange: (sort: SortByType) => void;
}

export const NodeFilters: React.FC<NodeFiltersProps> = ({
  filterType,
  onFilterTypeChange,
  sortBy,
  onSortByChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border mb-6">
      <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl w-fit">
        <button
          onClick={() => onFilterTypeChange('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onFilterTypeChange('folders')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            filterType === 'folders'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Folders
        </button>
        <button
          onClick={() => onFilterTypeChange('files')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            filterType === 'files'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Files
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="sort-nodes-select" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Sort by:
        </label>
        <select
          id="sort-nodes-select"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortByType)}
          className="text-xs bg-card border border-border rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground cursor-pointer font-medium"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="date-newest">Newest First</option>
          <option value="date-oldest">Oldest First</option>
          <option value="size-largest">Size (Largest)</option>
          <option value="size-smallest">Size (Smallest)</option>
        </select>
      </div>
    </div>
  );
};
