/**
 * IssueDetailPanel - Slide-out panel for viewing and editing issue details
 * 
 * Features:
 * - Slides in from the right side
 * - Tabbed content (Details, Relationships, Activity)
 * - Header with issue key, type icon, close button
 * - Auto-save on field changes
 */

import { useState, useEffect, useCallback, memo } from 'react';
import type { Issue } from '../../types';
import { useUIStore, useIssueStore } from '../../store';
import { IssueTypeIcon } from './IssueTypeIcon';
import { IssueDetailsTab } from './IssueDetailsTab';
import { IssueRelationshipsTab } from './IssueRelationshipsTab';

// ============================================================================
// TYPES
// ============================================================================

type TabId = 'details' | 'relationships' | 'activity';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'details', label: 'Details' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'activity', label: 'Activity' },
];

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

interface DeleteConfirmModalProps {
  issue: Issue;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmModal = memo(function DeleteConfirmModal({
  issue,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Delete Issue?
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{issue.key}</strong>: "{issue.title}"?
        </p>
        
        {issue.childIds.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This issue has {issue.childIds.length} child issue(s). 
              They will be moved to the root level.
            </p>
          </div>
        )}
        
        <p className="text-sm text-gray-500 mb-6">
          This action cannot be undone.
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Delete Issue
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// TAB NAVIGATION
// ============================================================================

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TabNav = memo(function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
});


// ============================================================================
// ACTIVITY TAB (Placeholder)
// ============================================================================

interface ActivityTabProps {
  issue: Issue;
}

const ActivityTab = memo(function ActivityTab({ issue }: ActivityTabProps) {
  return (
    <div className="p-4">
      <div className="text-center py-12">
        <svg 
          className="w-12 h-12 mx-auto text-gray-300 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <h3 className="text-sm font-medium text-gray-700 mb-1">Activity History</h3>
        <p className="text-sm text-gray-400">
          Coming in a future update
        </p>
      </div>
      
      {/* Show timestamps */}
      <div className="mt-8 border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Created</span>
          <span className="text-gray-700">
            {new Date(issue.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Updated</span>
          <span className="text-gray-700">
            {new Date(issue.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IssueDetailPanel = memo(function IssueDetailPanel() {
  const detailPanelOpen = useUIStore(state => state.detailPanelOpen);
  const detailPanelIssueId = useUIStore(state => state.detailPanelIssueId);
  const closeDetailPanel = useUIStore(state => state.closeDetailPanel);
  
  // Get full issues array - ensures re-render when issues change
  const issues = useIssueStore(state => state.issues);
  const deleteIssue = useIssueStore(state => state.deleteIssue);
  
  // Find the issue from the array
  const issue = detailPanelIssueId ? issues.find(i => i.id === detailPanelIssueId) : undefined;
  
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Reset tab when panel opens/closes or issue changes
  useEffect(() => {
    setActiveTab('details');
    setShowDeleteConfirm(false);
  }, [detailPanelIssueId]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!issue) return;
    
    setIsDeleting(true);
    const success = await deleteIssue(issue.id);
    setIsDeleting(false);
    
    if (success) {
      setShowDeleteConfirm(false);
      closeDetailPanel();
    }
  }, [issue, deleteIssue, closeDetailPanel]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          closeDetailPanel();
        }
      }
    };

    if (detailPanelOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [detailPanelOpen, showDeleteConfirm, closeDetailPanel]);

  // Don't render if closed
  if (!detailPanelOpen) return null;

  // Handle case where issue doesn't exist
  if (!issue) {
    return (
      <div className="fixed inset-y-0 right-0 w-[600px] max-w-[60vw] bg-white shadow-xl z-50 flex flex-col">
        <div className="p-6 text-center text-gray-500">
          Issue not found
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={closeDetailPanel}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[600px] max-w-[60vw] bg-white shadow-xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <IssueTypeIcon type={issue.type} size="lg" />
            <span className="text-lg font-mono font-medium text-gray-700">
              {issue.key}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Delete issue"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            {/* Close Button */}
            <button
              onClick={closeDetailPanel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <IssueDetailsTab issue={issue} />
          )}
          {activeTab === 'relationships' && (
            <IssueRelationshipsTab issue={issue} />
          )}
          {activeTab === 'activity' && (
            <ActivityTab issue={issue} />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        issue={issue}
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
});
