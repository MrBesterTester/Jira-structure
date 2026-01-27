/**
 * Toast Store - Manages toast notifications
 * 
 * Uses Zustand for simple global state management.
 * Toasts auto-dismiss after a timeout.
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description: string | undefined;
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Generate unique ID for toasts
let toastId = 0;
const generateId = () => `toast-${++toastId}`;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions for showing toasts
export const toast = {
  success: (message: string, description?: string, duration = 4000) => {
    useToastStore.getState().addToast({ type: 'success', message, description, duration });
  },
  error: (message: string, description?: string, duration = 6000) => {
    useToastStore.getState().addToast({ type: 'error', message, description, duration });
  },
  warning: (message: string, description?: string, duration = 5000) => {
    useToastStore.getState().addToast({ type: 'warning', message, description, duration });
  },
  info: (message: string, description?: string, duration = 4000) => {
    useToastStore.getState().addToast({ type: 'info', message, description, duration });
  },
};
