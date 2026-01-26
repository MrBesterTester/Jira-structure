/**
 * User Store - Zustand state management for users/team members
 * 
 * Handles user-related state for assignees and team management.
 */

import { create } from 'zustand';
import type { User } from '../types';
import * as api from '../services/api';

// ============================================================================
// TYPES
// ============================================================================

interface UserState {
  // State
  users: User[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchUsers: () => Promise<void>;
  createUser: (user: Omit<User, 'id'>) => Promise<User | null>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  
  // Selectors
  getUserById: (id: string) => User | undefined;
  getUserByEmail: (email: string) => User | undefined;
  searchUsers: (query: string) => User[];
  
  // Internal helpers
  _syncToApi: (users: User[]) => Promise<boolean>;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  users: [],
  loading: false,
  error: null,

  // ============================================================================
  // ASYNC ACTIONS
  // ============================================================================

  /**
   * Fetch all users from the API
   */
  fetchUsers: async () => {
    set({ loading: true, error: null });
    
    const response = await api.fetchUsers();
    
    if (response.success) {
      set({ users: response.data, loading: false });
    } else {
      set({ error: response.error || 'Failed to fetch users', loading: false });
    }
  },

  /**
   * Create a new user
   */
  createUser: async (userData) => {
    const state = get();
    
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedUsers = [...state.users, newUser];

    // Optimistic update
    set({ users: updatedUsers, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedUsers);
    
    if (!success) {
      set({ users: state.users, error: 'Failed to create user' });
      return null;
    }
    
    return newUser;
  },

  /**
   * Update an existing user
   */
  updateUser: async (userId, updates) => {
    const state = get();
    
    const existingUser = state.users.find(u => u.id === userId);
    if (!existingUser) {
      set({ error: `User ${userId} not found` });
      return false;
    }

    const updatedUsers = state.users.map(user =>
      user.id === userId
        ? { ...user, ...updates }
        : user
    );

    // Optimistic update
    set({ users: updatedUsers, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedUsers);
    
    if (!success) {
      set({ users: state.users, error: 'Failed to update user' });
      return false;
    }
    
    return true;
  },

  /**
   * Delete a user
   */
  deleteUser: async (userId) => {
    const state = get();
    
    const updatedUsers = state.users.filter(u => u.id !== userId);

    // Optimistic update
    set({ users: updatedUsers, error: null });
    
    // Sync to API
    const success = await state._syncToApi(updatedUsers);
    
    if (!success) {
      set({ users: state.users, error: 'Failed to delete user' });
      return false;
    }
    
    return true;
  },

  // ============================================================================
  // SELECTORS
  // ============================================================================

  getUserById: (id) => {
    return get().users.find(u => u.id === id);
  },

  getUserByEmail: (email) => {
    return get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  searchUsers: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().users.filter(u => 
      u.displayName.toLowerCase().includes(lowerQuery) ||
      u.email.toLowerCase().includes(lowerQuery)
    );
  },

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  _syncToApi: async (users) => {
    const response = await api.updateUsers(users);
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

export type { UserState };
