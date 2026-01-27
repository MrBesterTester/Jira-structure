/**
 * KanbanColumn - Single status column in the Kanban board
 * 
 * Features:
 * - Header with status name, count, and color indicator
 * - Scrollable card container
 * - Empty state when no issues
 * - Droppable zone (prepared for Phase 4.2 drag-and-drop)
 */

import { memo } from 'react';
import { IssueStatus, Issue } from '../../types';
import { KanbanCard } from './KanbanCard';

// ============================================================================
// TYPES
// ============================================================================

export interface KanbanColumnProps {
  /** The status this column represents */
  status: IssueStatus;
  /** Display label for the column header */
  label: string;
  /** Tailwind class for the status color dot */
  color: string;
  /** Tailwind class for the header background */
  headerBg: string;
  /** Issues to display in this column */
  issues: Issue[];
  /** Callback when an issue card is clicked */
  onIssueClick?: (issue: Issue) => void;
  /** Callback when an issue card is double-clicked */
  onIssueDoubleClick?: (issue: Issue) => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const KanbanColumn = memo(function KanbanColumn({
  status,
  label,
  color,
  headerBg,
  issues,
  onIssueClick,
  onIssueDoubleClick,
  className = '',
}: KanbanColumnProps) {
  return (
    <div 
      className={`
        flex-shrink-0 w-72 flex flex-col 
        bg-gray-100 rounded-lg 
        max-h-full
        ${className}
      `.trim()}
      data-status={status}
    >
      {/* Column header */}
      <div className={`p-3 rounded-t-lg ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Status color dot */}
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            
            {/* Status label */}
            <span className="font-medium text-sm text-gray-700">
              {label}
            </span>
            
            {/* Issue count */}
            <span className="text-xs text-gray-500 bg-white/60 px-1.5 py-0.5 rounded-full">
              {issues.length}
            </span>
          </div>

          {/* Column actions - placeholder for future add button */}
          <button 
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors"
            title={`Add issue to ${label}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable card container */}
      <div className="flex-1 overflow-y-auto p-2 pt-1 space-y-2 min-h-[100px]">
        {issues.length > 0 ? (
          issues.map(issue => (
            <KanbanCard
              key={issue.id}
              issue={issue}
              {...(onIssueClick && { onClick: onIssueClick })}
              {...(onIssueDoubleClick && { onDoubleClick: onIssueDoubleClick })}
            />
          ))
        ) : (
          <EmptyColumnState status={status} />
        )}
      </div>
    </div>
  );
});

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyColumnStateProps {
  status: IssueStatus;
}

function EmptyColumnState({ status }: EmptyColumnStateProps) {
  // Different messages based on status
  const getMessage = () => {
    switch (status) {
      case IssueStatus.Todo:
        return "No issues waiting to be started";
      case IssueStatus.InProgress:
        return "No issues in progress";
      case IssueStatus.InReview:
        return "No issues under review";
      case IssueStatus.Done:
        return "No completed issues";
      default:
        return "No issues";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-xs text-gray-400 text-center">
        {getMessage()}
      </p>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

// Type already exported with interface definition above
