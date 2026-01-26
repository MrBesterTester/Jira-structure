/**
 * TreeToolbar - Toolbar for tree view controls
 * 
 * Provides expand/collapse all functionality, quick filters by issue type,
 * and sorting options.
 */

import { memo, useCallback } from 'react';
import type { Issue, SortConfig } from '../../types';
import { IssueType } from '../../types';
import { IssueTypeIcon, getAllIssueTypes } from '../Issue';

// ============================================================================
// TYPES
// ============================================================================

interface TreeToolbarProps {
  /** Total number of issues in the tree */
  totalIssues: number;
  /** Number of currently visible root issues */
  rootIssueCount: number;
  /** Current type filters (empty = show all) */
  typeFilters: IssueType[];
  /** Current sort configuration */
  sortConfig: SortConfig | null;
  /** Handler for expand all */
  onExpandAll: () => void;
  /** Handler for collapse all */
  onCollapseAll: () => void;
  /** Handler for type filter change */
  onTypeFilterChange: (types: IssueType[]) => void;
  /** Handler for sort change */
  onSortChange: (config: SortConfig | null) => void;
}

// ============================================================================
// SORT OPTIONS
// ============================================================================

type SortField = 'createdAt' | 'priority' | 'status' | 'title' | 'key';

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'Title' },
  { value: 'key', label: 'Key' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const TreeToolbar = memo(function TreeToolbar({
  totalIssues,
  rootIssueCount,
  typeFilters,
  sortConfig,
  onExpandAll,
  onCollapseAll,
  onTypeFilterChange,
  onSortChange,
}: TreeToolbarProps) {
  const allTypes = getAllIssueTypes();

  // Handle type filter toggle
  const handleTypeToggle = useCallback((type: IssueType) => {
    if (typeFilters.includes(type)) {
      onTypeFilterChange(typeFilters.filter(t => t !== type));
    } else {
      onTypeFilterChange([...typeFilters, type]);
    }
  }, [typeFilters, onTypeFilterChange]);

  // Handle clear all type filters
  const handleClearTypeFilters = useCallback(() => {
    onTypeFilterChange([]);
  }, [onTypeFilterChange]);

  // Handle sort change
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      onSortChange(null);
    } else {
      // Parse the value (format: "field-direction")
      const [field, direction] = value.split('-') as [SortField, 'asc' | 'desc'];
      onSortChange({ field: field as keyof Issue, direction });
    }
  }, [onSortChange]);

  // Get current sort value for select
  const getSortValue = (): string => {
    if (!sortConfig) return '';
    return `${sortConfig.field}-${sortConfig.direction}`;
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 mb-4">
      {/* Left side: Expand/Collapse + Issue count */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExpandAll}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
          title="Expand All"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Expand All
        </button>
        
        <button
          onClick={onCollapseAll}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
          title="Collapse All"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
          Collapse All
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-2" />
        
        <span className="text-sm text-gray-500">
          {rootIssueCount} root issues • {totalIssues} total
        </span>
      </div>

      {/* Right side: Filters + Sort */}
      <div className="flex items-center gap-3">
        {/* Type filters dropdown */}
        <div className="relative group">
          <button
            className={`
              px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5
              ${typeFilters.length > 0 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-100 border border-transparent'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter by Type
            {typeFilters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 rounded-full">
                {typeFilters.length}
              </span>
            )}
          </button>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-2 hidden group-hover:block z-10">
            {allTypes.map(({ type, label }) => (
              <label
                key={type}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={typeFilters.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <IssueTypeIcon type={type} size="sm" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
            
            {typeFilters.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleClearTypeFilters}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sort dropdown */}
        <select
          value={getSortValue()}
          onChange={handleSortChange}
          className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Sort by: Default</option>
          {sortOptions.map(option => (
            <>
              <option key={`${option.value}-desc`} value={`${option.value}-desc`}>
                {option.label} (Newest first)
              </option>
              <option key={`${option.value}-asc`} value={`${option.value}-asc`}>
                {option.label} (Oldest first)
              </option>
            </>
          ))}
        </select>
      </div>
    </div>
  );
});
