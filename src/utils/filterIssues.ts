/**
 * Filter Issues Utility
 * 
 * Provides filtering functionality for issues based on FilterState.
 * Used by both TreeView and KanbanBoard.
 */

import type { Issue, FilterState } from '../types';

/**
 * Filter issues based on filter state.
 * All filter criteria are combined with AND logic.
 * 
 * @param issues - Array of issues to filter
 * @param filters - Current filter state
 * @returns Filtered array of issues
 */
export function filterIssues(issues: Issue[], filters: FilterState): Issue[] {
  return issues.filter(issue => {
    // Filter by types
    if (filters.types.length > 0 && !filters.types.includes(issue.type)) {
      return false;
    }
    
    // Filter by statuses
    if (filters.statuses.length > 0 && !filters.statuses.includes(issue.status)) {
      return false;
    }
    
    // Filter by priorities
    if (filters.priorities.length > 0 && !filters.priorities.includes(issue.priority)) {
      return false;
    }
    
    // Filter by assignees
    if (filters.assignees.length > 0) {
      if (!issue.assignee || !filters.assignees.includes(issue.assignee)) {
        return false;
      }
    }
    
    // Filter by sprints
    if (filters.sprints.length > 0) {
      if (!issue.sprint || !filters.sprints.includes(issue.sprint)) {
        return false;
      }
    }
    
    // Filter by labels (OR logic - matches if issue has ANY of the filter labels)
    if (filters.labels.length > 0) {
      if (!filters.labels.some(label => issue.labels.includes(label))) {
        return false;
      }
    }
    
    // Filter by parent
    if (filters.parentId && issue.parentId !== filters.parentId) {
      return false;
    }
    
    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesTitle = issue.title.toLowerCase().includes(searchLower);
      const matchesKey = issue.key.toLowerCase().includes(searchLower);
      const matchesDescription = issue.description.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesKey && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Check if any filters are active (non-default values)
 * 
 * @param filters - Filter state to check
 * @returns true if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.types.length > 0 ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assignees.length > 0 ||
    filters.sprints.length > 0 ||
    filters.labels.length > 0 ||
    filters.parentId !== null ||
    filters.searchText !== ''
  );
}

/**
 * Count the number of active filters
 * 
 * @param filters - Filter state to check
 * @returns Number of active filter categories
 */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.types.length > 0) count++;
  if (filters.statuses.length > 0) count++;
  if (filters.priorities.length > 0) count++;
  if (filters.assignees.length > 0) count++;
  if (filters.sprints.length > 0) count++;
  if (filters.labels.length > 0) count++;
  if (filters.parentId !== null) count++;
  if (filters.searchText !== '') count++;
  return count;
}

/**
 * Get all unique labels from an array of issues
 * 
 * @param issues - Array of issues to extract labels from
 * @returns Sorted array of unique labels
 */
export function getAllLabels(issues: Issue[]): string[] {
  const labelsSet = new Set<string>();
  issues.forEach(issue => {
    issue.labels.forEach(label => labelsSet.add(label));
  });
  return Array.from(labelsSet).sort();
}

/**
 * Filter issues recursively through the hierarchy.
 * An issue is included if it matches OR if any of its descendants match.
 * This is useful for tree views where you want to show parent context.
 * 
 * @param issues - All issues
 * @param filters - Current filter state
 * @returns Set of issue IDs that should be visible (including parents of matching issues)
 */
export function filterIssuesWithHierarchy(issues: Issue[], filters: FilterState): Set<string> {
  const matchingIds = new Set<string>();
  
  // First, find all directly matching issues
  const directMatches = filterIssues(issues, filters);
  directMatches.forEach(issue => matchingIds.add(issue.id));
  
  // Then, include all ancestors of matching issues
  const issueMap = new Map<string, Issue>();
  issues.forEach(issue => issueMap.set(issue.id, issue));
  
  directMatches.forEach(issue => {
    let currentId = issue.parentId;
    while (currentId) {
      matchingIds.add(currentId);
      const parent = issueMap.get(currentId);
      currentId = parent?.parentId ?? null;
    }
  });
  
  return matchingIds;
}
