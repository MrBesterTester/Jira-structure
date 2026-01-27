/**
 * KanbanSwimlane - Horizontal row containing all status columns for one group
 * 
 * Features:
 * - Collapsible header with group name and issue count
 * - Contains all status columns within the swimlane
 * - Drop zones for each status within the swimlane
 * - Alternating background colors
 * - Smooth collapse/expand animation
 */

import { memo, useState, useCallback } from 'react';
import { IssueStatus, Issue, Priority, IssueType } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { KANBAN_COLUMNS } from './KanbanBoard';
import { Avatar } from '../Issue/IssueCard';
import { IssueTypeIcon } from '../Issue/IssueTypeIcon';
import { PriorityIndicator } from '../Issue/PriorityIndicator';
import { useUserStore } from '../../store';

// ============================================================================
// TYPES
// ============================================================================

export type GroupByOption = 'none' | 'assignee' | 'priority' | 'epic';

export interface SwimlaneDef {
  id: string;
  label: string;
  sublabel?: string;
  issues: Issue[];
  // For rendering icons
  type?: 'assignee' | 'priority' | 'epic' | 'unassigned';
  meta?: {
    userId?: string;
    priority?: Priority;
    epicKey?: string;
  };
}

export interface KanbanSwimlaneProps {
  /** Swimlane definition */
  swimlane: SwimlaneDef;
  /** Index for alternating colors */
  index: number;
  /** ID of the currently dragging card */
  draggingId?: string | null;
  /** Current drop target column status */
  dragOverColumnId?: IssueStatus | null;
  /** Current drop target swimlane ID */
  dragOverSwimlaneId?: string | null;
  /** Callback when an issue card is clicked */
  onIssueClick?: (issue: Issue, event?: React.MouseEvent) => void;
  /** Callback when an issue card is double-clicked */
  onIssueDoubleClick?: (issue: Issue) => void;
  /** Callback when checkbox is changed */
  onCheckboxChange?: (issue: Issue) => void;
  /** Callback when add issue button is clicked in a column */
  onAddIssue?: (status: IssueStatus) => void;
  /** Whether this swimlane is initially collapsed */
  defaultCollapsed?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// HELPER: Group issues by status within a swimlane
// ============================================================================

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
// SWIMLANE HEADER ICON
// ============================================================================

interface SwimlaneIconProps {
  swimlane: SwimlaneDef;
}

const SwimlaneIcon = memo(function SwimlaneIcon({ swimlane }: SwimlaneIconProps) {
  const getUserById = useUserStore(state => state.getUserById);
  
  if (swimlane.type === 'unassigned') {
    return (
      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    );
  }
  
  if (swimlane.type === 'assignee' && swimlane.meta?.userId) {
    const user = getUserById(swimlane.meta.userId);
    return <Avatar user={user} size="md" />;
  }
  
  if (swimlane.type === 'priority' && swimlane.meta?.priority) {
    return <PriorityIndicator priority={swimlane.meta.priority} size="lg" />;
  }
  
  if (swimlane.type === 'epic') {
    return <IssueTypeIcon type={IssueType.Epic} size="md" />;
  }
  
  return null;
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const KanbanSwimlane = memo(function KanbanSwimlane({
  swimlane,
  index,
  draggingId,
  dragOverColumnId,
  dragOverSwimlaneId,
  onIssueClick,
  onIssueDoubleClick,
  onCheckboxChange,
  onAddIssue,
  defaultCollapsed = false,
  className = '',
}: KanbanSwimlaneProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Group issues by status
  const groupedByStatus = groupIssuesByStatus(swimlane.issues);
  
  // Determine if this swimlane is the current drop target
  const isDropTarget = dragOverSwimlaneId === swimlane.id;
  
  // Toggle collapse
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);
  
  // Alternating background colors
  const bgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
  
  return (
    <div 
      className={`
        border-b border-gray-200 last:border-b-0
        transition-all duration-200
        ${isDropTarget ? 'ring-2 ring-inset ring-blue-300 bg-blue-50/30' : bgColor}
        ${className}
      `.trim()}
      data-swimlane-id={swimlane.id}
    >
      {/* Swimlane Header */}
      <div 
        className={`
          sticky left-0 z-10
          flex items-center gap-3 px-4 py-3
          cursor-pointer select-none
          hover:bg-gray-100/50 transition-colors
          ${isDropTarget ? 'bg-blue-100/30' : ''}
        `}
        onClick={handleToggleCollapse}
      >
        {/* Collapse/Expand Chevron */}
        <button
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleCollapse();
          }}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand swimlane' : 'Collapse swimlane'}
        >
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Swimlane Icon */}
        <SwimlaneIcon swimlane={swimlane} />
        
        {/* Swimlane Label */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900 truncate block">
            {swimlane.label}
          </span>
          {swimlane.sublabel && (
            <span className="text-xs text-gray-500 truncate block">
              {swimlane.sublabel}
            </span>
          )}
        </div>
        
        {/* Issue Count Badge */}
        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
          {swimlane.issues.length} issue{swimlane.issues.length !== 1 ? 's' : ''}
        </span>
        
        {/* Status distribution preview (when collapsed) */}
        {isCollapsed && (
          <div className="flex items-center gap-1 ml-2">
            {KANBAN_COLUMNS.map(column => {
              const count = groupedByStatus.get(column.status)?.length || 0;
              if (count === 0) return null;
              return (
                <div 
                  key={column.status}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                  title={`${column.label}: ${count}`}
                >
                  <div className={`w-2 h-2 rounded-full ${column.color}`} />
                  <span className="text-gray-600">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Swimlane Content - Columns */}
      <div 
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}
        `}
      >
        <div className="flex gap-4 px-4 pb-4 overflow-x-auto">
          {KANBAN_COLUMNS.map(column => {
            const columnIssues = groupedByStatus.get(column.status) || [];
            const isColumnDropTarget = isDropTarget && dragOverColumnId === column.status;
            
            return (
              <KanbanColumn
                key={`${swimlane.id}-${column.status}`}
                status={column.status}
                label={column.label}
                color={column.color}
                headerBg={column.headerBg}
                issues={columnIssues}
                draggingId={draggingId ?? null}
                isDropTarget={isColumnDropTarget}
                {...(onIssueClick && { onIssueClick })}
                {...(onIssueDoubleClick && { onIssueDoubleClick })}
                {...(onCheckboxChange && { onCheckboxChange })}
                {...(onAddIssue && { onAddIssue })}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { SwimlaneDef as KanbanSwimlaneDef };
