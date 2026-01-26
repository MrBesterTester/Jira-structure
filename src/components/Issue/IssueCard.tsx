/**
 * IssueCard - Main issue display component
 * 
 * Supports two display modes:
 * - Compact: For tree view (single line, minimal info)
 * - Expanded: For kanban cards (full card with more details)
 * 
 * Features:
 * - Type icon with color
 * - Status badge
 * - Priority indicator
 * - Assignee avatar
 * - Story points (if set)
 * - Selection state
 */

import { memo } from 'react';
import type { Issue, User } from '../../types';
import { useUIStore, useUserStore, useIssueStore } from '../../store';
import { IssueTypeIcon } from './IssueTypeIcon';
import { StatusBadge, StatusDot } from './StatusBadge';
import { PriorityIndicator } from './PriorityIndicator';

// ============================================================================
// TYPES
// ============================================================================

interface IssueCardProps {
  issue: Issue;
  mode?: 'compact' | 'expanded';
  showStatus?: boolean;
  showPriority?: boolean;
  showAssignee?: boolean;
  showStoryPoints?: boolean;
  showParent?: boolean;
  onClick?: (issue: Issue) => void;
  onDoubleClick?: (issue: Issue) => void;
  className?: string;
}

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

interface AvatarProps {
  user: User | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarSizes = {
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-6 h-6 text-xs',
  lg: 'w-8 h-8 text-sm',
};

function Avatar({ user, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = avatarSizes[size];
  
  if (!user) {
    return (
      <div 
        className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center ${className}`}
        title="Unassigned"
      >
        <svg className="w-3/5 h-3/5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  if (user.avatarUrl) {
    return (
      <img 
        src={user.avatarUrl}
        alt={user.displayName}
        title={user.displayName}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  // Fallback to initials
  const initials = user.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className={`${sizeClass} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium ${className}`}
      title={user.displayName}
    >
      {initials}
    </div>
  );
}

// ============================================================================
// STORY POINTS BADGE
// ============================================================================

interface StoryPointsBadgeProps {
  points: number;
  size?: 'sm' | 'md';
}

function StoryPointsBadge({ points, size = 'md' }: StoryPointsBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1 py-0.5 min-w-[16px]' 
    : 'text-xs px-1.5 py-0.5 min-w-[20px]';
  
  return (
    <span 
      className={`${sizeClasses} bg-gray-100 text-gray-600 rounded font-medium text-center inline-block`}
      title={`${points} story points`}
    >
      {points}
    </span>
  );
}

// ============================================================================
// COMPACT CARD (for Tree View)
// ============================================================================

interface CompactCardProps {
  issue: Issue;
  isSelected: boolean;
  isFocused: boolean;
  showStatus?: boolean | undefined;
  showPriority?: boolean | undefined;
  showAssignee?: boolean | undefined;
  showStoryPoints?: boolean | undefined;
  onClick?: ((issue: Issue) => void) | undefined;
  onDoubleClick?: ((issue: Issue) => void) | undefined;
  className?: string | undefined;
}

const CompactCard = memo(function CompactCard({
  issue,
  isSelected,
  isFocused,
  showStatus = true,
  showPriority = true,
  showAssignee = true,
  showStoryPoints = true,
  onClick,
  onDoubleClick,
  className = '',
}: CompactCardProps) {
  const getUserById = useUserStore(state => state.getUserById);
  const assignee = issue.assignee ? getUserById(issue.assignee) : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(issue);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(issue);
  };

  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5
        rounded transition-colors cursor-pointer
        ${isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}
        ${isFocused ? 'ring-2 ring-blue-400' : ''}
        ${className}
      `.trim()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
    >
      {/* Type Icon */}
      <IssueTypeIcon type={issue.type} size="sm" />

      {/* Issue Key */}
      <span className="text-xs font-mono text-gray-500 min-w-[72px] shrink-0">
        {issue.key}
      </span>

      {/* Priority */}
      {showPriority && (
        <PriorityIndicator priority={issue.priority} size="sm" />
      )}

      {/* Title */}
      <span className="flex-1 text-sm text-gray-900 truncate">
        {issue.title}
      </span>

      {/* Story Points */}
      {showStoryPoints && issue.storyPoints && (
        <StoryPointsBadge points={issue.storyPoints} size="sm" />
      )}

      {/* Status */}
      {showStatus && (
        <StatusDot status={issue.status} size="sm" />
      )}

      {/* Assignee */}
      {showAssignee && (
        <Avatar user={assignee} size="sm" />
      )}
    </div>
  );
});

// ============================================================================
// EXPANDED CARD (for Kanban View)
// ============================================================================

interface ExpandedCardProps {
  issue: Issue;
  isSelected: boolean;
  isFocused: boolean;
  parentIssue?: Issue | undefined;
  showStatus?: boolean | undefined;
  showPriority?: boolean | undefined;
  showAssignee?: boolean | undefined;
  showStoryPoints?: boolean | undefined;
  showParent?: boolean | undefined;
  onClick?: ((issue: Issue) => void) | undefined;
  onDoubleClick?: ((issue: Issue) => void) | undefined;
  className?: string | undefined;
}

const ExpandedCard = memo(function ExpandedCard({
  issue,
  isSelected,
  isFocused,
  parentIssue,
  showStatus = true,
  showPriority = true,
  showAssignee = true,
  showStoryPoints = true,
  showParent = true,
  onClick,
  onDoubleClick,
  className = '',
}: ExpandedCardProps) {
  const getUserById = useUserStore(state => state.getUserById);
  const assignee = issue.assignee ? getUserById(issue.assignee) : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(issue);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(issue);
  };

  return (
    <div
      className={`
        bg-white rounded-lg border shadow-sm
        p-3 transition-all cursor-pointer
        ${isSelected 
          ? 'border-blue-300 ring-1 ring-blue-200 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
        ${isFocused ? 'ring-2 ring-blue-400' : ''}
        ${className}
      `.trim()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
    >
      {/* Header: Type icon + Story Points */}
      <div className="flex items-start justify-between gap-2">
        <IssueTypeIcon type={issue.type} size="md" />
        
        <div className="flex items-center gap-1.5">
          {showPriority && (
            <PriorityIndicator priority={issue.priority} size="sm" />
          )}
          {showStoryPoints && issue.storyPoints && (
            <StoryPointsBadge points={issue.storyPoints} />
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm text-gray-900 mt-2 line-clamp-2 leading-snug">
        {issue.title}
      </p>

      {/* Parent breadcrumb (if applicable) */}
      {showParent && parentIssue && (
        <p className="text-xs text-gray-400 mt-1 truncate">
          <span className="font-medium">{parentIssue.key}</span>
          <span className="mx-1">•</span>
          <span>{parentIssue.title}</span>
        </p>
      )}

      {/* Footer: Key + Status + Assignee */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <span className="text-xs font-mono text-gray-400">
          {issue.key}
        </span>
        
        <div className="flex items-center gap-2">
          {showStatus && (
            <StatusBadge status={issue.status} size="sm" />
          )}
          {showAssignee && (
            <Avatar user={assignee} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IssueCard = memo(function IssueCard({
  issue,
  mode = 'compact',
  showStatus = true,
  showPriority = true,
  showAssignee = true,
  showStoryPoints = true,
  showParent = false,
  onClick,
  onDoubleClick,
  className = '',
}: IssueCardProps) {
  const selectedIssueIds = useUIStore(state => state.selectedIssueIds);
  const focusedIssueId = useUIStore(state => state.focusedIssueId);
  const getIssueById = useIssueStore(state => state.getIssueById);
  
  const isSelected = selectedIssueIds.includes(issue.id);
  const isFocused = focusedIssueId === issue.id;
  const parentIssue = issue.parentId ? getIssueById(issue.parentId) : undefined;

  if (mode === 'compact') {
    return (
      <CompactCard
        issue={issue}
        isSelected={isSelected}
        isFocused={isFocused}
        showStatus={showStatus}
        showPriority={showPriority}
        showAssignee={showAssignee}
        showStoryPoints={showStoryPoints}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={className}
      />
    );
  }

  return (
    <ExpandedCard
      issue={issue}
      isSelected={isSelected}
      isFocused={isFocused}
      parentIssue={parentIssue}
      showStatus={showStatus}
      showPriority={showPriority}
      showAssignee={showAssignee}
      showStoryPoints={showStoryPoints}
      showParent={showParent}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={className}
    />
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export { Avatar, StoryPointsBadge };
