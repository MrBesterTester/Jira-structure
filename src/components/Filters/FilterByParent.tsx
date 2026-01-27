/**
 * FilterByParent - Issue picker for "children of" filtering
 */

import { memo, useState, useMemo, useRef, useEffect } from 'react';
import { useIssueStore } from '../../store';
import { IssueTypeIcon } from '../Issue';

interface FilterByParentProps {
  selectedParentId: string | null;
  onChange: (parentId: string | null) => void;
}

export const FilterByParent = memo(function FilterByParent({
  selectedParentId,
  onChange,
}: FilterByParentProps) {
  const issues = useIssueStore(state => state.issues);
  const [searchValue, setSearchValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get parent issues (issues that have children)
  const parentIssues = useMemo(() => {
    return issues.filter(issue => issue.childIds.length > 0);
  }, [issues]);

  // Filter issues based on search
  const filteredIssues = useMemo(() => {
    if (!searchValue.trim()) {
      return parentIssues.slice(0, 20); // Show first 20 by default
    }
    const searchLower = searchValue.toLowerCase();
    return parentIssues.filter(
      issue =>
        issue.key.toLowerCase().includes(searchLower) ||
        issue.title.toLowerCase().includes(searchLower)
    );
  }, [parentIssues, searchValue]);

  // Get selected parent issue
  const selectedParent = useMemo(() => {
    if (!selectedParentId) return null;
    return issues.find(issue => issue.id === selectedParentId) || null;
  }, [issues, selectedParentId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (issueId: string) => {
    onChange(issueId);
    setSearchValue('');
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchValue('');
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Children of
        </label>
        {selectedParentId && (
          <button
            onClick={handleClear}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Selected parent display */}
      {selectedParent ? (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <IssueTypeIcon type={selectedParent.type} size="sm" />
          <span className="text-xs font-medium text-blue-800">{selectedParent.key}</span>
          <span className="text-sm text-gray-700 truncate flex-1">{selectedParent.title}</span>
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-blue-100 rounded"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search parent issues..."
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          {/* Dropdown */}
          {showDropdown && filteredIssues.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredIssues.map(issue => (
                <button
                  key={issue.id}
                  onClick={() => handleSelect(issue.id)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <IssueTypeIcon type={issue.type} size="sm" />
                  <span className="text-xs font-medium text-gray-500">{issue.key}</span>
                  <span className="text-sm text-gray-700 truncate">{issue.title}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {issue.childIds.length} children
                  </span>
                </button>
              ))}
            </div>
          )}

          {showDropdown && filteredIssues.length === 0 && searchValue && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-center text-sm text-gray-500">
              No matching parent issues found
            </div>
          )}
        </div>
      )}

      {parentIssues.length === 0 && (
        <p className="text-xs text-gray-400 italic">No issues with children found</p>
      )}
    </div>
  );
});
