/**
 * BulkActionBar - Floating action bar for bulk operations
 * 
 * Appears when issues are selected, showing:
 * - Selection count
 * - Action buttons: Change Status, Assignee, Priority, Labels, Sprint, Move, Delete
 * - Deselect all button
 */

import { memo, useState, useCallback } from 'react';
import { useUIStore, useIssueStore, useSprintStore, useUserStore } from '../../store';
import { IssueStatus, Priority } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface BulkActionBarProps {
  className?: string;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface QuickActionDropdownProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

const QuickActionDropdown = memo(function QuickActionDropdown({
  label,
  icon,
  children,
  disabled = false,
}: QuickActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
          transition-colors
          ${disabled 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        title={label}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50">
          {children}
        </div>
      )}
    </div>
  );
});

interface DropdownItemProps {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}

const DropdownItem = memo(function DropdownItem({ onClick, children, danger = false }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-3 py-1.5 text-sm
        ${danger 
          ? 'text-red-600 hover:bg-red-50' 
          : 'text-gray-700 hover:bg-gray-50'
        }
      `}
    >
      {children}
    </button>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BulkActionBar = memo(function BulkActionBar({ className = '' }: BulkActionBarProps) {
  // Store hooks
  const selectedIssueIds = useUIStore(state => state.selectedIssueIds);
  const clearSelection = useUIStore(state => state.clearSelection);
  const bulkUpdateIssues = useIssueStore(state => state.bulkUpdateIssues);
  const bulkDeleteIssues = useIssueStore(state => state.bulkDeleteIssues);
  const users = useUserStore(state => state.users);
  const sprints = useSprintStore(state => state.sprints);
  
  // Local state for modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectionCount = selectedIssueIds.length;

  // Quick action handlers
  const handleStatusChange = useCallback(async (status: IssueStatus) => {
    setIsProcessing(true);
    await bulkUpdateIssues(selectedIssueIds, { status });
    setIsProcessing(false);
  }, [selectedIssueIds, bulkUpdateIssues]);

  const handlePriorityChange = useCallback(async (priority: Priority) => {
    setIsProcessing(true);
    await bulkUpdateIssues(selectedIssueIds, { priority });
    setIsProcessing(false);
  }, [selectedIssueIds, bulkUpdateIssues]);

  const handleAssigneeChange = useCallback(async (assignee: string | null) => {
    setIsProcessing(true);
    await bulkUpdateIssues(selectedIssueIds, { assignee });
    setIsProcessing(false);
  }, [selectedIssueIds, bulkUpdateIssues]);

  const handleSprintChange = useCallback(async (sprint: string | null) => {
    setIsProcessing(true);
    await bulkUpdateIssues(selectedIssueIds, { sprint });
    setIsProcessing(false);
  }, [selectedIssueIds, bulkUpdateIssues]);

  const handleDelete = useCallback(async () => {
    setIsProcessing(true);
    await bulkDeleteIssues(selectedIssueIds);
    clearSelection();
    setShowDeleteConfirm(false);
    setIsProcessing(false);
  }, [selectedIssueIds, bulkDeleteIssues, clearSelection]);

  // Don't render if nothing selected
  if (selectionCount === 0) {
    return null;
  }

  return (
    <>
      {/* Main action bar */}
      <div className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-40
        bg-white rounded-lg shadow-lg border border-gray-200
        flex items-center gap-1 px-2 py-1.5
        ${className}
      `}>
        {/* Selection count */}
        <div className="flex items-center gap-2 px-3 py-1 border-r border-gray-200">
          <span className="text-sm font-semibold text-blue-600">
            {selectionCount} selected
          </span>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            title="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status dropdown */}
        <QuickActionDropdown
          label="Status"
          disabled={isProcessing}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        >
          {Object.values(IssueStatus).map(status => (
            <DropdownItem key={status} onClick={() => handleStatusChange(status)}>
              {status}
            </DropdownItem>
          ))}
        </QuickActionDropdown>

        {/* Priority dropdown */}
        <QuickActionDropdown
          label="Priority"
          disabled={isProcessing}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          }
        >
          {Object.values(Priority).map(priority => (
            <DropdownItem key={priority} onClick={() => handlePriorityChange(priority)}>
              {priority}
            </DropdownItem>
          ))}
        </QuickActionDropdown>

        {/* Assignee dropdown */}
        <QuickActionDropdown
          label="Assignee"
          disabled={isProcessing}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <DropdownItem onClick={() => handleAssigneeChange(null)}>
            <span className="text-gray-400">Unassigned</span>
          </DropdownItem>
          {users.map(user => (
            <DropdownItem key={user.id} onClick={() => handleAssigneeChange(user.id)}>
              {user.displayName}
            </DropdownItem>
          ))}
        </QuickActionDropdown>

        {/* Sprint dropdown */}
        <QuickActionDropdown
          label="Sprint"
          disabled={isProcessing}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        >
          <DropdownItem onClick={() => handleSprintChange(null)}>
            <span className="text-gray-400">No Sprint</span>
          </DropdownItem>
          {sprints.map(sprint => (
            <DropdownItem key={sprint.id} onClick={() => handleSprintChange(sprint.id)}>
              {sprint.name}
            </DropdownItem>
          ))}
        </QuickActionDropdown>

        {/* More actions button */}
        <button
          onClick={() => setShowEditModal(true)}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
          title="More options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="hidden sm:inline">Edit</span>
        </button>

        {/* Move button */}
        <button
          onClick={() => setShowMoveModal(true)}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
          title="Move to parent"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="hidden sm:inline">Move</span>
        </button>

        {/* Delete button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 disabled:text-gray-400"
          title="Delete selected"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete {selectionCount} issue{selectionCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. All selected issues and their relationships will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {isProcessing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal placeholder - will be implemented in BulkEditModal */}
      {showEditModal && (
        <BulkEditModalWrapper 
          onClose={() => setShowEditModal(false)} 
          selectedIds={selectedIssueIds}
        />
      )}

      {/* Move modal placeholder - will be implemented in BulkMoveModal */}
      {showMoveModal && (
        <BulkMoveModalWrapper 
          onClose={() => setShowMoveModal(false)} 
          selectedIds={selectedIssueIds}
        />
      )}
    </>
  );
});

// ============================================================================
// MODAL WRAPPER COMPONENTS (lazy load the actual modals)
// ============================================================================

import { lazy, Suspense } from 'react';

const BulkEditModal = lazy(() => import('./BulkEditModal').then(m => ({ default: m.BulkEditModal })));
const BulkMoveModal = lazy(() => import('./BulkMoveModal').then(m => ({ default: m.BulkMoveModal })));

function BulkEditModalWrapper({ onClose, selectedIds }: { onClose: () => void; selectedIds: string[] }) {
  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <BulkEditModal onClose={onClose} selectedIssueIds={selectedIds} />
    </Suspense>
  );
}

function BulkMoveModalWrapper({ onClose, selectedIds }: { onClose: () => void; selectedIds: string[] }) {
  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <BulkMoveModal onClose={onClose} selectedIssueIds={selectedIds} />
    </Suspense>
  );
}

function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-lg shadow-xl p-6">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BulkActionBar;
