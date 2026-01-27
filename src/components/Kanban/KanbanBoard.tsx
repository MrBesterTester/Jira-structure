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
 * - Swimlane grouping by assignee, priority, or epic (Step 4.3)
 */

import { useMemo, useState, useCallback, useRef } from 'react';
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
import { useIssueStore, useUIStore, useUserStore } from '../../store';
import { IssueStatus, Issue, FilterState, Priority, IssueType } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { KanbanToolbar, GroupByOption } from './KanbanToolbar';
import { KanbanSwimlane, SwimlaneDef } from './KanbanSwimlane';

// ============================================================================
// TYPES
// ============================================================================

export interface KanbanBoardProps {
  className?: string;
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

/**
 * Create swimlanes grouped by assignee
 */
function createAssigneeSwimlanes(
  issues: Issue[], 
  users: { id: string; displayName: string }[]
): SwimlaneDef[] {
  const swimlaneMap = new Map<string, Issue[]>();
  
  // Group issues by assignee
  issues.forEach(issue => {
    const key = issue.assignee || '__unassigned__';
    const existing = swimlaneMap.get(key) || [];
    existing.push(issue);
    swimlaneMap.set(key, existing);
  });
  
  // Convert to swimlane definitions
  const swimlanes: SwimlaneDef[] = [];
  
  // Add unassigned first if it exists
  const unassignedIssues = swimlaneMap.get('__unassigned__');
  if (unassignedIssues && unassignedIssues.length > 0) {
    swimlanes.push({
      id: '__unassigned__',
      label: 'Unassigned',
      issues: unassignedIssues,
      type: 'unassigned',
    });
  }
  
  // Add user swimlanes
  users.forEach(user => {
    const userIssues = swimlaneMap.get(user.id);
    if (userIssues && userIssues.length > 0) {
      swimlanes.push({
        id: user.id,
        label: user.displayName,
        issues: userIssues,
        type: 'assignee',
        meta: { userId: user.id },
      });
    }
  });
  
  return swimlanes;
}

/**
 * Create swimlanes grouped by priority
 */
function createPrioritySwimlanes(issues: Issue[]): SwimlaneDef[] {
  const priorityOrder: Priority[] = [
    Priority.Highest,
    Priority.High,
    Priority.Medium,
    Priority.Low,
    Priority.Lowest,
  ];
  
  const swimlaneMap = new Map<Priority, Issue[]>();
  
  // Initialize all priorities
  priorityOrder.forEach(priority => {
    swimlaneMap.set(priority, []);
  });
  
  // Group issues by priority
  issues.forEach(issue => {
    const existing = swimlaneMap.get(issue.priority) || [];
    existing.push(issue);
    swimlaneMap.set(issue.priority, existing);
  });
  
  // Convert to swimlane definitions (only non-empty)
  return priorityOrder
    .filter(priority => (swimlaneMap.get(priority)?.length || 0) > 0)
    .map(priority => ({
      id: priority,
      label: priority,
      issues: swimlaneMap.get(priority) || [],
      type: 'priority' as const,
      meta: { priority },
    }));
}

/**
 * Create swimlanes grouped by epic
 */
function createEpicSwimlanes(
  issues: Issue[], 
  allIssues: Issue[]
): SwimlaneDef[] {
  const swimlaneMap = new Map<string, Issue[]>();
  
  // Get all epics for lookup
  const epics = allIssues.filter(i => i.type === IssueType.Epic);
  
  // Group issues by parent epic
  issues.forEach(issue => {
    // Find the epic ancestor
    let epicId: string | null = null;
    let current = issue;
    
    // Traverse up to find epic parent
    while (current.parentId) {
      const parent = allIssues.find(i => i.id === current.parentId);
      if (!parent) break;
      if (parent.type === IssueType.Epic) {
        epicId = parent.id;
        break;
      }
      current = parent;
    }
    
    // If issue itself is an epic, use its own id
    if (issue.type === IssueType.Epic) {
      epicId = issue.id;
    }
    
    const key = epicId || '__no_epic__';
    const existing = swimlaneMap.get(key) || [];
    existing.push(issue);
    swimlaneMap.set(key, existing);
  });
  
  // Convert to swimlane definitions
  const swimlanes: SwimlaneDef[] = [];
  
  // Add epic swimlanes
  epics.forEach(epic => {
    const epicIssues = swimlaneMap.get(epic.id);
    if (epicIssues && epicIssues.length > 0) {
      swimlanes.push({
        id: epic.id,
        label: epic.key,
        sublabel: epic.title,
        issues: epicIssues,
        type: 'epic',
        meta: { epicKey: epic.key },
      });
    }
  });
  
  // Add "No Epic" swimlane if exists
  const noEpicIssues = swimlaneMap.get('__no_epic__');
  if (noEpicIssues && noEpicIssues.length > 0) {
    swimlanes.push({
      id: '__no_epic__',
      label: 'No Epic',
      sublabel: 'Issues not linked to any epic',
      issues: noEpicIssues,
      type: 'unassigned',
    });
  }
  
  return swimlanes;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function KanbanBoard({ className = '' }: KanbanBoardProps) {
  // Store hooks
  const issues = useIssueStore(state => state.issues);
  const loading = useIssueStore(state => state.loading);
  const updateIssueStatus = useIssueStore(state => state.updateIssueStatus);
  const updateIssue = useIssueStore(state => state.updateIssue);
  const filters = useUIStore(state => state.filters);
  const openDetailPanel = useUIStore(state => state.openDetailPanel);
  const toggleIssueSelection = useUIStore(state => state.toggleIssueSelection);
  const selectMultipleIssues = useUIStore(state => state.selectMultipleIssues);
  const selectRange = useUIStore(state => state.selectRange);
  const openCreateIssueModal = useUIStore(state => state.openCreateIssueModal);
  const users = useUserStore(state => state.users);
  
  // Ref for last selected issue (for shift+click range selection)
  const lastSelectedId = useRef<string | null>(null);

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<IssueStatus | null>(null);
  const [dragOverSwimlaneId, setDragOverSwimlaneId] = useState<string | null>(null);
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);

  // Swimlane groupBy state (lifted from toolbar)
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  
  // Handle group by change from toolbar
  const handleGroupByChange = useCallback((newGroupBy: GroupByOption) => {
    setGroupBy(newGroupBy);
  }, []);
  
  // Filter issues
  const filteredIssues = useMemo(() => {
    return filterIssues(issues, filters);
  }, [issues, filters]);
  
  // Group issues by status (for non-swimlane view)
  const groupedIssues = useMemo(() => {
    return groupIssuesByStatus(filteredIssues);
  }, [filteredIssues]);
  
  // Create swimlanes based on groupBy
  const swimlanes = useMemo((): SwimlaneDef[] => {
    if (groupBy === 'none') return [];
    
    switch (groupBy) {
      case 'assignee':
        return createAssigneeSwimlanes(filteredIssues, users);
      case 'priority':
        return createPrioritySwimlanes(filteredIssues);
      case 'epic':
        return createEpicSwimlanes(filteredIssues, issues);
      default:
        return [];
    }
  }, [groupBy, filteredIssues, users, issues]);
  
  const totalCount = filteredIssues.length;

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
        // Try to determine swimlane from DOM
        const columnElement = document.querySelector(`[data-status="${overId}"]`);
        if (columnElement) {
          const swimlaneElement = columnElement.closest('[data-swimlane-id]');
          if (swimlaneElement) {
            setDragOverSwimlaneId(swimlaneElement.getAttribute('data-swimlane-id'));
          } else {
            setDragOverSwimlaneId(null);
          }
        }
      } else {
        // We're over a card - find its column and swimlane
        const overIssue = issues.find(i => i.id === overId);
        if (overIssue) {
          setDragOverColumnId(overIssue.status);
          
          // Determine swimlane based on groupBy
          if (groupBy === 'assignee') {
            setDragOverSwimlaneId(overIssue.assignee || '__unassigned__');
          } else if (groupBy === 'priority') {
            setDragOverSwimlaneId(overIssue.priority);
          } else if (groupBy === 'epic') {
            // Find epic parent
            let epicId: string | null = null;
            let current = overIssue;
            while (current.parentId) {
              const parent = issues.find(i => i.id === current.parentId);
              if (!parent) break;
              if (parent.type === IssueType.Epic) {
                epicId = parent.id;
                break;
              }
              current = parent;
            }
            if (overIssue.type === IssueType.Epic) {
              epicId = overIssue.id;
            }
            setDragOverSwimlaneId(epicId || '__no_epic__');
          }
        }
      }
    } else {
      setDragOverColumnId(null);
      setDragOverSwimlaneId(null);
    }
  }, [issues, groupBy]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Capture swimlane before resetting state
    const targetSwimlaneId = dragOverSwimlaneId;
    
    // Reset drag state
    setDraggingId(null);
    setDragOverColumnId(null);
    setDragOverSwimlaneId(null);
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

    // Track what needs to be updated
    const updates: Partial<Issue> = {};
    let needsUpdate = false;

    // Check if status is changing
    if (draggedIssueData.status !== targetStatus) {
      updates.status = targetStatus;
      needsUpdate = true;
    }
    
    // Handle cross-swimlane drag - update the grouped field
    if (groupBy !== 'none' && targetSwimlaneId) {
      // Determine the current swimlane of the dragged issue
      let currentSwimlaneId: string | null = null;
      
      if (groupBy === 'assignee') {
        currentSwimlaneId = draggedIssueData.assignee || '__unassigned__';
        
        // If moving to a different assignee swimlane
        if (targetSwimlaneId !== currentSwimlaneId) {
          const newAssignee = targetSwimlaneId === '__unassigned__' ? null : targetSwimlaneId;
          updates.assignee = newAssignee;
          needsUpdate = true;
        }
      } else if (groupBy === 'priority') {
        currentSwimlaneId = draggedIssueData.priority;
        
        // If moving to a different priority swimlane
        if (targetSwimlaneId !== currentSwimlaneId && 
            Object.values(Priority).includes(targetSwimlaneId as Priority)) {
          updates.priority = targetSwimlaneId as Priority;
          needsUpdate = true;
        }
      }
      // Note: Epic swimlane changes are more complex (would need to change parent)
      // For now, epic swimlanes don't support cross-swimlane reassignment
    }

    // Apply updates if needed
    if (needsUpdate) {
      if (Object.keys(updates).length === 1 && updates.status !== undefined) {
        // Only status changed - use the optimized status update
        await updateIssueStatus(draggedId, updates.status);
      } else {
        // Multiple fields changed - use the general update
        await updateIssue({ id: draggedId, ...updates });
      }
    }
  }, [issues, updateIssueStatus, updateIssue, groupBy, dragOverSwimlaneId]);

  const handleDragCancel = useCallback(() => {
    setDraggingId(null);
    setDragOverColumnId(null);
    setDragOverSwimlaneId(null);
    setDraggedIssue(null);
  }, []);

  // Build flat list of visible issue IDs for range selection
  const visibleIssueIds = useMemo(() => {
    return filteredIssues.map(issue => issue.id);
  }, [filteredIssues]);

  // Event handlers
  const handleIssueClick = useCallback((issue: Issue, event?: React.MouseEvent) => {
    // Ctrl/Cmd + click: toggle selection
    if (event?.ctrlKey || event?.metaKey) {
      toggleIssueSelection(issue.id);
    }
    // Shift + click: range selection
    else if (event?.shiftKey && lastSelectedId.current) {
      selectRange(lastSelectedId.current, issue.id, visibleIssueIds);
    }
    // Normal click: single selection
    else {
      selectMultipleIssues([issue.id]);
    }
    
    lastSelectedId.current = issue.id;
  }, [toggleIssueSelection, selectRange, selectMultipleIssues, visibleIssueIds]);

  const handleCheckboxChange = useCallback((issue: Issue) => {
    toggleIssueSelection(issue.id);
    lastSelectedId.current = issue.id;
  }, [toggleIssueSelection]);

  const handleIssueDoubleClick = useCallback((issue: Issue) => {
    openDetailPanel(issue.id);
  }, [openDetailPanel]);

  // Handle add issue from column
  const handleAddIssue = useCallback((status: IssueStatus) => {
    openCreateIssueModal(null, status);
  }, [openCreateIssueModal]);

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
        groupBy={groupBy}
        onGroupByChange={handleGroupByChange}
        className="px-4 pt-4"
      />

      {/* Kanban board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Swimlane view (when groupBy is active) */}
        {groupBy !== 'none' && swimlanes.length > 0 ? (
          <div className="flex-1 overflow-auto p-4 pb-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {swimlanes.map((swimlane, index) => (
                <KanbanSwimlane
                  key={swimlane.id}
                  swimlane={swimlane}
                  index={index}
                  draggingId={draggingId}
                  dragOverColumnId={dragOverColumnId}
                  dragOverSwimlaneId={dragOverSwimlaneId}
                  onIssueClick={handleIssueClick}
                  onIssueDoubleClick={handleIssueDoubleClick}
                  onCheckboxChange={handleCheckboxChange}
                  onAddIssue={handleAddIssue}
                />
              ))}
            </div>
            
            {/* Show empty state when no swimlanes */}
            {swimlanes.length === 0 && (
              <div className="flex items-center justify-center h-64 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center">
                  <p className="text-gray-500">No issues match the current filters</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Standard column view (no grouping) */
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
                  onCheckboxChange={handleCheckboxChange}
                  onAddIssue={handleAddIssue}
                />
              );
            })}
          </div>
        )}

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
