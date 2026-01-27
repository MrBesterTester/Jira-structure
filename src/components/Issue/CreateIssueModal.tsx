/**
 * CreateIssueModal - Modal dialog for creating new issues
 * 
 * Features:
 * - Required fields: type, title
 * - Optional fields: description, parent, sprint, assignee, priority, story points
 * - Pre-filled parent when creating child issues
 * - Pre-filled status when creating from Kanban column
 * - Validation and error states
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  useUIStore, 
  useIssueStore, 
  useProjectStore, 
  useSprintStore, 
  useUserStore 
} from '../../store';
import { 
  IssueType, 
  IssueStatus, 
  Priority, 
  Issue 
} from '../../types';
import { IssueTypeIcon, getAllIssueTypes } from './IssueTypeIcon';
import { StatusBadge, getAllStatuses } from './StatusBadge';
import { PriorityIndicator, getAllPriorities } from './PriorityIndicator';

// ============================================================================
// TYPES
// ============================================================================

interface CreateIssueFormData {
  type: IssueType;
  title: string;
  description: string;
  status: IssueStatus;
  priority: Priority;
  parentId: string | null;
  sprint: string | null;
  assignee: string | null;
  storyPoints: number | null;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const getInitialFormData = (
  parentId: string | null = null,
  status: IssueStatus = IssueStatus.Todo
): CreateIssueFormData => ({
  type: IssueType.Task,
  title: '',
  description: '',
  status,
  priority: Priority.Medium,
  parentId,
  sprint: null,
  assignee: null,
  storyPoints: null,
});

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateIssueModal() {
  // UI State
  const isOpen = useUIStore(state => state.createIssueModalOpen);
  const initialParentId = useUIStore(state => state.createIssueParentId);
  const initialStatus = useUIStore(state => state.createIssueDefaultStatus);
  const closeModal = useUIStore(state => state.closeCreateIssueModal);
  const openDetailPanel = useUIStore(state => state.openDetailPanel);
  const expandIssue = useUIStore(state => state.expandIssue);
  const setFocusedIssue = useUIStore(state => state.setFocusedIssue);
  
  // Data Stores
  const createIssue = useIssueStore(state => state.createIssue);
  const issues = useIssueStore(state => state.issues);
  const getIssueById = useIssueStore(state => state.getIssueById);
  
  const getCurrentProject = useProjectStore(state => state.getCurrentProject);
  const currentProject = getCurrentProject();
  
  const sprints = useSprintStore(state => state.sprints);
  const getActiveSprint = useSprintStore(state => state.getActiveSprint);
  
  const users = useUserStore(state => state.users);

  // Form State
  const [formData, setFormData] = useState<CreateIssueFormData>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with new parent/status
  useEffect(() => {
    if (isOpen) {
      const status = initialStatus as IssueStatus | null;
      setFormData(getInitialFormData(initialParentId, status || IssueStatus.Todo));
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialParentId, initialStatus]);

  // Get parent issue info
  const parentIssue = useMemo(() => {
    return initialParentId ? getIssueById(initialParentId) : null;
  }, [initialParentId, getIssueById]);

  // Available parent issues (exclude current issue's descendants in a real scenario)
  const availableParents = useMemo(() => {
    return issues.filter(i => 
      // Typically, parent should be higher level types
      [IssueType.Initiative, IssueType.Epic, IssueType.Feature, IssueType.Story].includes(i.type)
    );
  }, [issues]);

  // Get available sprints for current project
  const availableSprints = useMemo(() => {
    if (!currentProject) return [];
    return sprints.filter(s => s.projectId === currentProject.id);
  }, [sprints, currentProject]);

  // Handlers
  const handleFieldChange = useCallback(<K extends keyof CreateIssueFormData>(
    field: K, 
    value: CreateIssueFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }
    
    if (!currentProject) {
      newErrors.project = 'Please select a project first';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, currentProject]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentProject) return;
    
    setIsSubmitting(true);
    
    try {
      // Get the first user as reporter (in a real app, this would be the logged-in user)
      const reporterId = users.length > 0 ? users[0].id : 'unknown';
      
      const issueData: Omit<Issue, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'childIds'> = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        parentId: formData.parentId,
        sprint: formData.sprint,
        assignee: formData.assignee,
        reporter: reporterId,
        storyPoints: formData.storyPoints,
        labels: [],
        version: null,
        components: [],
        dueDate: null,
        startDate: null,
        originalEstimate: null,
        timeSpent: null,
        remainingEstimate: null,
        blockedBy: [],
        blocks: [],
        relatedTo: [],
      };
      
      const newIssue = await createIssue(issueData, currentProject.key);
      
      if (newIssue) {
        closeModal();
        
        // Auto-select and highlight the new issue
        setFocusedIssue(newIssue.id);
        
        // If issue has a parent, expand the parent to show the new child
        if (newIssue.parentId) {
          expandIssue(newIssue.parentId);
        }
        
        // Open the detail panel for the new issue
        openDetailPanel(newIssue.id);
      }
    } catch (error) {
      console.error('Failed to create issue:', error);
      setErrors({ submit: 'Failed to create issue. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateForm, 
    currentProject, 
    formData, 
    users, 
    createIssue, 
    closeModal, 
    setFocusedIssue, 
    expandIssue, 
    openDetailPanel
  ]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      closeModal();
    }
  }, [isSubmitting, closeModal]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, closeModal]);

  if (!isOpen) return null;

  const allTypes = getAllIssueTypes();
  const allStatuses = getAllStatuses();
  const allPriorities = getAllPriorities();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Issue</h2>
            {parentIssue && (
              <p className="text-sm text-gray-500 mt-0.5">
                Child of <span className="font-medium">{parentIssue.key}</span>: {parentIssue.title}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-5">
            {/* Project warning */}
            {!currentProject && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                <strong>Note:</strong> Please select a project from the sidebar before creating an issue.
              </div>
            )}

            {/* Submit error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errors.submit}
              </div>
            )}

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Issue Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {allTypes.map(({ type, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFieldChange('type', type)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors
                      ${formData.type === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }
                    `}
                  >
                    <IssueTypeIcon type={type} size="sm" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                className={`
                  w-full px-3 py-2 border rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Add a description..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Two-column layout for optional fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value as IssueStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {allStatuses.map(({ status, label }) => (
                    <option key={status} value={status}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value as Priority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {allPriorities.map(({ priority, label }) => (
                    <option key={priority} value={priority}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Assignee
                </label>
                <select
                  id="assignee"
                  value={formData.assignee || ''}
                  onChange={(e) => handleFieldChange('assignee', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.displayName}</option>
                  ))}
                </select>
              </div>

              {/* Sprint */}
              <div>
                <label htmlFor="sprint" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sprint
                </label>
                <select
                  id="sprint"
                  value={formData.sprint || ''}
                  onChange={(e) => handleFieldChange('sprint', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Backlog</option>
                  {availableSprints.map(sprint => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name} {sprint.status === 'active' ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parent Issue */}
              <div>
                <label htmlFor="parent" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Parent Issue
                </label>
                <select
                  id="parent"
                  value={formData.parentId || ''}
                  onChange={(e) => handleFieldChange('parentId', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Parent (Root Level)</option>
                  {availableParents.map(issue => (
                    <option key={issue.id} value={issue.id}>
                      {issue.key}: {issue.title.substring(0, 40)}{issue.title.length > 40 ? '...' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Story Points */}
              <div>
                <label htmlFor="storyPoints" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Story Points
                </label>
                <select
                  id="storyPoints"
                  value={formData.storyPoints ?? ''}
                  onChange={(e) => handleFieldChange('storyPoints', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Not Estimated</option>
                  {[1, 2, 3, 5, 8, 13, 21].map(points => (
                    <option key={points} value={points}>{points}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentProject}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Issue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
