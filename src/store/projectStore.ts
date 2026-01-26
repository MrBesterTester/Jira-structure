/**
 * Project Store - Zustand state management for projects
 * 
 * Handles project-related state including the current active project.
 */

import { create } from 'zustand';
import type { Project } from '../types';
import * as api from '../services/api';

// ============================================================================
// TYPES
// ============================================================================

interface ProjectState {
  // State
  projects: Project[];
  currentProjectId: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  setCurrentProject: (projectId: string | null) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<Project | null>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  
  // Selectors
  getCurrentProject: () => Project | undefined;
  getProjectById: (id: string) => Project | undefined;
  getProjectByKey: (key: string) => Project | undefined;
  
  // Internal helpers
  _syncToApi: (projects: Project[]) => Promise<boolean>;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  projects: [],
  currentProjectId: null,
  loading: false,
  error: null,

  // ============================================================================
  // ASYNC ACTIONS
  // ============================================================================

  /**
   * Fetch all projects from the API
   */
  fetchProjects: async () => {
    set({ loading: true, error: null });
    
    const response = await api.fetchProjects();
    
    if (response.success) {
      const projects = response.data;
      set({ 
        projects, 
        loading: false,
        // Auto-select first project if none selected
        currentProjectId: get().currentProjectId || (projects.length > 0 ? projects[0].id : null)
      });
    } else {
      set({ error: response.error || 'Failed to fetch projects', loading: false });
    }
  },

  /**
   * Set the current active project
   */
  setCurrentProject: (projectId) => {
    set({ currentProjectId: projectId });
  },

  /**
   * Create a new project
   */
  createProject: async (projectData) => {
    const state = get();
    const now = new Date().toISOString();
    
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
    };

    const updatedProjects = [...state.projects, newProject];

    // Optimistic update
    set({ projects: updatedProjects, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedProjects);
    
    if (!success) {
      set({ projects: state.projects, error: 'Failed to create project' });
      return null;
    }
    
    return newProject;
  },

  /**
   * Update an existing project
   */
  updateProject: async (projectId, updates) => {
    const state = get();
    
    const existingProject = state.projects.find(p => p.id === projectId);
    if (!existingProject) {
      set({ error: `Project ${projectId} not found` });
      return false;
    }

    const updatedProjects = state.projects.map(project =>
      project.id === projectId
        ? { ...project, ...updates }
        : project
    );

    // Optimistic update
    set({ projects: updatedProjects, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedProjects);
    
    if (!success) {
      set({ projects: state.projects, error: 'Failed to update project' });
      return false;
    }
    
    return true;
  },

  /**
   * Delete a project
   */
  deleteProject: async (projectId) => {
    const state = get();
    
    const updatedProjects = state.projects.filter(p => p.id !== projectId);

    // If deleting the current project, clear selection
    const newCurrentProjectId = state.currentProjectId === projectId
      ? (updatedProjects.length > 0 ? updatedProjects[0].id : null)
      : state.currentProjectId;

    // Optimistic update
    set({ 
      projects: updatedProjects, 
      currentProjectId: newCurrentProjectId,
      error: null 
    });
    
    // Sync to API
    const success = await state._syncToApi(updatedProjects);
    
    if (!success) {
      set({ 
        projects: state.projects, 
        currentProjectId: state.currentProjectId,
        error: 'Failed to delete project' 
      });
      return false;
    }
    
    return true;
  },

  // ============================================================================
  // SELECTORS
  // ============================================================================

  getCurrentProject: () => {
    const state = get();
    return state.projects.find(p => p.id === state.currentProjectId);
  },

  getProjectById: (id) => {
    return get().projects.find(p => p.id === id);
  },

  getProjectByKey: (key) => {
    return get().projects.find(p => p.key === key);
  },

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  _syncToApi: async (projects) => {
    const response = await api.updateProjects(projects);
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

export type { ProjectState };
