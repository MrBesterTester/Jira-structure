/**
 * Jira Structure Learning Tool - API Service Layer
 * 
 * Typed fetch functions for interacting with the Express server.
 * All functions return properly typed data matching our TypeScript interfaces.
 */

import type { 
  Project, 
  Issue, 
  Sprint, 
  User, 
  Structure,
  ApiResponse 
} from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * API base URL - uses environment variable or defaults to localhost:3001
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    const json = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        data: [] as unknown as T,
        error: json.error || `HTTP error: ${response.status}`,
      };
    }
    
    return json as ApiResponse<T>;
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    return {
      success: false,
      data: [] as unknown as T,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ============================================================================
// PROJECTS API
// ============================================================================

/**
 * Fetch all projects
 */
export async function fetchProjects(): Promise<ApiResponse<Project[]>> {
  return fetchApi<Project[]>('/projects');
}

/**
 * Update all projects (replaces entire collection)
 */
export async function updateProjects(projects: Project[]): Promise<ApiResponse<Project[]>> {
  return fetchApi<Project[]>('/projects', {
    method: 'PUT',
    body: JSON.stringify(projects),
  });
}

// ============================================================================
// ISSUES API
// ============================================================================

/**
 * Fetch all issues
 */
export async function fetchIssues(): Promise<ApiResponse<Issue[]>> {
  return fetchApi<Issue[]>('/issues');
}

/**
 * Update all issues (replaces entire collection)
 */
export async function updateIssues(issues: Issue[]): Promise<ApiResponse<Issue[]>> {
  return fetchApi<Issue[]>('/issues', {
    method: 'PUT',
    body: JSON.stringify(issues),
  });
}

// ============================================================================
// SPRINTS API
// ============================================================================

/**
 * Fetch all sprints
 */
export async function fetchSprints(): Promise<ApiResponse<Sprint[]>> {
  return fetchApi<Sprint[]>('/sprints');
}

/**
 * Update all sprints (replaces entire collection)
 */
export async function updateSprints(sprints: Sprint[]): Promise<ApiResponse<Sprint[]>> {
  return fetchApi<Sprint[]>('/sprints', {
    method: 'PUT',
    body: JSON.stringify(sprints),
  });
}

// ============================================================================
// USERS API
// ============================================================================

/**
 * Fetch all users
 */
export async function fetchUsers(): Promise<ApiResponse<User[]>> {
  return fetchApi<User[]>('/users');
}

/**
 * Update all users (replaces entire collection)
 */
export async function updateUsers(users: User[]): Promise<ApiResponse<User[]>> {
  return fetchApi<User[]>('/users', {
    method: 'PUT',
    body: JSON.stringify(users),
  });
}

// ============================================================================
// STRUCTURES API
// ============================================================================

/**
 * Fetch all structures
 */
export async function fetchStructures(): Promise<ApiResponse<Structure[]>> {
  return fetchApi<Structure[]>('/structures');
}

/**
 * Update all structures (replaces entire collection)
 */
export async function updateStructures(structures: Structure[]): Promise<ApiResponse<Structure[]>> {
  return fetchApi<Structure[]>('/structures', {
    method: 'PUT',
    body: JSON.stringify(structures),
  });
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check if the API server is running
 */
export async function checkHealth(): Promise<{ ok: boolean; timestamp?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      return { ok: true, timestamp: data.timestamp };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Fetch all data from all endpoints
 * Useful for initial app load
 */
export async function fetchAllData(): Promise<{
  projects: ApiResponse<Project[]>;
  issues: ApiResponse<Issue[]>;
  sprints: ApiResponse<Sprint[]>;
  users: ApiResponse<User[]>;
  structures: ApiResponse<Structure[]>;
}> {
  const [projects, issues, sprints, users, structures] = await Promise.all([
    fetchProjects(),
    fetchIssues(),
    fetchSprints(),
    fetchUsers(),
    fetchStructures(),
  ]);
  
  return { projects, issues, sprints, users, structures };
}

// ============================================================================
// SINGLE ENTITY OPERATIONS (for convenience)
// ============================================================================

/**
 * Get a single project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const response = await fetchProjects();
  if (!response.success) return null;
  return response.data.find(p => p.id === id) || null;
}

/**
 * Get a single issue by ID or key
 */
export async function getIssueByIdOrKey(idOrKey: string): Promise<Issue | null> {
  const response = await fetchIssues();
  if (!response.success) return null;
  return response.data.find(i => i.id === idOrKey || i.key === idOrKey) || null;
}

/**
 * Get a single sprint by ID
 */
export async function getSprintById(id: string): Promise<Sprint | null> {
  const response = await fetchSprints();
  if (!response.success) return null;
  return response.data.find(s => s.id === id) || null;
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const response = await fetchUsers();
  if (!response.success) return null;
  return response.data.find(u => u.id === id) || null;
}

/**
 * Create or update a single issue
 * Merges with existing issues array
 */
export async function saveIssue(issue: Issue): Promise<ApiResponse<Issue[]>> {
  const response = await fetchIssues();
  if (!response.success) {
    return response;
  }
  
  const existingIndex = response.data.findIndex(i => i.id === issue.id);
  const updatedIssues = [...response.data];
  
  if (existingIndex >= 0) {
    updatedIssues[existingIndex] = issue;
  } else {
    updatedIssues.push(issue);
  }
  
  return updateIssues(updatedIssues);
}

/**
 * Delete a single issue by ID
 */
export async function deleteIssue(issueId: string): Promise<ApiResponse<Issue[]>> {
  const response = await fetchIssues();
  if (!response.success) {
    return response;
  }
  
  const updatedIssues = response.data.filter(i => i.id !== issueId);
  return updateIssues(updatedIssues);
}
