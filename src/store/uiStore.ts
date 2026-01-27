/**
 * UI Store - Zustand state management for UI state
 * 
 * Handles all UI-related state including view modes, selections,
 * expanded states, and filters.
 */

import { create } from 'zustand';
import type { ViewType, FilterState, SortConfig } from '../types';
import { DEFAULT_FILTER_STATE } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface UIState {
  // View State
  currentView: ViewType;
  sidebarCollapsed: boolean;
  
  // Selection State
  selectedIssueIds: string[];
  focusedIssueId: string | null;
  
  // Tree View State
  expandedIssueIds: string[];
  showRelationshipLines: boolean;
  
  // Issue Detail Panel
  detailPanelOpen: boolean;
  detailPanelIssueId: string | null;
  
  // Filters
  filters: FilterState;
  
  // Sorting
  sortConfig: SortConfig | null;
  
  // Modals
  createIssueModalOpen: boolean;
  createIssueParentId: string | null;
  
  // Search
  searchQuery: string;
  searchResultsVisible: boolean;
  
  // Actions - View
  setView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Actions - Selection
  selectIssue: (issueId: string) => void;
  deselectIssue: (issueId: string) => void;
  toggleIssueSelection: (issueId: string) => void;
  selectMultipleIssues: (issueIds: string[]) => void;
  clearSelection: () => void;
  selectRange: (fromId: string, toId: string, allIssueIds: string[]) => void;
  setFocusedIssue: (issueId: string | null) => void;
  
  // Actions - Tree Expansion
  expandIssue: (issueId: string) => void;
  collapseIssue: (issueId: string) => void;
  toggleIssueExpanded: (issueId: string) => void;
  expandAll: (issueIds: string[]) => void;
  collapseAll: () => void;
  toggleRelationshipLines: () => void;
  setShowRelationshipLines: (show: boolean) => void;
  
  // Actions - Detail Panel
  openDetailPanel: (issueId: string) => void;
  closeDetailPanel: () => void;
  
  // Actions - Filters
  setFilter: <K extends keyof FilterState>(field: K, value: FilterState[K]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  
  // Actions - Sorting
  setSortConfig: (config: SortConfig | null) => void;
  
  // Actions - Modals
  openCreateIssueModal: (parentId?: string | null) => void;
  closeCreateIssueModal: () => void;
  
  // Actions - Search
  setSearchQuery: (query: string) => void;
  setSearchResultsVisible: (visible: boolean) => void;
  clearSearch: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state - View
  currentView: 'tree',
  sidebarCollapsed: false,
  
  // Initial state - Selection
  selectedIssueIds: [],
  focusedIssueId: null,
  
  // Initial state - Tree
  expandedIssueIds: [],
  showRelationshipLines: false,
  
  // Initial state - Detail Panel
  detailPanelOpen: false,
  detailPanelIssueId: null,
  
  // Initial state - Filters
  filters: { ...DEFAULT_FILTER_STATE },
  
  // Initial state - Sorting
  sortConfig: null,
  
  // Initial state - Modals
  createIssueModalOpen: false,
  createIssueParentId: null,
  
  // Initial state - Search
  searchQuery: '',
  searchResultsVisible: false,

  // ============================================================================
  // VIEW ACTIONS
  // ============================================================================

  setView: (view) => {
    set({ currentView: view });
  },

  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },

  // ============================================================================
  // SELECTION ACTIONS
  // ============================================================================

  selectIssue: (issueId) => {
    set(state => ({
      selectedIssueIds: state.selectedIssueIds.includes(issueId)
        ? state.selectedIssueIds
        : [...state.selectedIssueIds, issueId],
      focusedIssueId: issueId,
    }));
  },

  deselectIssue: (issueId) => {
    set(state => ({
      selectedIssueIds: state.selectedIssueIds.filter(id => id !== issueId),
    }));
  },

  toggleIssueSelection: (issueId) => {
    set(state => ({
      selectedIssueIds: state.selectedIssueIds.includes(issueId)
        ? state.selectedIssueIds.filter(id => id !== issueId)
        : [...state.selectedIssueIds, issueId],
      focusedIssueId: issueId,
    }));
  },

  selectMultipleIssues: (issueIds) => {
    set({ selectedIssueIds: issueIds });
  },

  clearSelection: () => {
    set({ selectedIssueIds: [] });
  },

  /**
   * Select a range of issues (for shift-click)
   */
  selectRange: (fromId, toId, allIssueIds) => {
    const fromIndex = allIssueIds.indexOf(fromId);
    const toIndex = allIssueIds.indexOf(toId);
    
    if (fromIndex === -1 || toIndex === -1) return;
    
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    const rangeIds = allIssueIds.slice(start, end + 1);
    
    set(state => ({
      selectedIssueIds: [...new Set([...state.selectedIssueIds, ...rangeIds])],
    }));
  },

  setFocusedIssue: (issueId) => {
    set({ focusedIssueId: issueId });
  },

  // ============================================================================
  // TREE EXPANSION ACTIONS
  // ============================================================================

  expandIssue: (issueId) => {
    set(state => ({
      expandedIssueIds: state.expandedIssueIds.includes(issueId)
        ? state.expandedIssueIds
        : [...state.expandedIssueIds, issueId],
    }));
  },

  collapseIssue: (issueId) => {
    set(state => ({
      expandedIssueIds: state.expandedIssueIds.filter(id => id !== issueId),
    }));
  },

  toggleIssueExpanded: (issueId) => {
    set(state => ({
      expandedIssueIds: state.expandedIssueIds.includes(issueId)
        ? state.expandedIssueIds.filter(id => id !== issueId)
        : [...state.expandedIssueIds, issueId],
    }));
  },

  expandAll: (issueIds) => {
    set({ expandedIssueIds: issueIds });
  },

  collapseAll: () => {
    set({ expandedIssueIds: [] });
  },

  toggleRelationshipLines: () => {
    set(state => ({ showRelationshipLines: !state.showRelationshipLines }));
  },

  setShowRelationshipLines: (show) => {
    set({ showRelationshipLines: show });
  },

  // ============================================================================
  // DETAIL PANEL ACTIONS
  // ============================================================================

  openDetailPanel: (issueId) => {
    set({ 
      detailPanelOpen: true, 
      detailPanelIssueId: issueId,
      focusedIssueId: issueId,
    });
  },

  closeDetailPanel: () => {
    set({ 
      detailPanelOpen: false, 
      detailPanelIssueId: null,
    });
  },

  // ============================================================================
  // FILTER ACTIONS
  // ============================================================================

  setFilter: (field, value) => {
    set(state => ({
      filters: { ...state.filters, [field]: value },
    }));
  },

  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearFilters: () => {
    set({ filters: { ...DEFAULT_FILTER_STATE } });
  },

  // ============================================================================
  // SORTING ACTIONS
  // ============================================================================

  setSortConfig: (config) => {
    set({ sortConfig: config });
  },

  // ============================================================================
  // MODAL ACTIONS
  // ============================================================================

  openCreateIssueModal: (parentId = null) => {
    set({ 
      createIssueModalOpen: true, 
      createIssueParentId: parentId ?? null,
    });
  },

  closeCreateIssueModal: () => {
    set({ 
      createIssueModalOpen: false, 
      createIssueParentId: null,
    });
  },

  // ============================================================================
  // SEARCH ACTIONS
  // ============================================================================

  setSearchQuery: (query) => {
    set({ 
      searchQuery: query,
      searchResultsVisible: query.length > 0,
    });
  },

  setSearchResultsVisible: (visible) => {
    set({ searchResultsVisible: visible });
  },

  clearSearch: () => {
    set({ 
      searchQuery: '',
      searchResultsVisible: false,
    });
  },
}));

// ============================================================================
// EXPORTS
// ============================================================================

export type { UIState };
