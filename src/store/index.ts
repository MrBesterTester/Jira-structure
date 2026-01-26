/**
 * Store Index - Central export for all Zustand stores
 * 
 * Provides a unified interface for state management across the application.
 */

// ============================================================================
// STORE EXPORTS
// ============================================================================

export { useIssueStore } from './issueStore';
export type { IssueState } from './issueStore';

export { useProjectStore } from './projectStore';
export type { ProjectState } from './projectStore';

export { useSprintStore } from './sprintStore';
export type { SprintState } from './sprintStore';

export { useUserStore } from './userStore';
export type { UserState } from './userStore';

export { useUIStore } from './uiStore';
export type { UIState } from './uiStore';

// ============================================================================
// INITIALIZATION HELPER
// ============================================================================

import { useIssueStore } from './issueStore';
import { useProjectStore } from './projectStore';
import { useSprintStore } from './sprintStore';
import { useUserStore } from './userStore';

/**
 * Initialize all stores by fetching data from the API.
 * Call this once when the application starts.
 * 
 * @returns Promise that resolves when all data is loaded
 */
export async function initializeStores(): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  
  // Fetch all data in parallel
  await Promise.all([
    useProjectStore.getState().fetchProjects(),
    useIssueStore.getState().fetchIssues(),
    useSprintStore.getState().fetchSprints(),
    useUserStore.getState().fetchUsers(),
  ]);
  
  // Check for errors
  const projectError = useProjectStore.getState().error;
  const issueError = useIssueStore.getState().error;
  const sprintError = useSprintStore.getState().error;
  const userError = useUserStore.getState().error;
  
  if (projectError) errors.push(`Projects: ${projectError}`);
  if (issueError) errors.push(`Issues: ${issueError}`);
  if (sprintError) errors.push(`Sprints: ${sprintError}`);
  if (userError) errors.push(`Users: ${userError}`);
  
  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Check if any store is currently loading
 */
export function useIsLoading(): boolean {
  const projectLoading = useProjectStore(state => state.loading);
  const issueLoading = useIssueStore(state => state.loading);
  const sprintLoading = useSprintStore(state => state.loading);
  const userLoading = useUserStore(state => state.loading);
  
  return projectLoading || issueLoading || sprintLoading || userLoading;
}

/**
 * Get all current errors from stores
 */
export function useStoreErrors(): string[] {
  const projectError = useProjectStore(state => state.error);
  const issueError = useIssueStore(state => state.error);
  const sprintError = useSprintStore(state => state.error);
  const userError = useUserStore(state => state.error);
  
  const errors: string[] = [];
  if (projectError) errors.push(projectError);
  if (issueError) errors.push(issueError);
  if (sprintError) errors.push(sprintError);
  if (userError) errors.push(userError);
  
  return errors;
}
