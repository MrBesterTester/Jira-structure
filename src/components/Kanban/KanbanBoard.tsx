/**
 * KanbanBoard - Main Kanban board container with drag-and-drop
 * 
 * Features:
 * - Horizontal scrollable layout with status columns
 * - Groups issues by status (To Do, In Progress, In Review, Done)
 * - Drag-and-drop cards between columns to change status
 * - Column headers with issue counts
 * - Empty and loading states
 * - Integration with issue store and UI store
 */

import { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useIssueStore, useUIStore } from '../../store';
import { IssueStatus, Issue, FilterState } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
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
  const updateIssueStatus = useIssueStore(state => state.updateIssueStatus);
  const filters = useUIStore(state => state.filters);
  const openDetailPanel = useUIStore(state => state.openDetailPanel);
  const toggleIssueSelection = useUIStore(state => state.toggleIssueSelection);

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<IssueStatus | null>(null);
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);

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

  // ============================================================================
  // DRAG AND DROP SENSORS
  // ============================================================================

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  // ============================================================================
  // DRAG HANDLERS
  // ============================================================================

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const issue = issues.find(i => i.id === active.id);
    
    if (issue) {
      setDraggingId(active.id as string);
      setDraggedIssue(issue);
    }
  }, [issues]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    
    if (over) {
      // Check if we're over a column (column IDs are status values)
      const overId = over.id as string;
      if (Object.values(IssueStatus).includes(overId as IssueStatus)) {
        setDragOverColumnId(overId as IssueStatus);
      } else {
        // We're over a card - find its column
        const overIssue = issues.find(i => i.id === overId);
        if (overIssue) {
          setDragOverColumnId(overIssue.status);
        }
      }
    } else {
      setDragOverColumnId(null);
    }
  }, [issues]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset drag state
    setDraggingId(null);
    setDragOverColumnId(null);
    setDraggedIssue(null);
    
    if (!over) {
      return;
    }

    const draggedId = active.id as string;
    const overId = over.id as string;
    
    // Find the dragged issue
    const draggedIssueData = issues.find(i => i.id === draggedId);
    if (!draggedIssueData) return;

    // Determine target status
    let targetStatus: IssueStatus;
    
    // Check if dropped on a column directly
    if (Object.values(IssueStatus).includes(overId as IssueStatus)) {
      targetStatus = overId as IssueStatus;
    } else {
      // Dropped on another card - use that card's status
      const overIssue = issues.find(i => i.id === overId);
      if (!overIssue) return;
      targetStatus = overIssue.status;
    }

    // Only update if status is changing
    if (draggedIssueData.status !== targetStatus) {
      await updateIssueStatus(draggedId, targetStatus);
    }
  }, [issues, updateIssueStatus]);

  const handleDragCancel = useCallback(() => {
    setDraggingId(null);
    setDragOverColumnId(null);
    setDraggedIssue(null);
  }, []);

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

      {/* Kanban columns with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto p-4 pb-6">
          {KANBAN_COLUMNS.map(column => {
            const columnIssues = groupedIssues.get(column.status) || [];
            const isDropTarget = dragOverColumnId === column.status;
            
            return (
              <KanbanColumn
                key={column.status}
                status={column.status}
                label={column.label}
                color={column.color}
                headerBg={column.headerBg}
                issues={columnIssues}
                draggingId={draggingId}
                isDropTarget={isDropTarget}
                onIssueClick={handleIssueClick}
                onIssueDoubleClick={handleIssueDoubleClick}
              />
            );
          })}
        </div>

        {/* Drag overlay - shows a preview of the dragged card */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {draggedIssue ? (
            <div className="w-72">
              <KanbanCard
                issue={draggedIssue}
                isDragging
                className="shadow-xl rotate-2 scale-105"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
