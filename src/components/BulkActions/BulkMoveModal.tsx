/**
 * BulkMoveModal - Modal for moving multiple issues to a new parent
 * 
 * Features:
 * - Issue picker for selecting new parent
 * - Preview of affected issues
 * - Warning if issues have different current parents
 * - Option to move to root level
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { useIssueStore } from '../../store';
import type { Issue } from '../../types';
import { IssueTypeIcon } from '../Issue/IssueTypeIcon';

// ============================================================================
// TYPES
// ============================================================================

export interface BulkMoveModalProps {
  onClose: () => void;
  selectedIssueIds: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BulkMoveModal = memo(function BulkMoveModal({
  onClose,
  selectedIssueIds,
}: BulkMoveModalProps) {
  // Store hooks
  const issues = useIssueStore(state => state.issues);
  const moveIssue = useIssueStore(state => state.moveIssue);

  // Get selected issues
  const selectedIssues = useMemo(() => {
    return issues.filter(i => selectedIssueIds.includes(i.id));
  }, [issues, selectedIssueIds]);

  // Get potential parent issues (exclude selected issues and their children)
  const availableParents = useMemo(() => {
    // Get all descendant IDs of selected issues
    const getDescendantIds = (issueId: string): string[] => {
      const issue = issues.find(i => i.id === issueId);
      if (!issue) return [];
      const descendants: string[] = [];
      issue.childIds.forEach(childId => {
        descendants.push(childId);
        descendants.push(...getDescendantIds(childId));
      });
      return descendants;
    };

    const excludedIds = new Set<string>();
    selectedIssueIds.forEach(id => {
      excludedIds.add(id);
      getDescendantIds(id).forEach(descId => excludedIds.add(descId));
    });

    return issues.filter(i => !excludedIds.has(i.id));
  }, [issues, selectedIssueIds]);

  // Current parents of selected issues
  const currentParents = useMemo(() => {
    const parentIds = new Set(selectedIssues.map(i => i.parentId).filter(Boolean));
    return Array.from(parentIds).map(id => issues.find(i => i.id === id)).filter(Boolean) as Issue[];
  }, [selectedIssues, issues]);

  // Local state
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [moveToRoot, setMoveToRoot] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter available parents by search
  const filteredParents = useMemo(() => {
    if (!searchQuery) return availableParents;
    const query = searchQuery.toLowerCase();
    return availableParents.filter(issue => 
      issue.key.toLowerCase().includes(query) ||
      issue.title.toLowerCase().includes(query)
    );
  }, [availableParents, searchQuery]);

  // Handle parent selection
  const handleSelectParent = useCallback((parentId: string | null) => {
    setSelectedParentId(parentId);
    setMoveToRoot(parentId === null);
  }, []);

  // Handle move to root toggle
  const handleMoveToRootChange = useCallback((checked: boolean) => {
    setMoveToRoot(checked);
    if (checked) {
      setSelectedParentId(null);
    }
  }, []);

  // Apply move
  const handleApply = useCallback(async () => {
    setIsProcessing(true);

    const targetParentId = moveToRoot ? null : selectedParentId;

    // Move each issue sequentially
    for (const issueId of selectedIssueIds) {
      await moveIssue(issueId, targetParentId);
    }

    setIsProcessing(false);
    onClose();
  }, [moveToRoot, selectedParentId, selectedIssueIds, moveIssue, onClose]);

  const canApply = moveToRoot || selectedParentId !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Move {selectedIssueIds.length} issue{selectedIssueIds.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Current parents warning */}
          {currentParents.length > 1 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Selected issues have different parents
                  </p>
                  <p className="text-sm text-yellow-700 mt-0.5">
                    Currently under: {currentParents.map(p => p.key).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Move to root option */}
          <div className="mb-4">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="parent"
                checked={moveToRoot}
                onChange={(e) => handleMoveToRootChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Move to root level</p>
                <p className="text-xs text-gray-500">Issues will have no parent</p>
              </div>
            </label>
          </div>

          {/* Or select parent */}
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Or select a new parent:</p>
            
            {/* Search */}
            <div className="relative mb-3">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Parent list */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {filteredParents.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No matching issues found
                </div>
              ) : (
                filteredParents.map(issue => (
                  <label
                    key={issue.id}
                    className={`
                      flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0
                      ${selectedParentId === issue.id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <input
                      type="radio"
                      name="parent"
                      checked={selectedParentId === issue.id && !moveToRoot}
                      onChange={() => handleSelectParent(issue.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <IssueTypeIcon type={issue.type} size="sm" />
                    <span className="font-mono text-xs text-gray-500 shrink-0">
                      {issue.key}
                    </span>
                    <span className="text-sm text-gray-900 truncate">
                      {issue.title}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Preview of affected issues */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Issues to move</h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {selectedIssues.slice(0, 8).map(issue => (
                  <div key={issue.id} className="flex items-center gap-2 text-sm">
                    <IssueTypeIcon type={issue.type} size="sm" />
                    <span className="font-mono text-gray-500">{issue.key}</span>
                    <span className="text-gray-700 truncate">{issue.title}</span>
                  </div>
                ))}
                {selectedIssues.length > 8 && (
                  <div className="text-sm text-gray-400">
                    +{selectedIssues.length - 8} more issues
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isProcessing || !canApply}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Moving...' : `Move ${selectedIssueIds.length} issues`}
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export default BulkMoveModal;
