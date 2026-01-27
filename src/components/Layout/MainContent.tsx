/**
 * MainContent - Main content area container
 * 
 * Renders the appropriate view based on UIStore.currentView.
 * - Tree view: Full hierarchical view with expand/collapse
 * - Kanban view: Board with status columns and cards
 */

import { ReactNode } from 'react';
import { useUIStore } from '../../store';
import { TreeView } from '../Tree';
import { KanbanBoard } from '../Kanban';

interface MainContentProps {
  children?: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const currentView = useUIStore(state => state.currentView);

  // If children are provided, render them instead of the views
  if (children) {
    return (
      <main className="flex-1 overflow-auto bg-gray-50 p-4">
        {children}
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-gray-50">
      {currentView === 'tree' ? (
        <TreeView />
      ) : (
        <KanbanBoard />
      )}
    </main>
  );
}
