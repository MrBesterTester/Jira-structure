/**
 * Issue Store - Zustand state management for issues
 * 
 * Handles all issue-related state and actions including CRUD operations,
 * hierarchical relationships, and API synchronization.
 */

import { create } from 'zustand';
import type { Issue, UpdateIssueInput } from '../types';
import { IssueStatus } from '../types';
import * as api from '../services/api';

// ============================================================================
// TYPES
// ============================================================================

interface IssueState {
  // State
  issues: Issue[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchIssues: () => Promise<void>;
  createIssue: (issue: Omit<Issue, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'childIds'>, projectKey: string) => Promise<Issue | null>;
  updateIssue: (update: UpdateIssueInput) => Promise<boolean>;
  updateIssueStatus: (issueId: string, newStatus: IssueStatus) => Promise<boolean>;
  deleteIssue: (issueId: string) => Promise<boolean>;
  bulkUpdateIssues: (issueIds: string[], updates: Partial<Issue>) => Promise<boolean>;
  bulkDeleteIssues: (issueIds: string[]) => Promise<boolean>;
  moveIssue: (issueId: string, newParentId: string | null) => Promise<boolean>;
  
  // Selectors (implemented as functions for convenience)
  getIssueById: (id: string) => Issue | undefined;
  getIssueByKey: (key: string) => Issue | undefined;
  getIssuesByParentId: (parentId: string | null) => Issue[];
  getRootIssues: () => Issue[];
  getIssuesByStatus: (status: IssueStatus) => Issue[];
  getIssueChildren: (issueId: string) => Issue[];
  getIssuesBySprintId: (sprintId: string) => Issue[];
  
  // Internal helpers
  _syncToApi: (issues: Issue[]) => Promise<boolean>;
  _generateIssueKey: (projectKey: string) => string;
  _generateIssueId: () => string;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useIssueStore = create<IssueState>((set, get) => ({
  // Initial state
  issues: [],
  loading: false,
  error: null,

  // ============================================================================
  // ASYNC ACTIONS
  // ============================================================================

  /**
   * Fetch all issues from the API
   */
  fetchIssues: async () => {
    set({ loading: true, error: null });
    
    const response = await api.fetchIssues();
    
    if (response.success) {
      set({ issues: response.data, loading: false });
    } else {
      set({ error: response.error || 'Failed to fetch issues', loading: false });
    }
  },

  /**
   * Create a new issue
   */
  createIssue: async (issueData, projectKey) => {
    const state = get();
    const now = new Date().toISOString();
    
    const newIssue: Issue = {
      ...issueData,
      id: state._generateIssueId(),
      key: state._generateIssueKey(projectKey),
      createdAt: now,
      updatedAt: now,
      childIds: [],
    };

    // If this issue has a parent, update the parent's childIds
    let updatedIssues = [...state.issues, newIssue];
    
    if (newIssue.parentId) {
      updatedIssues = updatedIssues.map(issue => 
        issue.id === newIssue.parentId
          ? { ...issue, childIds: [...issue.childIds, newIssue.id], updatedAt: now }
          : issue
      );
    }

    // Optimistic update
    set({ issues: updatedIssues, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedIssues);
    
    if (!success) {
      // Rollback on failure
      set({ issues: state.issues, error: 'Failed to create issue' });
      return null;
    }
    
    return newIssue;
  },

  /**
   * Update an existing issue
   */
  updateIssue: async (update) => {
    const state = get();
    const now = new Date().toISOString();
    
    const existingIssue = state.issues.find(i => i.id === update.id);
    if (!existingIssue) {
      set({ error: `Issue ${update.id} not found` });
      return false;
    }

    const updatedIssues = state.issues.map(issue =>
      issue.id === update.id
        ? { ...issue, ...update, updatedAt: now }
        : issue
    );

    // Optimistic update
    set({ issues: updatedIssues, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedIssues);
    
    if (!success) {
      // Rollback on failure
      set({ issues: state.issues, error: 'Failed to update issue' });
      return false;
    }
    
    return true;
  },

  /**
   * Update an issue's status (optimized for Kanban drag-and-drop)
   */
  updateIssueStatus: async (issueId, newStatus) => {
    const state = get();
    const now = new Date().toISOString();
    
    const existingIssue = state.issues.find(i => i.id === issueId);
    if (!existingIssue) {
      set({ error: `Issue ${issueId} not found` });
      return false;
    }

    // Don't update if status is the same
    if (existingIssue.status === newStatus) {
      return true;
    }

    const updatedIssues = state.issues.map(issue =>
      issue.id === issueId
        ? { ...issue, status: newStatus, updatedAt: now }
        : issue
    );

    // Optimistic update
    set({ issues: updatedIssues, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedIssues);
    
    if (!success) {
      // Rollback on failure
      set({ issues: state.issues, error: 'Failed to update issue status' });
      return false;
    }
    
    return true;
  },

  /**
   * Delete an issue and handle relationships
   */
  deleteIssue: async (issueId) => {
    const state = get();
    const now = new Date().toISOString();
    
    const issueToDelete = state.issues.find(i => i.id === issueId);
    if (!issueToDelete) {
      set({ error: `Issue ${issueId} not found` });
      return false;
    }

    // Remove the issue and update relationships
    let updatedIssues = state.issues.filter(i => i.id !== issueId);
    
    // Remove from parent's childIds
    if (issueToDelete.parentId) {
      updatedIssues = updatedIssues.map(issue =>
        issue.id === issueToDelete.parentId
          ? { ...issue, childIds: issue.childIds.filter(id => id !== issueId), updatedAt: now }
          : issue
      );
    }

    // Move children to root (remove their parentId)
    updatedIssues = updatedIssues.map(issue =>
      issue.parentId === issueId
        ? { ...issue, parentId: null, updatedAt: now }
        : issue
    );

    // Remove from blockedBy/blocks/relatedTo arrays of other issues
    updatedIssues = updatedIssues.map(issue => ({
      ...issue,
      blockedBy: issue.blockedBy.filter(id => id !== issueId),
      blocks: issue.blocks.filter(id => id !== issueId),
      relatedTo: issue.relatedTo.filter(id => id !== issueId),
    }));

    // Optimistic update
    set({ issues: updatedIssues, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedIssues);
    
    if (!success) {
      set({ issues: state.issues, error: 'Failed to delete issue' });
      return false;
    }
    
    return true;
  },

  /**
   * Bulk update multiple issues
   */
  bulkUpdateIssues: async (issueIds, updates) => {
    const state = get();
    const now = new Date().toISOString();

    const updatedIssues = state.issues.map(issue =>
      issueIds.includes(issue.id)
        ? { ...issue, ...updates, id: issue.id, key: issue.key, createdAt: issue.createdAt, updatedAt: now }
        : issue
    );

    // Optimistic update
    set({ issues: updatedIssues, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedIssues);
    
    if (!success) {
      set({ issues: state.issues, error: 'Failed to bulk update issues' });
      return false;
    }
    
    return true;
  },

  /**
   * Bulk delete multiple issues
   */
  bulkDeleteIssues: async (issueIds) => {
    const state = get();
    const now = new Date().toISOString();

    // Filter out deleted issues
    let updatedIssues = state.issues.filter(i => !issueIds.includes(i.id));

    // Update parent childIds and clean up relationships
    updatedIssues = updatedIssues.map(issue => ({
      ...issue,
      childIds: issue.childIds.filter(id => !issueIds.includes(id)),
      blockedBy: issue.blockedBy.filter(id => !issueIds.includes(id)),
      blocks: issue.blocks.filter(id => !issueIds.includes(id)),
      relatedTo: issue.relatedTo.filter(id => !issueIds.includes(id)),
      // If parent was deleted, move to root
      parentId: issueIds.includes(issue.parentId || '') ? null : issue.parentId,
      updatedAt: now,
    }));

    // Optimistic update
    set({ issues: updatedIssues, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedIssues);
    
    if (!success) {
      set({ issues: state.issues, error: 'Failed to bulk delete issues' });
      return false;
    }
    
    return true;
  },

  /**
   * Move an issue to a new parent
   */
  moveIssue: async (issueId, newParentId) => {
    const state = get();
    const now = new Date().toISOString();

    const issueToMove = state.issues.find(i => i.id === issueId);
    if (!issueToMove) {
      set({ error: `Issue ${issueId} not found` });
      return false;
    }

    // Prevent circular reference
    if (newParentId) {
      const isCircular = (parentId: string | null): boolean => {
        if (!parentId) return false;
        if (parentId === issueId) return true;
        const parent = state.issues.find(i => i.id === parentId);
        return parent ? isCircular(parent.parentId) : false;
      };
      
      if (isCircular(newParentId)) {
        set({ error: 'Cannot create circular parent-child relationship' });
        return false;
      }
    }

    let updatedIssues = state.issues.map(issue => {
      // Update the moved issue's parentId
      if (issue.id === issueId) {
        return { ...issue, parentId: newParentId, updatedAt: now };
      }
      
      // Remove from old parent's childIds
      if (issue.id === issueToMove.parentId) {
        return { 
          ...issue, 
          childIds: issue.childIds.filter(id => id !== issueId),
          updatedAt: now 
        };
      }
      
      // Add to new parent's childIds
      if (issue.id === newParentId) {
        return { 
          ...issue, 
          childIds: [...issue.childIds, issueId],
          updatedAt: now 
        };
      }
      
      return issue;
    });

    // Optimistic update
    set({ issues: updatedIssues, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedIssues);
    
    if (!success) {
      set({ issues: state.issues, error: 'Failed to move issue' });
      return false;
    }
    
    return true;
  },

  // ============================================================================
  // SELECTORS
  // ============================================================================

  getIssueById: (id) => {
    return get().issues.find(i => i.id === id);
  },

  getIssueByKey: (key) => {
    return get().issues.find(i => i.key === key);
  },

  getIssuesByParentId: (parentId) => {
    return get().issues.filter(i => i.parentId === parentId);
  },

  getRootIssues: () => {
    return get().issues.filter(i => i.parentId === null);
  },

  getIssuesByStatus: (status) => {
    return get().issues.filter(i => i.status === status);
  },

  getIssueChildren: (issueId) => {
    const issue = get().issues.find(i => i.id === issueId);
    if (!issue) return [];
    return get().issues.filter(i => issue.childIds.includes(i.id));
  },

  getIssuesBySprintId: (sprintId) => {
    return get().issues.filter(i => i.sprint === sprintId);
  },

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  _syncToApi: async (issues) => {
    const response = await api.updateIssues(issues);
    if (!response.success) {
      console.error('API sync failed:', response.error);
      return false;
    }
    return true;
  },

  _generateIssueKey: (projectKey) => {
    const state = get();
    // Find highest existing key number for this project
    const projectIssues = state.issues.filter(i => i.key.startsWith(`${projectKey}-`));
    const maxNum = projectIssues.reduce((max, issue) => {
      const num = parseInt(issue.key.split('-')[1], 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `${projectKey}-${maxNum + 1}`;
  },

  _generateIssueId: () => {
    return `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
}));

// ============================================================================
// EXPORTS
// ============================================================================

export type { IssueState };
