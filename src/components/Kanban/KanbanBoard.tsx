/**
 * KanbanBoard - Main Kanban board container
 * 
 * Features:
 * - Horizontal scrollable layout with status columns
 * - Groups issues by status (To Do, In Progress, In Review, Done)
 * - Column headers with issue counts
 * - Empty and loading states
 * - Integration with issue store and UI store
 */

import { useMemo } from 'react';
import { useIssueStore, useUIStore } from '../../store';
import { IssueStatus, Issue, FilterState } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanToolbar } from './KanbanToolbar';

// ============================================================================
// TYPES
// ============================================================================

export interface KanbanBoardProps {
  className?: string;
}

export interface KanbanSwimlane {
  id: string;
  label: string;
  issues: Issue[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Column definitions with status colors
 */
export const KANBAN_COLUMNS = [
  { status: IssueStatus.Todo, label: 'To Do', color: 'bg-gray-400', headerBg: 'bg-gray-50' },
  { status: IssueStatus.InProgress, label: 'In Progress', color: 'bg-blue-500', headerBg: 'bg-blue-50' },
  { status: IssueStatus.InReview, label: 'In Review', color: 'bg-yellow-500', headerBg: 'bg-yellow-50' },
  { status: IssueStatus.Done, label: 'Done', color: 'bg-green-500', headerBg: 'bg-green-50' },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Filter issues based on filter state
 */
function filterIssues(issues: Issue[], filters: FilterState): Issue[] {
  return issues.filter(issue => {
    // Filter by types
    if (filters.types.length > 0 && !filters.types.includes(issue.type)) {
      return false;
    }
    
    // Filter by statuses
    if (filters.statuses.length > 0 && !filters.statuses.includes(issue.status)) {
      return false;
    }
    
    // Filter by priorities
    if (filters.priorities.length > 0 && !filters.priorities.includes(issue.priority)) {
      return false;
    }
    
    // Filter by assignees
    if (filters.assignees.length > 0) {
      if (!issue.assignee || !filters.assignees.includes(issue.assignee)) {
        return false;
      }
    }
    
    // Filter by sprints
    if (filters.sprints.length > 0) {
      if (!issue.sprint || !filters.sprints.includes(issue.sprint)) {
        return false;
      }
    }
    
    // Filter by labels
    if (filters.labels.length > 0) {
      if (!filters.labels.some(label => issue.labels.includes(label))) {
        return false;
      }
    }
    
    // Filter by parent
    if (filters.parentId && issue.parentId !== filters.parentId) {
      return false;
    }
    
    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesTitle = issue.title.toLowerCase().includes(searchLower);
      const matchesKey = issue.key.toLowerCase().includes(searchLower);
      const matchesDescription = issue.description.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesKey && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Group issues by status for columns
 */
function groupIssuesByStatus(issues: Issue[]): Map<IssueStatus, Issue[]> {
  const grouped = new Map<IssueStatus, Issue[]>();
  
  // Initialize all statuses with empty arrays
  Object.values(IssueStatus).forEach(status => {
    grouped.set(status, []);
  });
  
  // Group issues
  issues.forEach(issue => {
    const statusIssues = grouped.get(issue.status) || [];
    statusIssues.push(issue);
    grouped.set(issue.status, statusIssues);
  });
  
  return grouped;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function KanbanBoard({ className = '' }: KanbanBoardProps) {
  // Store hooks
  const issues = useIssueStore(state => state.issues);
  const loading = useIssueStore(state => state.loading);
  const filters = useUIStore(state => state.filters);
  const openDetailPanel = useUIStore(state => state.openDetailPanel);
  const toggleIssueSelection = useUIStore(state => state.toggleIssueSelection);

  // Local state for toolbar - will be expanded in Step 4.3 for swimlanes
  // For now, groupBy is managed in toolbar but not used for swimlanes yet
  
  // Filter and group issues
  const { groupedIssues, totalCount } = useMemo(() => {
    const filtered = filterIssues(issues, filters);
    const grouped = groupIssuesByStatus(filtered);
    return {
      groupedIssues: grouped,
      totalCount: filtered.length,
    };
  }, [issues, filters]);

  // Event handlers
  const handleIssueClick = (issue: Issue) => {
    toggleIssueSelection(issue.id);
  };

  const handleIssueDoubleClick = (issue: Issue) => {
    openDetailPanel(issue.id);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading issues...</p>
        </div>
      </div>
    );
  }

  // Empty state (no issues at all)
  if (issues.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No issues yet</h3>
          <p className="text-sm text-gray-500">Create your first issue to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Toolbar */}
      <KanbanToolbar 
        totalCount={totalCount}
        className="px-4 pt-4"
      />

      {/* Kanban columns */}
      <div className="flex-1 flex gap-4 overflow-x-auto p-4 pb-6">
        {KANBAN_COLUMNS.map(column => {
          const columnIssues = groupedIssues.get(column.status) || [];
          
          return (
            <KanbanColumn
              key={column.status}
              status={column.status}
              label={column.label}
              color={column.color}
              headerBg={column.headerBg}
              issues={columnIssues}
              onIssueClick={handleIssueClick}
              onIssueDoubleClick={handleIssueDoubleClick}
            />
          );
        })}
      </div>

      {/* Filtered results indicator */}
      {totalCount !== issues.length && (
        <div className="px-4 pb-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-700">
            Showing {totalCount} of {issues.length} issues (filtered)
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { KANBAN_COLUMNS as kanbanColumns };
