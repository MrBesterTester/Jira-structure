/**
 * SearchResults - Display search results from JQL query
 * 
 * Features:
 * - Shows matching issues in list format
 * - Displays match count
 * - Click to navigate to issue
 * - Clear button to reset search
 */

import { useMemo } from 'react';
import type { Issue } from '../../types';
import { IssueTypeIcon } from '../Issue/IssueTypeIcon';
import { StatusBadge } from '../Issue/StatusBadge';
import { PriorityIndicator } from '../Issue/PriorityIndicator';
import { parseJQL } from '../../utils/jqlParser';
import { evaluateJQL } from '../../utils/jqlEvaluator';
import { useIssueStore, useUIStore, useUserStore } from '../../store';

// ============================================================================
// TYPES
// ============================================================================

interface SearchResultsProps {
  query: string;
  onClose: () => void;
  onSelectIssue: (issueId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SearchResults({ query, onClose, onSelectIssue }: SearchResultsProps) {
  const issues = useIssueStore(state => state.issues);
  const users = useUserStore(state => state.users);
  const openDetailPanel = useUIStore(state => state.openDetailPanel);
  
  // Parse and evaluate query
  const { results, error, totalCount } = useMemo(() => {
    if (!query.trim()) {
      return { results: [], error: null, totalCount: 0 };
    }
    
    const parseResult = parseJQL(query);
    
    if (!parseResult.success) {
      return { 
        results: [], 
        error: parseResult.error?.message || 'Invalid query', 
        totalCount: 0 
      };
    }
    
    const matchingIssues = evaluateJQL(parseResult.ast, issues);
    
    return { 
      results: matchingIssues, 
      error: null, 
      totalCount: matchingIssues.length 
    };
  }, [query, issues]);
  
  // Get user display name
  const getUserName = (userId: string | null): string => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user?.displayName || userId;
  };
  
  // Handle clicking on a result
  const handleResultClick = (issue: Issue) => {
    onSelectIssue(issue.id);
    openDetailPanel(issue.id);
  };
  
  // If no query, don't show anything
  if (!query.trim()) {
    return null;
  }
  
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[70vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {error ? (
              <span className="text-red-600">Search Error</span>
            ) : (
              <>
                {totalCount} {totalCount === 1 ? 'result' : 'results'}
              </>
            )}
          </span>
        </div>
        
        <button
          onClick={onClose}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-600 text-sm">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}
      
      {/* Results list */}
      {!error && results.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {results.map((issue) => (
            <button
              key={issue.id}
              onClick={() => handleResultClick(issue)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              {/* Type icon */}
              <div className="mt-0.5">
                <IssueTypeIcon type={issue.type} size="sm" />
              </div>
              
              {/* Issue info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">{issue.key}</span>
                  <StatusBadge status={issue.status} size="sm" />
                  <PriorityIndicator priority={issue.priority} size="sm" />
                </div>
                
                <div className="text-sm font-medium text-gray-900 truncate">
                  {issue.title}
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>
                    Assignee: {getUserName(issue.assignee)}
                  </span>
                  {issue.storyPoints && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {issue.storyPoints} pts
                    </span>
                  )}
                  {issue.labels.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {issue.labels.slice(0, 2).join(', ')}
                      {issue.labels.length > 2 && ` +${issue.labels.length - 2}`}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Arrow indicator */}
              <svg className="w-4 h-4 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
      
      {/* Empty state */}
      {!error && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm font-medium text-gray-600 mb-1">No issues found</p>
          <p className="text-xs text-gray-400">Try adjusting your search query</p>
          
          {/* Example queries */}
          <div className="mt-4 text-xs text-gray-500">
            <p className="font-medium mb-2">Example queries:</p>
            <ul className="space-y-1 text-left">
              <li><code className="bg-gray-100 px-1 rounded">type = Bug</code></li>
              <li><code className="bg-gray-100 px-1 rounded">status = "In Progress"</code></li>
              <li><code className="bg-gray-100 px-1 rounded">priority = High AND type = Bug</code></li>
              <li><code className="bg-gray-100 px-1 rounded">labels ~ frontend</code></li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Footer with keyboard hints */}
      {results.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs ml-1">↓</kbd>
            <span className="ml-1">Navigate</span>
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd>
            <span className="ml-1">Select</span>
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
            <span className="ml-1">Close</span>
          </span>
        </div>
      )}
    </div>
  );
}
