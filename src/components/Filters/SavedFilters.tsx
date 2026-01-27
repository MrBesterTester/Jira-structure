/**
 * SavedFilters - Save, load, and delete filter combinations
 */

import { memo, useState, useEffect, useCallback } from 'react';
import type { FilterState } from '../../types';
import { hasActiveFilters } from '../../utils';

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

interface SavedFiltersProps {
  currentFilters: FilterState;
  onLoadFilter: (filters: FilterState) => void;
}

const STORAGE_KEY = 'jira-structure-saved-filters';

export const SavedFilters = memo(function SavedFilters({
  currentFilters,
  onLoadFilter,
}: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedFilters(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, []);

  // Save filters to localStorage
  const persistFilters = useCallback((filters: SavedFilter[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      setSavedFilters(filters);
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }, []);

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) return;

    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name: newFilterName.trim(),
      filters: { ...currentFilters },
      createdAt: new Date().toISOString(),
    };

    persistFilters([newFilter, ...savedFilters]);
    setNewFilterName('');
    setShowSaveInput(false);
    setIsExpanded(true);
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    onLoadFilter(filter.filters);
  };

  const handleDeleteFilter = (filterId: string) => {
    persistFilters(savedFilters.filter(f => f.id !== filterId));
  };

  const canSave = hasActiveFilters(currentFilters);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
        >
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Saved Filters
          {savedFilters.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-600">
              {savedFilters.length}
            </span>
          )}
        </button>
        {canSave && !showSaveInput && (
          <button
            onClick={() => setShowSaveInput(true)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Save
          </button>
        )}
      </div>

      {/* Save filter input */}
      {showSaveInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveFilter();
              if (e.key === 'Escape') {
                setShowSaveInput(false);
                setNewFilterName('');
              }
            }}
            placeholder="Filter name..."
            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={handleSaveFilter}
            disabled={!newFilterName.trim()}
            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={() => {
              setShowSaveInput(false);
              setNewFilterName('');
            }}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Saved filter list */}
      {isExpanded && savedFilters.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {savedFilters.map(filter => (
            <div
              key={filter.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 group"
            >
              <button
                onClick={() => handleLoadFilter(filter)}
                className="flex-1 text-left text-sm text-gray-700 hover:text-blue-600 truncate"
                title={`Load "${filter.name}"`}
              >
                {filter.name}
              </button>
              <button
                onClick={() => handleDeleteFilter(filter.id)}
                className="p-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete filter"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {isExpanded && savedFilters.length === 0 && (
        <p className="text-xs text-gray-400 italic px-2">
          No saved filters. Apply filters and click "Save" to save them.
        </p>
      )}
    </div>
  );
});
