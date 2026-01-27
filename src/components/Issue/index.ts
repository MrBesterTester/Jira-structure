/**
 * Issue Components - Barrel Export
 * 
 * All issue-related display components.
 */

// Main issue card component
export { IssueCard, Avatar, StoryPointsBadge } from './IssueCard';

// Type icon with colors
export { 
  IssueTypeIcon, 
  getTypeConfig, 
  getAllIssueTypes 
} from './IssueTypeIcon';

// Status badge and indicators
export { 
  StatusBadge, 
  StatusDot, 
  getStatusConfig, 
  getAllStatuses 
} from './StatusBadge';

// Priority indicator
export { 
  PriorityIndicator, 
  getPriorityConfig, 
  getAllPriorities 
} from './PriorityIndicator';

// Issue detail panel (slide-out)
export { IssueDetailPanel } from './IssueDetailPanel';
export { IssueDetailsTab } from './IssueDetailsTab';

// Create issue modal
export { CreateIssueModal } from './CreateIssueModal';
