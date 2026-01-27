/**
 * KanbanCard - Card component for Kanban board display
 * 
 * Features:
 * - Compact card layout optimized for Kanban columns
 * - Shows: key, title, type icon, priority, assignee
 * - Parent breadcrumb (if has parent)
 * - Story points badge
 * - Selection state with visual feedback
 * - Prepared for drag-and-drop (Phase 4.2)
 */

import { memo } from 'react';
import type { Issue } from '../../types';
import { useUIStore, useUserStore, useIssueStore } from '../../store';
import { IssueTypeIcon } from '../Issue/IssueTypeIcon';
import { PriorityIndicator } from '../Issue/PriorityIndicator';
import { Avatar, StoryPointsBadge } from '../Issue/IssueCard';

// ============================================================================
// TYPES
// ============================================================================

export interface KanbanCardProps {
  /** The issue to display */
  issue: Issue;
  /** Callback when card is clicked */
  onClick?: (issue: Issue) => void;
  /** Callback when card is double-clicked */
  onDoubleClick?: (issue: Issue) => void;
  /** Whether the card is being dragged (for Phase 4.2) */
  isDragging?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const KanbanCard = memo(function KanbanCard({
  issue,
  onClick,
  onDoubleClick,
  isDragging = false,
  className = '',
}: KanbanCardProps) {
  // Store hooks
  const selectedIssueIds = useUIStore(state => state.selectedIssueIds);
  const focusedIssueId = useUIStore(state => state.focusedIssueId);
  const getUserById = useUserStore(state => state.getUserById);
  const getIssueById = useIssueStore(state => state.getIssueById);
  
  // Derived state
  const isSelected = selectedIssueIds.includes(issue.id);
  const isFocused = focusedIssueId === issue.id;
  const assignee = issue.assignee ? getUserById(issue.assignee) : undefined;
  const parentIssue = issue.parentId ? getIssueById(issue.parentId) : undefined;

  // Event handlers
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(issue);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(issue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(issue);
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg border shadow-sm
        transition-all cursor-pointer
        ${isSelected 
          ? 'border-blue-300 ring-1 ring-blue-200 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
        ${isFocused ? 'ring-2 ring-blue-400' : ''}
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${className}
      `.trim()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      data-issue-id={issue.id}
    >
      {/* Card content */}
      <div className="p-3">
        {/* Header: Type icon + Priority + Story Points */}
        <div className="flex items-start justify-between gap-2">
          <IssueTypeIcon type={issue.type} size="md" />
          
          <div className="flex items-center gap-1.5">
            <PriorityIndicator priority={issue.priority} size="sm" />
            {issue.storyPoints && (
              <StoryPointsBadge points={issue.storyPoints} size="sm" />
            )}
          </div>
        </div>

        {/* Title */}
        <p className="text-sm text-gray-900 mt-2 line-clamp-2 leading-snug font-medium">
          {issue.title}
        </p>

        {/* Parent breadcrumb (if applicable) */}
        {parentIssue && (
          <div className="flex items-center gap-1 mt-1.5">
            <IssueTypeIcon type={parentIssue.type} size="sm" />
            <p className="text-xs text-gray-400 truncate flex-1">
              <span className="font-medium">{parentIssue.key}</span>
              <span className="mx-1">·</span>
              <span>{parentIssue.title}</span>
            </p>
          </div>
        )}

        {/* Labels (if any) */}
        {issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {issue.labels.slice(0, 3).map(label => (
              <span 
                key={label}
                className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded"
              >
                {label}
              </span>
            ))}
            {issue.labels.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-gray-400">
                +{issue.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: Key + Assignee */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <span className="text-xs font-mono text-gray-400">
            {issue.key}
          </span>
          
          <Avatar user={assignee} size="sm" />
        </div>
      </div>

      {/* Blocked indicator */}
      {issue.blockedBy.length > 0 && (
        <div className="px-3 pb-2 -mt-1">
          <div className="flex items-center gap-1 text-xs text-red-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
            <span>Blocked by {issue.blockedBy.length} issue{issue.blockedBy.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

// Type already exported with interface definition above
