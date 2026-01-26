/**
 * TreeView - Main tree view container
 * 
 * Features:
 * - Displays issues in hierarchical tree structure
 * - Expand/collapse functionality
 * - Keyboard navigation (arrows, Enter)
 * - Filtering by issue type
 * - Sorting by various fields
 * - Loading and empty states
 */

import { memo, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Issue, SortConfig, SortDirection } from '../../types';
import { IssueType, Priority, IssueStatus } from '../../types';
import { useIssueStore, useUIStore } from '../../store';
import { TreeNode } from './TreeNode';
import { TreeToolbar } from './TreeToolbar';

// ============================================================================
// TYPES
// ============================================================================

interface TreeViewProps {
  /** Optional class name */
  className?: string;
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

const priorityOrder: Record<Priority, number> = {
  [Priority.Highest]: 0,
  [Priority.High]: 1,
  [Priority.Medium]: 2,
  [Priority.Low]: 3,
  [Priority.Lowest]: 4,
};

const statusOrder: Record<IssueStatus, number> = {
  [IssueStatus.Todo]: 0,
  [IssueStatus.InProgress]: 1,
  [IssueStatus.InReview]: 2,
  [IssueStatus.Done]: 3,
};

function sortIssues(issues: Issue[], sortConfig: SortConfig | null): Issue[] {
  if (!sortConfig) return issues;

  const { field, direction } = sortConfig;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...issues].sort((a, b) => {
    let aValue = a[field];
    let bValue = b[field];

    // Handle priority sorting with custom order
    if (field === 'priority') {
      const aOrder = priorityOrder[a.priority] ?? 99;
      const bOrder = priorityOrder[b.priority] ?? 99;
      return (aOrder - bOrder) * multiplier;
    }

    // Handle status sorting with custom order
    if (field === 'status') {
      const aOrder = statusOrder[a.status] ?? 99;
      const bOrder = statusOrder[b.status] ?? 99;
      return (aOrder - bOrder) * multiplier;
    }

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Handle dates
    if (field === 'createdAt' || field === 'updatedAt' || field === 'dueDate' || field === 'startDate') {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return (aDate - bDate) * multiplier;
    }

    // Handle strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * multiplier;
    }

    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * multiplier;
    }

    return 0;
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TreeView = memo(function TreeView({ className = '' }: TreeViewProps) {
  // Store state
  const issues = useIssueStore(state => state.issues);
  const loading = useIssueStore(state => state.loading);
  const error = useIssueStore(state => state.error);
  const getIssuesByParentId = useIssueStore(state => state.getIssuesByParentId);
  
  const expandedIssueIds = useUIStore(state => state.expandedIssueIds);
  const focusedIssueId = useUIStore(state => state.focusedIssueId);
  const filters = useUIStore(state => state.filters);
  const sortConfig = useUIStore(state => state.sortConfig);
  
  const expandIssue = useUIStore(state => state.expandIssue);
  const collapseIssue = useUIStore(state => state.collapseIssue);
  const toggleIssueExpanded = useUIStore(state => state.toggleIssueExpanded);
  const expandAll = useUIStore(state => state.expandAll);
  const collapseAll = useUIStore(state => state.collapseAll);
  const setFocusedIssue = useUIStore(state => state.setFocusedIssue);
  const toggleIssueSelection = useUIStore(state => state.toggleIssueSelection);
  const selectIssue = useUIStore(state => state.selectIssue);
  const selectMultipleIssues = useUIStore(state => state.selectMultipleIssues);
  const selectRange = useUIStore(state => state.selectRange);
  const openDetailPanel = useUIStore(state => state.openDetailPanel);
  const setFilter = useUIStore(state => state.setFilter);
  const setSortConfig = useUIStore(state => state.setSortConfig);

  // Refs for keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastSelectedId = useRef<string | null>(null);

  // Convert expandedIssueIds array to Set for efficient lookup
  const expandedIds = useMemo(() => new Set(expandedIssueIds), [expandedIssueIds]);

  // Get root issues (no parent)
  const rootIssues = useMemo(() => {
    return issues.filter(issue => issue.parentId === null);
  }, [issues]);

  // Apply type filters
  const filteredRootIssues = useMemo(() => {
    let filtered = rootIssues;
    
    // Filter by type if types are specified
    if (filters.types.length > 0) {
      filtered = filtered.filter(issue => filters.types.includes(issue.type));
    }
    
    return filtered;
  }, [rootIssues, filters.types]);

  // Apply sorting
  const sortedRootIssues = useMemo(() => {
    return sortIssues(filteredRootIssues, sortConfig);
  }, [filteredRootIssues, sortConfig]);

  // Build flat list of visible issue IDs for keyboard navigation
  const visibleIssueIds = useMemo(() => {
    const ids: string[] = [];
    
    const addIssueAndChildren = (issue: Issue) => {
      // Apply type filter
      if (filters.types.length > 0 && !filters.types.includes(issue.type)) {
        return;
      }
      
      ids.push(issue.id);
      
      if (expandedIds.has(issue.id)) {
        const children = getIssuesByParentId(issue.id);
        const sortedChildren = sortIssues(children, sortConfig);
        sortedChildren.forEach(addIssueAndChildren);
      }
    };
    
    sortedRootIssues.forEach(addIssueAndChildren);
    
    return ids;
  }, [sortedRootIssues, expandedIds, getIssuesByParentId, sortConfig, filters.types]);

  // Get children for an issue (with filtering and sorting applied)
  const getChildrenForIssue = useCallback((issueId: string): Issue[] => {
    let children = getIssuesByParentId(issueId);
    
    // Apply type filter
    if (filters.types.length > 0) {
      children = children.filter(issue => filters.types.includes(issue.type));
    }
    
    // Apply sorting
    return sortIssues(children, sortConfig);
  }, [getIssuesByParentId, filters.types, sortConfig]);

  // Get all issue IDs with children (for expand all)
  const getAllParentIds = useMemo(() => {
    return issues
      .filter(issue => issue.childIds.length > 0)
      .map(issue => issue.id);
  }, [issues]);

  // Node ref callback for keyboard navigation
  const setNodeRef = useCallback((issueId: string, element: HTMLDivElement | null) => {
    if (element) {
      nodeRefs.current.set(issueId, element);
    } else {
      nodeRefs.current.delete(issueId);
    }
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleExpandAll = useCallback(() => {
    expandAll(getAllParentIds);
  }, [expandAll, getAllParentIds]);

  const handleCollapseAll = useCallback(() => {
    collapseAll();
  }, [collapseAll]);

  const handleToggleExpand = useCallback((issueId: string) => {
    toggleIssueExpanded(issueId);
  }, [toggleIssueExpanded]);

  const handleTypeFilterChange = useCallback((types: IssueType[]) => {
    setFilter('types', types);
  }, [setFilter]);

  const handleSortChange = useCallback((config: SortConfig | null) => {
    setSortConfig(config);
  }, [setSortConfig]);

  const handleIssueClick = useCallback((issue: Issue, event: React.MouseEvent) => {
    // Ctrl/Cmd + click: toggle selection
    if (event.ctrlKey || event.metaKey) {
      toggleIssueSelection(issue.id);
    }
    // Shift + click: range selection
    else if (event.shiftKey && lastSelectedId.current) {
      selectRange(lastSelectedId.current, issue.id, visibleIssueIds);
    }
    // Normal click: single selection
    else {
      selectMultipleIssues([issue.id]);
    }
    
    lastSelectedId.current = issue.id;
    setFocusedIssue(issue.id);
  }, [toggleIssueSelection, selectRange, selectMultipleIssues, setFocusedIssue, visibleIssueIds]);

  const handleIssueDoubleClick = useCallback((issue: Issue) => {
    openDetailPanel(issue.id);
  }, [openDetailPanel]);

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!focusedIssueId) {
      // If nothing focused, focus the first item
      if (visibleIssueIds.length > 0 && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        setFocusedIssue(visibleIssueIds[0]);
        return;
      }
      return;
    }

    const currentIndex = visibleIssueIds.indexOf(focusedIssueId);
    if (currentIndex === -1) return;

    const currentIssue = issues.find(i => i.id === focusedIssueId);
    if (!currentIssue) return;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = currentIndex + 1;
        if (nextIndex < visibleIssueIds.length) {
          const nextId = visibleIssueIds[nextIndex];
          setFocusedIssue(nextId);
          
          // Scroll into view
          const nextElement = nodeRefs.current.get(nextId);
          nextElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        break;
      }

      case 'ArrowUp': {
        event.preventDefault();
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          const prevId = visibleIssueIds[prevIndex];
          setFocusedIssue(prevId);
          
          // Scroll into view
          const prevElement = nodeRefs.current.get(prevId);
          prevElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        break;
      }

      case 'ArrowRight': {
        event.preventDefault();
        if (currentIssue.childIds.length > 0) {
          if (!expandedIds.has(focusedIssueId)) {
            // Expand if collapsed
            expandIssue(focusedIssueId);
          } else {
            // Move to first child if already expanded
            const children = getChildrenForIssue(focusedIssueId);
            if (children.length > 0) {
              setFocusedIssue(children[0].id);
            }
          }
        }
        break;
      }

      case 'ArrowLeft': {
        event.preventDefault();
        if (expandedIds.has(focusedIssueId) && currentIssue.childIds.length > 0) {
          // Collapse if expanded
          collapseIssue(focusedIssueId);
        } else if (currentIssue.parentId) {
          // Move to parent if collapsed or no children
          setFocusedIssue(currentIssue.parentId);
          
          // Scroll into view
          const parentElement = nodeRefs.current.get(currentIssue.parentId);
          parentElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        break;
      }

      case 'Enter': {
        event.preventDefault();
        // Open detail panel
        openDetailPanel(focusedIssueId);
        break;
      }

      case ' ': {
        event.preventDefault();
        // Toggle selection
        toggleIssueSelection(focusedIssueId);
        break;
      }

      case 'Home': {
        event.preventDefault();
        if (visibleIssueIds.length > 0) {
          setFocusedIssue(visibleIssueIds[0]);
          const firstElement = nodeRefs.current.get(visibleIssueIds[0]);
          firstElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
        break;
      }

      case 'End': {
        event.preventDefault();
        if (visibleIssueIds.length > 0) {
          const lastId = visibleIssueIds[visibleIssueIds.length - 1];
          setFocusedIssue(lastId);
          const lastElement = nodeRefs.current.get(lastId);
          lastElement?.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
        break;
      }
    }
  }, [
    focusedIssueId,
    visibleIssueIds,
    issues,
    expandedIds,
    setFocusedIssue,
    expandIssue,
    collapseIssue,
    getChildrenForIssue,
    openDetailPanel,
    toggleIssueSelection,
  ]);

  // Focus container on mount to enable keyboard navigation
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state
  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <svg className="animate-spin h-8 w-8 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="font-medium">Loading issues...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <div className="flex flex-col items-center justify-center text-red-600">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-medium">Error loading issues</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedRootIssues.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <TreeToolbar
          totalIssues={issues.length}
          rootIssueCount={0}
          typeFilters={filters.types}
          sortConfig={sortConfig}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onTypeFilterChange={handleTypeFilterChange}
          onSortChange={handleSortChange}
        />
        
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium">No issues found</p>
            {filters.types.length > 0 ? (
              <p className="text-sm mt-1">Try adjusting your filters</p>
            ) : (
              <p className="text-sm mt-1">Create your first issue to get started</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Toolbar */}
      <TreeToolbar
        totalIssues={issues.length}
        rootIssueCount={sortedRootIssues.length}
        typeFilters={filters.types}
        sortConfig={sortConfig}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onTypeFilterChange={handleTypeFilterChange}
        onSortChange={handleSortChange}
      />

      {/* Tree container */}
      <div
        ref={containerRef}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="tree"
        aria-label="Issue hierarchy"
      >
        <div className="divide-y divide-gray-100">
          {sortedRootIssues.map(issue => (
            <TreeNode
              key={issue.id}
              issue={issue}
              depth={0}
              isExpanded={expandedIds.has(issue.id)}
              children={getChildrenForIssue(issue.id)}
              expandedIds={expandedIds}
              getChildrenForIssue={getChildrenForIssue}
              isFocused={focusedIssueId === issue.id}
              onToggleExpand={handleToggleExpand}
              onIssueClick={handleIssueClick}
              onIssueDoubleClick={handleIssueDoubleClick}
              nodeRef={setNodeRef}
            />
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-3 text-xs text-gray-400 flex items-center gap-4">
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">↑↓</kbd> Navigate
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">←→</kbd> Collapse/Expand
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Enter</kbd> Open details
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Space</kbd> Select
        </span>
      </div>
    </div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { TreeViewProps };
