/**
 * Sprint Store - Zustand state management for sprints
 * 
 * Handles sprint-related state including active sprint tracking.
 */

import { create } from 'zustand';
import type { Sprint } from '../types';
import { SprintStatus } from '../types';
import * as api from '../services/api';

// ============================================================================
// TYPES
// ============================================================================

interface SprintState {
  // State
  sprints: Sprint[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSprints: () => Promise<void>;
  createSprint: (sprint: Omit<Sprint, 'id'>) => Promise<Sprint | null>;
  updateSprint: (sprintId: string, updates: Partial<Sprint>) => Promise<boolean>;
  deleteSprint: (sprintId: string) => Promise<boolean>;
  startSprint: (sprintId: string) => Promise<boolean>;
  completeSprint: (sprintId: string) => Promise<boolean>;
  
  // Selectors
  getSprintById: (id: string) => Sprint | undefined;
  getActiveSprint: (projectId?: string) => Sprint | undefined;
  getSprintsByProject: (projectId: string) => Sprint[];
  getPlannedSprints: (projectId?: string) => Sprint[];
  getCompletedSprints: (projectId?: string) => Sprint[];
  
  // Internal helpers
  _syncToApi: (sprints: Sprint[]) => Promise<boolean>;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useSprintStore = create<SprintState>((set, get) => ({
  // Initial state
  sprints: [],
  loading: false,
  error: null,

  // ============================================================================
  // ASYNC ACTIONS
  // ============================================================================

  /**
   * Fetch all sprints from the API
   */
  fetchSprints: async () => {
    set({ loading: true, error: null });
    
    const response = await api.fetchSprints();
    
    if (response.success) {
      set({ sprints: response.data, loading: false });
    } else {
      set({ error: response.error || 'Failed to fetch sprints', loading: false });
    }
  },

  /**
   * Create a new sprint
   */
  createSprint: async (sprintData) => {
    const state = get();
    
    const newSprint: Sprint = {
      ...sprintData,
      id: `sprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedSprints = [...state.sprints, newSprint];

    // Optimistic update
    set({ sprints: updatedSprints, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedSprints);
    
    if (!success) {
      set({ sprints: state.sprints, error: 'Failed to create sprint' });
      return null;
    }
    
    return newSprint;
  },

  /**
   * Update an existing sprint
   */
  updateSprint: async (sprintId, updates) => {
    const state = get();
    
    const existingSprint = state.sprints.find(s => s.id === sprintId);
    if (!existingSprint) {
      set({ error: `Sprint ${sprintId} not found` });
      return false;
    }

    const updatedSprints = state.sprints.map(sprint =>
      sprint.id === sprintId
        ? { ...sprint, ...updates }
        : sprint
    );

    // Optimistic update
    set({ sprints: updatedSprints, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedSprints);
    
    if (!success) {
      set({ sprints: state.sprints, error: 'Failed to update sprint' });
      return false;
    }
    
    return true;
  },

  /**
   * Delete a sprint
   */
  deleteSprint: async (sprintId) => {
    const state = get();
    
    const updatedSprints = state.sprints.filter(s => s.id !== sprintId);

    // Optimistic update
    set({ sprints: updatedSprints, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedSprints);
    
    if (!success) {
      set({ sprints: state.sprints, error: 'Failed to delete sprint' });
      return false;
    }
    
    return true;
  },

  /**
   * Start a sprint (change status to active)
   */
  startSprint: async (sprintId) => {
    const state = get();
    
    // Check if there's already an active sprint in the same project
    const sprintToStart = state.sprints.find(s => s.id === sprintId);
    if (!sprintToStart) {
      set({ error: `Sprint ${sprintId} not found` });
      return false;
    }

    const existingActive = state.sprints.find(
      s => s.projectId === sprintToStart.projectId && s.status === SprintStatus.Active
    );
    
    if (existingActive) {
      set({ error: `Cannot start sprint: ${existingActive.name} is already active` });
      return false;
    }

    return get().updateSprint(sprintId, { status: SprintStatus.Active });
  },

  /**
   * Complete a sprint (change status to completed)
   */
  completeSprint: async (sprintId) => {
    return get().updateSprint(sprintId, { status: SprintStatus.Completed });
  },

  // ============================================================================
  // SELECTORS
  // ============================================================================

  getSprintById: (id) => {
    return get().sprints.find(s => s.id === id);
  },

  getActiveSprint: (projectId) => {
    const state = get();
    return state.sprints.find(s => 
      s.status === SprintStatus.Active && 
      (projectId ? s.projectId === projectId : true)
    );
  },

  getSprintsByProject: (projectId) => {
    return get().sprints.filter(s => s.projectId === projectId);
  },

  getPlannedSprints: (projectId) => {
    const state = get();
    return state.sprints.filter(s => 
      s.status === SprintStatus.Planned && 
      (projectId ? s.projectId === projectId : true)
    );
  },

  getCompletedSprints: (projectId) => {
    const state = get();
    return state.sprints.filter(s => 
      s.status === SprintStatus.Completed && 
      (projectId ? s.projectId === projectId : true)
    );
  },

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  _syncToApi: async (sprints) => {
    const response = await api.updateSprints(sprints);
    if (!response.success) {
      console.error('API sync failed:', response.error);
      return false;
    }
    return true;
  },
}));

// ============================================================================
// EXPORTS
// ============================================================================

export type { SprintState };
