/**
 * MainContent - Main content area container
 * 
 * Renders the appropriate view based on UIStore.currentView.
 * Currently shows placeholder content until Tree and Kanban views are implemented.
 */

import { ReactNode } from 'react';
import { useUIStore, useIssueStore } from '../../store';
import { IssueType, IssueStatus } from '../../types';

interface MainContentProps {
  children?: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const currentView = useUIStore(state => state.currentView);
  const issues = useIssueStore(state => state.issues);
  const getRootIssues = useIssueStore(state => state.getRootIssues);
  const getIssuesByStatus = useIssueStore(state => state.getIssuesByStatus);
  
  const rootIssues = getRootIssues();

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
        <TreeViewPlaceholder rootIssues={rootIssues} />
      ) : (
        <KanbanViewPlaceholder getIssuesByStatus={getIssuesByStatus} />
      )}
    </main>
  );
}

// Placeholder Tree View
interface TreeViewPlaceholderProps {
  rootIssues: ReturnType<ReturnType<typeof useIssueStore>['getRootIssues']>;
}

function TreeViewPlaceholder({ rootIssues }: TreeViewPlaceholderProps) {
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

      {/* Tree items placeholder */}
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
              <TreeItemPlaceholder key={issue.id} issue={issue} depth={0} />
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

// Tree item placeholder
interface TreeItemPlaceholderProps {
  issue: {
    id: string;
    key: string;
    title: string;
    type: IssueType;
    status: IssueStatus;
    childIds: string[];
  };
  depth: number;
}

function TreeItemPlaceholder({ issue, depth }: TreeItemPlaceholderProps) {
  const hasChildren = issue.childIds.length > 0;
  
  const typeColors: Record<IssueType, string> = {
    [IssueType.Initiative]: 'bg-purple-100 text-purple-700',
    [IssueType.Epic]: 'bg-blue-100 text-blue-700',
    [IssueType.Feature]: 'bg-cyan-100 text-cyan-700',
    [IssueType.Story]: 'bg-green-100 text-green-700',
    [IssueType.Task]: 'bg-gray-100 text-gray-700',
    [IssueType.Bug]: 'bg-red-100 text-red-700',
    [IssueType.Subtask]: 'bg-gray-100 text-gray-600',
  };

  const statusColors: Record<IssueStatus, string> = {
    [IssueStatus.Todo]: 'bg-gray-100 text-gray-600',
    [IssueStatus.InProgress]: 'bg-blue-100 text-blue-700',
    [IssueStatus.InReview]: 'bg-yellow-100 text-yellow-700',
    [IssueStatus.Done]: 'bg-green-100 text-green-700',
  };

  return (
    <div 
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ paddingLeft: `${16 + depth * 24}px` }}
    >
      {/* Expand/collapse placeholder */}
      <div className="w-5 h-5 flex items-center justify-center">
        {hasChildren ? (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        )}
      </div>

      {/* Issue key */}
      <span className="text-xs font-mono text-gray-500 min-w-[80px]">{issue.key}</span>

      {/* Type badge */}
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[issue.type]}`}>
        {issue.type}
      </span>

      {/* Title */}
      <span className="flex-1 text-sm text-gray-900 truncate">{issue.title}</span>

      {/* Status badge */}
      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[issue.status]}`}>
        {issue.status}
      </span>

      {/* Children count */}
      {hasChildren && (
        <span className="text-xs text-gray-400">
          {issue.childIds.length} children
        </span>
      )}
    </div>
  );
}

// Placeholder Kanban View
interface KanbanViewPlaceholderProps {
  getIssuesByStatus: ReturnType<typeof useIssueStore>['getIssuesByStatus'];
}

function KanbanViewPlaceholder({ getIssuesByStatus }: KanbanViewPlaceholderProps) {
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

              {/* Column content */}
              <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2">
                {columnIssues.slice(0, 8).map(issue => (
                  <KanbanCardPlaceholder key={issue.id} issue={issue} />
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

// Kanban card placeholder
interface KanbanCardPlaceholderProps {
  issue: {
    id: string;
    key: string;
    title: string;
    type: IssueType;
    priority: string;
    storyPoints: number | null;
  };
}

function KanbanCardPlaceholder({ issue }: KanbanCardPlaceholderProps) {
  const typeIcons: Record<IssueType, string> = {
    [IssueType.Initiative]: '🎯',
    [IssueType.Epic]: '⚡',
    [IssueType.Feature]: '✨',
    [IssueType.Story]: '📖',
    [IssueType.Task]: '✅',
    [IssueType.Bug]: '🐛',
    [IssueType.Subtask]: '📌',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <span className="text-lg">{typeIcons[issue.type]}</span>
        {issue.storyPoints && (
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {issue.storyPoints} SP
          </span>
        )}
      </div>
      <p className="text-sm text-gray-900 mt-2 line-clamp-2">{issue.title}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs font-mono text-gray-400">{issue.key}</span>
        <div className="w-6 h-6 rounded-full bg-gray-200" title="Unassigned" />
      </div>
    </div>
  );
}
