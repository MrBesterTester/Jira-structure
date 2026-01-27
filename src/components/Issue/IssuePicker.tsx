/**
 * IssuePicker - Modal component for selecting issues
 * 
 * Features:
 * - Search/filter capability
 * - Excludes specified issues (current issue, invalid targets)
 * - Returns selected issue ID
 * - Keyboard navigation support
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import type { Issue } from '../../types';
import { useIssueStore } from '../../store';
import { IssueTypeIcon } from './IssueTypeIcon';
import { StatusBadge } from './StatusBadge';

// ============================================================================
// TYPES
// ============================================================================

interface IssuePickerProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback when an issue is selected */
  onSelect: (issueId: string) => void;
  /** Issue IDs to exclude from the list */
  excludeIds?: string[];
  /** Title for the modal */
  title?: string;
  /** Optional filter function for additional filtering */
  filter?: (issue: Issue) => boolean;
}

// ============================================================================
// ISSUE LIST ITEM
// ============================================================================

interface IssueListItemProps {
  issue: Issue;
  isSelected: boolean;
  onClick: () => void;
}

const IssueListItem = memo(function IssueListItem({ 
  issue, 
  isSelected, 
  onClick 
}: IssueListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        ${isSelected 
          ? 'bg-blue-50 border-l-2 border-blue-500' 
          : 'hover:bg-gray-50 border-l-2 border-transparent'
        }
      `}
    >
      <IssueTypeIcon type={issue.type} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">{issue.key}</span>
          <StatusBadge status={issue.status} size="sm" />
        </div>
        <p className="text-sm text-gray-900 truncate mt-0.5">{issue.title}</p>
      </div>
    </button>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IssuePicker = memo(function IssuePicker({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
  title = 'Select Issue',
  filter,
}: IssuePickerProps) {
  const issues = useIssueStore(state => state.issues);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    // Exclude specified IDs
    if (excludeIds.includes(issue.id)) return false;
    
    // Apply custom filter
    if (filter && !filter(issue)) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        issue.key.toLowerCase().includes(query) ||
        issue.title.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredIssues.length > 0) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredIssues.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredIssues.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredIssues[selectedIndex]) {
          onSelect(filteredIssues[selectedIndex].id);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredIssues, selectedIndex, onSelect, onClose]);

  // Handle item click
  const handleItemClick = useCallback((issueId: string) => {
    onSelect(issueId);
    onClose();
  }, [onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[60vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by key or title..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Issue List */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {filteredIssues.length === 0 ? (
            <div className="py-12 text-center">
              <svg 
                className="w-12 h-12 mx-auto text-gray-300 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'No issues match your search' : 'No issues available'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredIssues.map((issue, index) => (
                <IssueListItem
                  key={issue.id}
                  issue={issue}
                  isSelected={index === selectedIndex}
                  onClick={() => handleItemClick(issue.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with hint */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">↑↓</kbd> to navigate, 
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 ml-1">Enter</kbd> to select, 
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 ml-1">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
});
