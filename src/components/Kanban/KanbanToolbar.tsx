/**
 * KanbanToolbar - Toolbar for Kanban board controls
 * 
 * Features:
 * - Filter by assignee dropdown
 * - Filter by epic/parent dropdown
 * - Group by toggle (none, assignee, priority) - visual only for now, full implementation in Step 4.3
 * - Issue count display
 */

import { useState, useRef, useEffect, memo } from 'react';
import { useUIStore, useUserStore, useIssueStore } from '../../store';
import { IssueType } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export type GroupByOption = 'none' | 'assignee' | 'priority' | 'epic';

export interface KanbanToolbarProps {
  /** Total count of visible issues */
  totalCount: number;
  /** Callback when group by changes - will be used in Step 4.3 */
  onGroupByChange?: (groupBy: GroupByOption) => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// DROPDOWN COMPONENT
// ============================================================================

interface DropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

const Dropdown = memo(function Dropdown({ label, value, options, onChange, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-500">{label}:</span>
        <span className="font-medium text-gray-700">{selectedOption?.label || 'Select'}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="py-1">
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const KanbanToolbar = memo(function KanbanToolbar({
  totalCount,
  onGroupByChange,
  className = '',
}: KanbanToolbarProps) {
  // Store hooks
  const filters = useUIStore(state => state.filters);
  const setFilter = useUIStore(state => state.setFilter);
  const clearFilters = useUIStore(state => state.clearFilters);
  const users = useUserStore(state => state.users);
  const issues = useIssueStore(state => state.issues);

  // Local state for group by (will be lifted to KanbanBoard in Step 4.3)
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');

  // Get epics for filtering
  const epics = issues.filter(i => i.type === IssueType.Epic);

  // Check if any filters are active
  const hasActiveFilters = 
    filters.assignees.length > 0 || 
    filters.parentId !== null ||
    filters.types.length > 0 ||
    filters.priorities.length > 0 ||
    filters.labels.length > 0;

  // Assignee filter options
  const assigneeOptions = [
    { value: '', label: 'All' },
    { value: 'unassigned', label: 'Unassigned' },
    ...users.map(user => ({ value: user.id, label: user.displayName })),
  ];

  // Epic filter options
  const epicOptions = [
    { value: '', label: 'All' },
    ...epics.map(epic => ({ value: epic.id, label: `${epic.key} - ${epic.title}` })),
  ];

  // Group by options
  const groupByOptions = [
    { value: 'none', label: 'None' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'priority', label: 'Priority' },
    { value: 'epic', label: 'Epic' },
  ];

  // Handle assignee filter change
  const handleAssigneeChange = (value: string) => {
    if (value === '') {
      setFilter('assignees', []);
    } else if (value === 'unassigned') {
      // Special case: filter for null assignee
      setFilter('assignees', ['__unassigned__']);
    } else {
      setFilter('assignees', [value]);
    }
  };

  // Handle epic filter change
  const handleEpicChange = (value: string) => {
    setFilter('parentId', value || null);
  };

  // Handle group by change
  const handleGroupByChange = (value: string) => {
    const newGroupBy = value as GroupByOption;
    setGroupBy(newGroupBy);
    onGroupByChange?.(newGroupBy);
  };

  // Get current filter values for dropdowns
  const currentAssignee = filters.assignees.length > 0 
    ? (filters.assignees[0] === '__unassigned__' ? 'unassigned' : (filters.assignees[0] ?? ''))
    : '';
  const currentEpic = filters.parentId ?? '';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left side: Filters */}
        <div className="flex items-center gap-3">
          {/* Assignee filter */}
          <Dropdown
            label="Assignee"
            value={currentAssignee}
            options={assigneeOptions}
            onChange={handleAssigneeChange}
          />

          {/* Epic filter */}
          <Dropdown
            label="Epic"
            value={currentEpic}
            options={epicOptions}
            onChange={handleEpicChange}
          />

          {/* Group by selector */}
          <Dropdown
            label="Group by"
            value={groupBy}
            options={groupByOptions}
            onChange={handleGroupByChange}
          />

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
        </div>

        {/* Right side: Count and actions */}
        <div className="flex items-center gap-3">
          {/* Issue count */}
          <span className="text-sm text-gray-500">
            {totalCount} issue{totalCount !== 1 ? 's' : ''}
          </span>

          {/* Refresh button */}
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Active filters:</span>
            
            {filters.assignees.length > 0 && (
              <FilterTag
                label={filters.assignees[0] === '__unassigned__' 
                  ? 'Unassigned' 
                  : users.find(u => u.id === filters.assignees[0])?.displayName || 'Unknown'}
                onRemove={() => setFilter('assignees', [])}
              />
            )}
            
            {filters.parentId && (
              <FilterTag
                label={epics.find(e => e.id === filters.parentId)?.key ?? 'Epic'}
                onRemove={() => setFilter('parentId', null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// FILTER TAG COMPONENT
// ============================================================================

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

// Types already exported with interface/type definitions above
