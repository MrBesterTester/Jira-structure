/**
 * Jira Structure Learning Tool - Core TypeScript Types
 * 
 * This file defines all the core data types used throughout the application.
 * Based on the specification document requirements.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Issue types following Jira hierarchy conventions.
 * Ordered from highest level (Initiative) to lowest (Subtask).
 */
export enum IssueType {
  Initiative = 'Initiative',
  Epic = 'Epic',
  Feature = 'Feature',
  Story = 'Story',
  Task = 'Task',
  Bug = 'Bug',
  Subtask = 'Subtask',
}

/**
 * Issue status following a standard workflow.
 * Represents the state of work on an issue.
 */
export enum IssueStatus {
  Todo = 'To Do',
  InProgress = 'In Progress',
  InReview = 'In Review',
  Done = 'Done',
}

/**
 * Priority levels for issues.
 * Ordered from highest to lowest priority.
 */
export enum Priority {
  Highest = 'Highest',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Lowest = 'Lowest',
}

/**
 * Sprint status.
 * Represents the lifecycle state of a sprint.
 */
export enum SprintStatus {
  Planned = 'planned',
  Active = 'active',
  Completed = 'completed',
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * User represents a team member who can be assigned to issues.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** Display name shown in the UI */
  displayName: string;
  /** Email address */
  email: string;
  /** URL to user's avatar image (optional) */
  avatarUrl?: string;
}

/**
 * Project represents a collection of issues and sprints.
 */
export interface Project {
  /** Unique identifier for the project */
  id: string;
  /** Short project key used in issue keys (e.g., "PHOENIX") */
  key: string;
  /** Full project name */
  name: string;
  /** Project description */
  description: string;
  /** User ID of the project lead */
  lead: string;
  /** ISO date string when project was created */
  createdAt: string;
}

/**
 * Sprint represents a time-boxed iteration.
 */
export interface Sprint {
  /** Unique identifier for the sprint */
  id: string;
  /** Sprint name (e.g., "Sprint 4") */
  name: string;
  /** ID of the project this sprint belongs to */
  projectId: string;
  /** ISO date string for sprint start */
  startDate: string;
  /** ISO date string for sprint end */
  endDate: string;
  /** Current status of the sprint */
  status: SprintStatus;
  /** Optional sprint goal description */
  goalDescription?: string;
}

/**
 * Issue represents a single work item (story, task, bug, etc.)
 * This is the core entity of the application.
 */
export interface Issue {
  // === Identification ===
  /** Unique identifier (e.g., "issue-123") */
  id: string;
  /** Project-prefixed key (e.g., "PHOENIX-123") */
  key: string;

  // === Core Fields ===
  /** Issue summary/title */
  title: string;
  /** Detailed description (supports markdown) */
  description: string;
  /** Type of issue */
  type: IssueType;
  /** Current status */
  status: IssueStatus;
  /** Priority level */
  priority: Priority;

  // === People ===
  /** User ID of the assigned person (null if unassigned) */
  assignee: string | null;
  /** User ID of the reporter/creator */
  reporter: string;

  // === Labels & Categories ===
  /** Tags/labels for categorization */
  labels: string[];

  // === Timestamps ===
  /** ISO date string when issue was created */
  createdAt: string;
  /** ISO date string when issue was last updated */
  updatedAt: string;

  // === Agile/Sprint Fields ===
  /** Estimation in story points (null if not estimated) */
  storyPoints: number | null;
  /** Sprint ID (null if not in a sprint) */
  sprint: string | null;

  // === Planning Fields ===
  /** Fix version/release (null if not set) */
  version: string | null;
  /** Project components this issue belongs to */
  components: string[];
  /** Target completion date as ISO date string (null if not set) */
  dueDate: string | null;
  /** Planned start date as ISO date string (null if not set) */
  startDate: string | null;

  // === Time Tracking (in hours) ===
  /** Original time estimate in hours (null if not set) */
  originalEstimate: number | null;
  /** Time spent/logged in hours (null if not tracked) */
  timeSpent: number | null;
  /** Remaining time estimate in hours (null if not set) */
  remainingEstimate: number | null;

  // === Hierarchy & Relationships ===
  /** Parent issue ID (null if root-level) */
  parentId: string | null;
  /** IDs of child issues */
  childIds: string[];
  /** IDs of issues blocking this one */
  blockedBy: string[];
  /** IDs of issues this one blocks */
  blocks: string[];
  /** IDs of related issues (non-directional) */
  relatedTo: string[];
}

/**
 * Structure represents a saved hierarchy view configuration.
 * Structures define how issues are organized and displayed.
 */
export interface Structure {
  /** Unique identifier for the structure */
  id: string;
  /** Structure name (e.g., "Default", "By Epic") */
  name: string;
  /** ID of the project this structure belongs to */
  projectId: string;
  /** IDs of root-level issues in this structure */
  rootIssueIds: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for creating a new issue (omits auto-generated fields)
 */
export type CreateIssueInput = Omit<Issue, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'childIds'>;

/**
 * Type for updating an existing issue (all fields optional except id)
 */
export type UpdateIssueInput = Partial<Omit<Issue, 'id' | 'key' | 'createdAt'>> & { id: string };

/**
 * Type for filter state used in the UI
 */
export interface FilterState {
  types: IssueType[];
  statuses: IssueStatus[];
  priorities: Priority[];
  assignees: string[];
  sprints: string[];
  labels: string[];
  parentId: string | null;
  searchText: string;
}

/**
 * Default empty filter state
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  types: [],
  statuses: [],
  priorities: [],
  assignees: [],
  sprints: [],
  labels: [],
  parentId: null,
  searchText: '',
};

/**
 * View types available in the application
 */
export type ViewType = 'tree' | 'kanban';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration
 */
export interface SortConfig {
  field: keyof Issue;
  direction: SortDirection;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

/**
 * Data structure for the complete app state stored in JSON files
 */
export interface AppData {
  projects: Project[];
  issues: Issue[];
  sprints: Sprint[];
  users: User[];
  structures: Structure[];
}
