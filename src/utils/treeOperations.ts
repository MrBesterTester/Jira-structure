/**
 * Tree Operations - Utility functions for tree drag-and-drop operations
 * 
 * Handles validation and execution of tree restructuring operations
 * including move validation, circular reference detection, and sibling reordering.
 */

import type { Issue } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface MoveValidationResult {
  valid: boolean;
  reason?: string;
}

export interface DropPosition {
  targetId: string;
  position: 'before' | 'after' | 'inside';
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a move operation would create a circular reference
 * (i.e., trying to move a parent into one of its descendants)
 */
export function wouldCreateCircularReference(
  issueId: string,
  targetParentId: string | null,
  issues: Issue[]
): boolean {
  if (!targetParentId) return false;
  if (targetParentId === issueId) return true;

  // Build a map for efficient lookup
  const issueMap = new Map(issues.map(i => [i.id, i]));

  // Walk up the ancestor chain from targetParentId
  let currentId: string | null = targetParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      // Already visited - there's a cycle in the existing data
      return true;
    }
    visited.add(currentId);

    if (currentId === issueId) {
      // Found the issue we're trying to move in the ancestor chain
      return true;
    }

    const current = issueMap.get(currentId);
    currentId = current?.parentId ?? null;
  }

  return false;
}

/**
 * Check if a descendant exists in the subtree of a given issue
 */
export function isDescendantOf(
  potentialDescendantId: string,
  ancestorId: string,
  issues: Issue[]
): boolean {
  const issueMap = new Map(issues.map(i => [i.id, i]));
  
  let currentId: string | null = potentialDescendantId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    if (currentId === ancestorId) return true;
    
    const current = issueMap.get(currentId);
    currentId = current?.parentId ?? null;
  }

  return false;
}

/**
 * Validate if a move operation is allowed
 */
export function validateMove(
  issueId: string,
  targetParentId: string | null,
  issues: Issue[]
): MoveValidationResult {
  // Can't move to self
  if (issueId === targetParentId) {
    return {
      valid: false,
      reason: 'Cannot move an issue to be its own parent',
    };
  }

  // Check for circular reference
  if (wouldCreateCircularReference(issueId, targetParentId, issues)) {
    return {
      valid: false,
      reason: 'Cannot move an issue into its own subtree (would create circular reference)',
    };
  }

  // Verify target exists (if not moving to root)
  if (targetParentId) {
    const targetExists = issues.some(i => i.id === targetParentId);
    if (!targetExists) {
      return {
        valid: false,
        reason: 'Target parent does not exist',
      };
    }
  }

  return { valid: true };
}

// ============================================================================
// TREE MANIPULATION FUNCTIONS
// ============================================================================

/**
 * Get the depth of an issue in the hierarchy
 */
export function getIssueDepth(issueId: string, issues: Issue[]): number {
  const issueMap = new Map(issues.map(i => [i.id, i]));
  let depth = 0;
  let currentId: string | null = issueId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const current = issueMap.get(currentId);
    if (!current?.parentId) break;
    
    depth++;
    currentId = current.parentId;
  }

  return depth;
}

/**
 * Get all descendants of an issue (children, grandchildren, etc.)
 */
export function getAllDescendants(issueId: string, issues: Issue[]): Issue[] {
  const descendants: Issue[] = [];
  const issueMap = new Map(issues.map(i => [i.id, i]));
  const issue = issueMap.get(issueId);
  
  if (!issue) return descendants;

  const collectDescendants = (parentId: string) => {
    const children = issues.filter(i => i.parentId === parentId);
    for (const child of children) {
      descendants.push(child);
      collectDescendants(child.id);
    }
  };

  collectDescendants(issueId);
  return descendants;
}

/**
 * Get the path from root to an issue (array of ancestor IDs)
 */
export function getAncestorPath(issueId: string, issues: Issue[]): string[] {
  const path: string[] = [];
  const issueMap = new Map(issues.map(i => [i.id, i]));
  
  let currentId: string | null = issueId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const current = issueMap.get(currentId);
    if (!current?.parentId) break;
    
    path.unshift(current.parentId);
    currentId = current.parentId;
  }

  return path;
}

/**
 * Reorder children of a parent
 * Returns the new ordered array of child IDs
 */
export function reorderChildren(
  _parentId: string | null,
  childIds: string[],
  fromIndex: number,
  toIndex: number
): string[] {
  const newOrder = [...childIds];
  const [moved] = newOrder.splice(fromIndex, 1);
  if (moved !== undefined) {
    newOrder.splice(toIndex, 0, moved);
  }
  return newOrder;
}

/**
 * Calculate where to insert an issue when dropped
 */
export function calculateDropTarget(
  _draggedId: string,
  overId: string,
  overRect: { top: number; height: number } | null,
  clientY: number,
  issues: Issue[]
): DropPosition | null {
  if (!overRect) {
    return { targetId: overId, position: 'inside' };
  }

  const overIssue = issues.find(i => i.id === overId);
  if (!overIssue) return null;

  // Calculate relative position within the target
  const relativeY = clientY - overRect.top;
  const threshold = overRect.height / 4;

  // Top quarter: insert before
  if (relativeY < threshold) {
    return { targetId: overId, position: 'before' };
  }
  
  // Bottom quarter: insert after
  if (relativeY > overRect.height - threshold) {
    return { targetId: overId, position: 'after' };
  }

  // Middle: make child
  return { targetId: overId, position: 'inside' };
}
