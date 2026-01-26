/**
 * StatusBadge - Displays a colored badge for issue status
 * 
 * Visual status indicators:
 * - To Do: Gray
 * - In Progress: Blue
 * - In Review: Yellow/Amber
 * - Done: Green
 */

import { IssueStatus } from '../../types';

interface StatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

/**
 * Color configuration for each status
 */
const statusConfig: Record<IssueStatus, {
  bg: string;
  text: string;
  dot: string;
  border: string;
  label: string;
}> = {
  [IssueStatus.Todo]: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    border: 'border-gray-200',
    label: 'To Do',
  },
  [IssueStatus.InProgress]: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
    label: 'In Progress',
  },
  [IssueStatus.InReview]: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
    label: 'In Review',
  },
  [IssueStatus.Done]: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    dot: 'bg-green-500',
    border: 'border-green-200',
    label: 'Done',
  },
};

/**
 * Size configuration for badges
 */
const sizeConfig = {
  sm: {
    padding: 'px-1.5 py-0.5',
    text: 'text-xs',
    dot: 'w-1.5 h-1.5',
    gap: 'gap-1',
  },
  md: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    dot: 'w-2 h-2',
    gap: 'gap-1.5',
  },
  lg: {
    padding: 'px-2.5 py-1',
    text: 'text-sm',
    dot: 'w-2 h-2',
    gap: 'gap-1.5',
  },
};

export function StatusBadge({ 
  status, 
  size = 'md', 
  showDot = false,
  className = '' 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <span
      className={`
        inline-flex items-center ${sizes.gap}
        ${sizes.padding} ${sizes.text}
        ${config.bg} ${config.text}
        rounded-full font-medium
        ${className}
      `.trim()}
    >
      {showDot && (
        <span className={`${sizes.dot} rounded-full ${config.dot}`} />
      )}
      {config.label}
    </span>
  );
}

/**
 * A minimal dot-only status indicator
 */
interface StatusDotProps {
  status: IssueStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const dotSizes = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function StatusDot({ status, size = 'md', className = '' }: StatusDotProps) {
  const config = statusConfig[status];
  const sizeClass = dotSizes[size];

  return (
    <span
      className={`inline-block ${sizeClass} rounded-full ${config.dot} ${className}`}
      title={config.label}
    />
  );
}

/**
 * Get status configuration for external use
 */
export function getStatusConfig(status: IssueStatus) {
  return statusConfig[status];
}

/**
 * Get all statuses with their labels
 */
export function getAllStatuses(): Array<{ status: IssueStatus; label: string }> {
  return Object.values(IssueStatus).map(status => ({
    status,
    label: statusConfig[status].label,
  }));
}
