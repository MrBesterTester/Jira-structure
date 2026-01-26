/**
 * MainContent - Main content area container
 * 
 * Renders the appropriate view based on UIStore.currentView.
 * - Tree view is fully implemented in Phase 3
 * - Kanban view shows placeholder until Phase 4
 */

import { ReactNode } from 'react';
import { useUIStore, useIssueStore } from '../../store';
import { IssueStatus, Issue } from '../../types';
import { IssueCard } from '../Issue';
import { TreeView } from '../Tree';

interface MainContentProps {
  children?: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const currentView = useUIStore(state => state.currentView);
  const getIssuesByStatus = useIssueStore(state => state.getIssuesByStatus);
  const openDetailPanel = useUIStore(state => state.openDetailPanel);
  const toggleIssueSelection = useUIStore(state => state.toggleIssueSelection);

  const handleIssueClick = (issue: Issue) => {
    toggleIssueSelection(issue.id);
  };

  const handleIssueDoubleClick = (issue: Issue) => {
    openDetailPanel(issue.id);
  };

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
        <KanbanViewPlaceholder 
          getIssuesByStatus={getIssuesByStatus}
          onIssueClick={handleIssueClick}
          onIssueDoubleClick={handleIssueDoubleClick}
        />
      )}
    </main>
  );
}

// Placeholder Kanban View (will be replaced in Phase 4)
interface KanbanViewPlaceholderProps {
  getIssuesByStatus: (status: IssueStatus) => Issue[];
  onIssueClick: (issue: Issue) => void;
  onIssueDoubleClick: (issue: Issue) => void;
}

function KanbanViewPlaceholder({ getIssuesByStatus, onIssueClick, onIssueDoubleClick }: KanbanViewPlaceholderProps) {
  const columns = [
    { status: IssueStatus.Todo, label: 'To Do', color: 'bg-gray-400' },
    { status: IssueStatus.InProgress, label: 'In Progress', color: 'bg-blue-500' },
    { status: IssueStatus.InReview, label: 'In Review', color: 'bg-yellow-500' },
    { status: IssueStatus.Done, label: 'Done', color: 'bg-green-500' },
  ];

  return (
    <div className="p-4 h-full">
      {/* Toolbar placeholder */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <select className="text-sm border border-gray-200 rounded-md px-2 py-1.5">
            <option>Filter by: All</option>
            <option>Filter by: My Issues</option>
            <option>Filter by: Unassigned</option>
          </select>
          <select className="text-sm border border-gray-200 rounded-md px-2 py-1.5">
            <option>Group by: None</option>
            <option>Group by: Assignee</option>
            <option>Group by: Epic</option>
          </select>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 h-[calc(100%-60px)] overflow-x-auto pb-4">
        {columns.map(column => {
          const columnIssues = getIssuesByStatus(column.status);
          
          return (
            <div 
              key={column.status} 
              className="flex-shrink-0 w-72 flex flex-col bg-gray-100 rounded-lg"
            >
              {/* Column header */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${column.color}`} />
                  <span className="font-medium text-sm text-gray-700">{column.label}</span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                    {columnIssues.length}
                  </span>
                </div>
              </div>

              {/* Column content with IssueCard components */}
              <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2">
                {columnIssues.slice(0, 8).map(issue => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    mode="expanded"
                    showStatus={false}
                    showParent={true}
                    onClick={onIssueClick}
                    onDoubleClick={onIssueDoubleClick}
                  />
                ))}
                {columnIssues.length > 8 && (
                  <div className="p-2 text-xs text-gray-500 text-center">
                    + {columnIssues.length - 8} more
                  </div>
                )}
                {columnIssues.length === 0 && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No issues
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Implementation note */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Note:</span> Full Kanban board with drag-and-drop will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
