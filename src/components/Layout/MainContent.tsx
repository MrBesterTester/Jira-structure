/**
 * MainContent - Main content area container
 * 
 * Renders the appropriate view based on UIStore.currentView.
 * Currently shows placeholder content until Tree and Kanban views are implemented.
 */

import { ReactNode } from 'react';
import { useUIStore, useIssueStore } from '../../store';
import { IssueStatus, Issue } from '../../types';
import { IssueCard } from '../Issue';

interface MainContentProps {
  children?: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const currentView = useUIStore(state => state.currentView);
  const getRootIssues = useIssueStore(state => state.getRootIssues);
  const getIssuesByStatus = useIssueStore(state => state.getIssuesByStatus);
  const openDetailPanel = useUIStore(state => state.openDetailPanel);
  const toggleIssueSelection = useUIStore(state => state.toggleIssueSelection);
  
  const rootIssues = getRootIssues();

  const handleIssueClick = (issue: Issue) => {
    toggleIssueSelection(issue.id);
  };

  const handleIssueDoubleClick = (issue: Issue) => {
    openDetailPanel(issue.id);
  };

  // If children are provided, render them instead of placeholder
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
        <TreeViewPlaceholder 
          rootIssues={rootIssues} 
          onIssueClick={handleIssueClick}
          onIssueDoubleClick={handleIssueDoubleClick}
        />
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

// Placeholder Tree View
interface TreeViewPlaceholderProps {
  rootIssues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onIssueDoubleClick: (issue: Issue) => void;
}

function TreeViewPlaceholder({ rootIssues, onIssueClick, onIssueDoubleClick }: TreeViewPlaceholderProps) {
  return (
    <div className="p-4">
      {/* Toolbar placeholder */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            Expand All
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            Collapse All
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <span className="text-sm text-gray-500">
            {rootIssues.length} root issues
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-sm border border-gray-200 rounded-md px-2 py-1.5">
            <option>Sort by: Created</option>
            <option>Sort by: Priority</option>
            <option>Sort by: Status</option>
          </select>
        </div>
      </div>

      {/* Tree items using IssueCard component */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {rootIssues.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium">No issues found</p>
            <p className="text-sm mt-1">Create your first issue to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rootIssues.slice(0, 15).map((issue) => (
              <TreeItemRow 
                key={issue.id} 
                issue={issue} 
                depth={0}
                onIssueClick={onIssueClick}
                onIssueDoubleClick={onIssueDoubleClick}
              />
            ))}
            {rootIssues.length > 15 && (
              <div className="p-3 text-sm text-gray-500 text-center bg-gray-50">
                + {rootIssues.length - 15} more issues
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Implementation note */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Note:</span> Full tree view with drag-and-drop will be implemented in Phase 3.
        </p>
      </div>
    </div>
  );
}

// Tree item row wrapper for indentation
interface TreeItemRowProps {
  issue: Issue;
  depth: number;
  onIssueClick: (issue: Issue) => void;
  onIssueDoubleClick: (issue: Issue) => void;
}

function TreeItemRow({ issue, depth, onIssueClick, onIssueDoubleClick }: TreeItemRowProps) {
  const hasChildren = issue.childIds.length > 0;
  
  return (
    <div 
      className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 transition-colors"
      style={{ paddingLeft: `${8 + depth * 24}px` }}
    >
      {/* Expand/collapse placeholder */}
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        {hasChildren ? (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        )}
      </div>

      {/* IssueCard in compact mode */}
      <div className="flex-1 min-w-0">
        <IssueCard
          issue={issue}
          mode="compact"
          onClick={onIssueClick}
          onDoubleClick={onIssueDoubleClick}
        />
      </div>

      {/* Children count */}
      {hasChildren && (
        <span className="text-xs text-gray-400 shrink-0">
          {issue.childIds.length} children
        </span>
      )}
    </div>
  );
}

// Placeholder Kanban View
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
