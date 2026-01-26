/**
 * IssueTypeIcon - Displays an icon for each issue type
 * 
 * Uses different colored icons to visually distinguish between
 * Initiatives, Epics, Features, Stories, Tasks, Bugs, and Subtasks.
 */

import { IssueType } from '../../types';

interface IssueTypeIconProps {
  type: IssueType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Color and icon configuration for each issue type
 */
const typeConfig: Record<IssueType, { 
  bg: string; 
  text: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}> = {
  [IssueType.Initiative]: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Initiative',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path d="M8 1a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 1zm0 11a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 018 12zm7-4a.5.5 0 01-.5.5h-1a.5.5 0 010-1h1a.5.5 0 01.5.5zM3 8a.5.5 0 01-.5.5h-1a.5.5 0 010-1h1A.5.5 0 013 8zm9.354-3.646a.5.5 0 010 .707l-.707.707a.5.5 0 11-.707-.707l.707-.707a.5.5 0 01.707 0zM5.06 10.94a.5.5 0 010 .707l-.707.707a.5.5 0 01-.707-.707l.707-.707a.5.5 0 01.707 0zm7.88.707a.5.5 0 01-.707 0l-.707-.707a.5.5 0 11.707-.707l.707.707a.5.5 0 010 .707zM4.353 5.06a.5.5 0 01-.707 0l-.707-.707a.5.5 0 11.707-.707l.707.707a.5.5 0 010 .707z"/>
        <circle cx="8" cy="8" r="3"/>
      </svg>
    ),
  },
  [IssueType.Epic]: {
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-200',
    label: 'Epic',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M11.251.068a.5.5 0 01.227.58L9.677 6.5H13a.5.5 0 01.364.843l-8 8.5a.5.5 0 01-.842-.49L6.323 9.5H3a.5.5 0 01-.364-.843l8-8.5a.5.5 0 01.615-.089z" clipRule="evenodd"/>
      </svg>
    ),
  },
  [IssueType.Feature]: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    label: 'Feature',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm.25-11.25v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5a.75.75 0 011.5 0z"/>
      </svg>
    ),
  },
  [IssueType.Story]: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Story',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path d="M2.5 3A1.5 1.5 0 001 4.5v.793c.026.009.051.02.076.032L7.674 8.5 1.075 11.675A.48.48 0 001 11.706v.793A1.5 1.5 0 002.5 14h11a1.5 1.5 0 001.5-1.5v-.793a.48.48 0 00-.075-.031L8.326 8.5l6.599-3.175A.48.48 0 0015 5.293V4.5A1.5 1.5 0 0013.5 3h-11z"/>
      </svg>
    ),
  },
  [IssueType.Task]: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Task',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M10.854 6.146a.5.5 0 010 .708l-3.5 3.5a.5.5 0 01-.708 0l-1.5-1.5a.5.5 0 11.708-.708L7 9.293l3.146-3.147a.5.5 0 01.708 0z" clipRule="evenodd"/>
        <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H4z"/>
      </svg>
    ),
  },
  [IssueType.Bug]: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Bug',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path d="M4.355.522a.5.5 0 01.623.333l.291.956A5 5 0 018 1c1.007 0 1.946.298 2.731.811l.29-.956a.5.5 0 11.957.29l-.41 1.352A5 5 0 0113 6h.5a.5.5 0 01.5.5v.5a.5.5 0 01-.5.5H13v1h.5a.5.5 0 01.5.5v.5a.5.5 0 01-.5.5H13a5 5 0 01-10 0h-.5a.5.5 0 01-.5-.5v-.5a.5.5 0 01.5-.5H3V8h-.5a.5.5 0 01-.5-.5v-.5a.5.5 0 01.5-.5H3a5 5 0 011.432-3.503l-.41-1.352a.5.5 0 01.333-.623zM4 7v2a4 4 0 008 0V7H4z"/>
      </svg>
    ),
  },
  [IssueType.Subtask]: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    label: 'Subtask',
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
        <path d="M1 3.5A1.5 1.5 0 012.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9zM2.5 3a.5.5 0 00-.5.5V6h12v-.5a.5.5 0 00-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3H2.5z"/>
      </svg>
    ),
  },
};

/**
 * Size configuration for icons
 */
const sizeConfig = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function IssueTypeIcon({ type, size = 'md', className = '' }: IssueTypeIconProps) {
  const config = typeConfig[type];
  const sizeClass = sizeConfig[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded ${config.bg} ${config.text} ${config.border} border p-0.5 ${className}`}
      title={config.label}
    >
      <span className={sizeClass}>
        {config.icon}
      </span>
    </span>
  );
}

/**
 * Get type configuration for external use
 */
export function getTypeConfig(type: IssueType) {
  return typeConfig[type];
}

/**
 * Get all issue types with their labels
 */
export function getAllIssueTypes(): Array<{ type: IssueType; label: string }> {
  return Object.values(IssueType).map(type => ({
    type,
    label: typeConfig[type].label,
  }));
}
