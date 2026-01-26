/**
 * PriorityIndicator - Visual indicator for issue priority
 * 
 * Uses arrows and colors to show priority:
 * - Highest: Red double up arrow
 * - High: Orange up arrow
 * - Medium: Yellow minus
 * - Low: Blue down arrow
 * - Lowest: Gray double down arrow
 */

import { Priority } from '../../types';

interface PriorityIndicatorProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Priority configuration with colors and icons
 */
const priorityConfig: Record<Priority, {
  text: string;
  bg: string;
  label: string;
  icon: React.ReactNode;
}> = {
  [Priority.Highest]: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    label: 'Highest',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M8 12a.5.5 0 00.5-.5V5.707l2.146 2.147a.5.5 0 00.708-.708l-3-3a.5.5 0 00-.708 0l-3 3a.5.5 0 10.708.708L7.5 5.707V11.5a.5.5 0 00.5.5z" clipRule="evenodd"/>
        <path fillRule="evenodd" d="M8 7a.5.5 0 00.5-.5V2.707l2.146 2.147a.5.5 0 00.708-.708l-3-3a.5.5 0 00-.708 0l-3 3a.5.5 0 10.708.708L7.5 2.707V6.5a.5.5 0 00.5.5z" clipRule="evenodd"/>
      </svg>
    ),
  },
  [Priority.High]: {
    text: 'text-orange-500',
    bg: 'bg-orange-50',
    label: 'High',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M8 12a.5.5 0 00.5-.5V5.707l2.146 2.147a.5.5 0 00.708-.708l-3-3a.5.5 0 00-.708 0l-3 3a.5.5 0 10.708.708L7.5 5.707V11.5a.5.5 0 00.5.5z" clipRule="evenodd"/>
      </svg>
    ),
  },
  [Priority.Medium]: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    label: 'Medium',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M2 8a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11A.5.5 0 012 8z" clipRule="evenodd"/>
      </svg>
    ),
  },
  [Priority.Low]: {
    text: 'text-blue-500',
    bg: 'bg-blue-50',
    label: 'Low',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M8 4a.5.5 0 01.5.5v5.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L7.5 10.293V4.5A.5.5 0 018 4z" clipRule="evenodd"/>
      </svg>
    ),
  },
  [Priority.Lowest]: {
    text: 'text-gray-400',
    bg: 'bg-gray-50',
    label: 'Lowest',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M8 4a.5.5 0 01.5.5v5.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L7.5 10.293V4.5A.5.5 0 018 4z" clipRule="evenodd"/>
        <path fillRule="evenodd" d="M8 9a.5.5 0 01.5.5v3.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L7.5 13.293V9.5A.5.5 0 018 9z" clipRule="evenodd"/>
      </svg>
    ),
  },
};

/**
 * Size configuration
 */
const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    padding: 'px-1 py-0.5',
    gap: 'gap-0.5',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-sm',
    padding: 'px-2 py-1',
    gap: 'gap-1',
  },
};

export function PriorityIndicator({ 
  priority, 
  size = 'md', 
  showLabel = false,
  className = '' 
}: PriorityIndicatorProps) {
  const config = priorityConfig[priority];
  const sizes = sizeConfig[size];

  if (showLabel) {
    return (
      <span
        className={`
          inline-flex items-center ${sizes.gap} ${sizes.padding}
          ${config.bg} ${config.text}
          rounded font-medium ${sizes.text}
          ${className}
        `.trim()}
        title={config.label}
      >
        <span className={sizes.icon}>{config.icon}</span>
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center ${config.text} ${className}`}
      title={config.label}
    >
      <span className={sizes.icon}>{config.icon}</span>
    </span>
  );
}

/**
 * Get priority configuration for external use
 */
export function getPriorityConfig(priority: Priority) {
  return priorityConfig[priority];
}

/**
 * Get all priorities with their labels
 */
export function getAllPriorities(): Array<{ priority: Priority; label: string }> {
  return Object.values(Priority).map(priority => ({
    priority,
    label: priorityConfig[priority].label,
  }));
}
