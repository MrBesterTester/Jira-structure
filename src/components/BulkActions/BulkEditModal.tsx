/**
 * BulkEditModal - Modal for bulk editing multiple issues
 * 
 * Features:
 * - Edit multiple fields at once
 * - Preview of affected issues
 * - Field selection checkboxes
 * - Confirmation before applying
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { useIssueStore, useUserStore, useSprintStore } from '../../store';
import type { Issue } from '../../types';
import { IssueStatus, Priority } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface BulkEditModalProps {
  onClose: () => void;
  selectedIssueIds: string[];
}

interface EditableFields {
  status: IssueStatus | null;
  priority: Priority | null;
  assignee: string | null | undefined; // undefined = don't change, null = unassign
  sprint: string | null | undefined;
  labels: string[] | null;
  storyPoints: number | null | undefined;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BulkEditModal = memo(function BulkEditModal({
  onClose,
  selectedIssueIds,
}: BulkEditModalProps) {
  // Store hooks
  const issues = useIssueStore(state => state.issues);
  const bulkUpdateIssues = useIssueStore(state => state.bulkUpdateIssues);
  const users = useUserStore(state => state.users);
  const sprints = useSprintStore(state => state.sprints);

  // Get selected issues
  const selectedIssues = useMemo(() => {
    return issues.filter(i => selectedIssueIds.includes(i.id));
  }, [issues, selectedIssueIds]);

  // Track which fields to update
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({
    status: false,
    priority: false,
    assignee: false,
    sprint: false,
    labels: false,
    storyPoints: false,
  });

  // Field values
  const [fields, setFields] = useState<EditableFields>({
    status: null,
    priority: null,
    assignee: undefined,
    sprint: undefined,
    labels: null,
    storyPoints: undefined,
  });

  // Labels input
  const [labelsInput, setLabelsInput] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle field enabled state
  const toggleField = useCallback((field: string) => {
    setEnabledFields(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Handle field value changes
  const handleStatusChange = useCallback((status: IssueStatus) => {
    setFields(prev => ({ ...prev, status }));
  }, []);

  const handlePriorityChange = useCallback((priority: Priority) => {
    setFields(prev => ({ ...prev, priority }));
  }, []);

  const handleAssigneeChange = useCallback((assignee: string | null) => {
    setFields(prev => ({ ...prev, assignee }));
  }, []);

  const handleSprintChange = useCallback((sprint: string | null) => {
    setFields(prev => ({ ...prev, sprint }));
  }, []);

  const handleStoryPointsChange = useCallback((points: string) => {
    const num = parseInt(points, 10);
    setFields(prev => ({ ...prev, storyPoints: isNaN(num) ? null : num }));
  }, []);

  const handleLabelsInputChange = useCallback((value: string) => {
    setLabelsInput(value);
    const labels = value.split(',').map(l => l.trim()).filter(l => l.length > 0);
    setFields(prev => ({ ...prev, labels: labels.length > 0 ? labels : null }));
  }, []);

  // Apply changes
  const handleApply = useCallback(async () => {
    setIsProcessing(true);

    // Build updates object from enabled fields only
    const updates: Partial<Issue> = {};

    if (enabledFields.status && fields.status) {
      updates.status = fields.status;
    }
    if (enabledFields.priority && fields.priority) {
      updates.priority = fields.priority;
    }
    if (enabledFields.assignee && fields.assignee !== undefined) {
      updates.assignee = fields.assignee;
    }
    if (enabledFields.sprint && fields.sprint !== undefined) {
      updates.sprint = fields.sprint;
    }
    if (enabledFields.labels && fields.labels !== null) {
      updates.labels = fields.labels;
    }
    if (enabledFields.storyPoints && fields.storyPoints !== undefined) {
      updates.storyPoints = fields.storyPoints;
    }

    // Only proceed if there are updates to make
    if (Object.keys(updates).length > 0) {
      await bulkUpdateIssues(selectedIssueIds, updates);
    }

    setIsProcessing(false);
    onClose();
  }, [enabledFields, fields, selectedIssueIds, bulkUpdateIssues, onClose]);

  // Count enabled fields
  const enabledCount = Object.values(enabledFields).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit {selectedIssueIds.length} issue{selectedIssueIds.length !== 1 ? 's' : ''}
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
          {/* Instructions */}
          <p className="text-sm text-gray-600 mb-4">
            Select the fields you want to update. Only checked fields will be changed.
          </p>

          {/* Field editors */}
          <div className="space-y-4">
            {/* Status */}
            <FieldRow
              label="Status"
              enabled={enabledFields.status}
              onToggle={() => toggleField('status')}
            >
              <select
                value={fields.status || ''}
                onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                disabled={!enabledFields.status}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select status...</option>
                {Object.values(IssueStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </FieldRow>

            {/* Priority */}
            <FieldRow
              label="Priority"
              enabled={enabledFields.priority}
              onToggle={() => toggleField('priority')}
            >
              <select
                value={fields.priority || ''}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                disabled={!enabledFields.priority}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select priority...</option>
                {Object.values(Priority).map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </FieldRow>

            {/* Assignee */}
            <FieldRow
              label="Assignee"
              enabled={enabledFields.assignee}
              onToggle={() => toggleField('assignee')}
            >
              <select
                value={fields.assignee === null ? '__unassigned__' : (fields.assignee || '')}
                onChange={(e) => handleAssigneeChange(e.target.value === '__unassigned__' ? null : e.target.value)}
                disabled={!enabledFields.assignee}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select assignee...</option>
                <option value="__unassigned__">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </select>
            </FieldRow>

            {/* Sprint */}
            <FieldRow
              label="Sprint"
              enabled={enabledFields.sprint}
              onToggle={() => toggleField('sprint')}
            >
              <select
                value={fields.sprint === null ? '__none__' : (fields.sprint || '')}
                onChange={(e) => handleSprintChange(e.target.value === '__none__' ? null : e.target.value)}
                disabled={!enabledFields.sprint}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select sprint...</option>
                <option value="__none__">No Sprint</option>
                {sprints.map(sprint => (
                  <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                ))}
              </select>
            </FieldRow>

            {/* Story Points */}
            <FieldRow
              label="Story Points"
              enabled={enabledFields.storyPoints}
              onToggle={() => toggleField('storyPoints')}
            >
              <input
                type="number"
                min="0"
                max="100"
                value={fields.storyPoints ?? ''}
                onChange={(e) => handleStoryPointsChange(e.target.value)}
                disabled={!enabledFields.storyPoints}
                placeholder="Enter story points..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
            </FieldRow>

            {/* Labels */}
            <FieldRow
              label="Labels"
              enabled={enabledFields.labels}
              onToggle={() => toggleField('labels')}
            >
              <input
                type="text"
                value={labelsInput}
                onChange={(e) => handleLabelsInputChange(e.target.value)}
                disabled={!enabledFields.labels}
                placeholder="Enter labels (comma-separated)..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                This will replace existing labels on all selected issues
              </p>
            </FieldRow>
          </div>

          {/* Preview of affected issues */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Affected Issues</h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="space-y-1">
                {selectedIssues.slice(0, 10).map(issue => (
                  <div key={issue.id} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-gray-500">{issue.key}</span>
                    <span className="text-gray-700 truncate">{issue.title}</span>
                  </div>
                ))}
                {selectedIssues.length > 10 && (
                  <div className="text-sm text-gray-400">
                    +{selectedIssues.length - 10} more issues
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {enabledCount} field{enabledCount !== 1 ? 's' : ''} will be updated
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isProcessing || enabledCount === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Applying...' : `Apply to ${selectedIssueIds.length} issues`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// FIELD ROW COMPONENT
// ============================================================================

interface FieldRowProps {
  label: string;
  enabled: boolean | undefined;
  onToggle: () => void;
  children: React.ReactNode;
}

const FieldRow = memo(function FieldRow({ label, enabled, onToggle, children }: FieldRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex items-center pt-2">
        <input
          type="checkbox"
          checked={enabled ?? false}
          onChange={onToggle}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export default BulkEditModal;
