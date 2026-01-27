/**
 * IssueDetailsTab - Details tab content for the issue detail panel
 * 
 * Features:
 * - Inline editing for title
 * - Markdown/plain text editor for description
 * - Field grid with all standard fields
 * - Auto-save on blur/change
 * - Loading indicator during save
 */

import { useState, useCallback, useEffect, memo, useRef } from 'react';
import type { Issue, UpdateIssueInput } from '../../types';
import { IssueType, IssueStatus, Priority } from '../../types';
import { useIssueStore, useUserStore, useSprintStore } from '../../store';
import { getAllIssueTypes } from './IssueTypeIcon';
import { getAllStatuses } from './StatusBadge';
import { getAllPriorities } from './PriorityIndicator';

// ============================================================================
// UTILITY HOOK - DEBOUNCED AUTO-SAVE
// ============================================================================

function useAutoSave(
  issueId: string,
  onSave: (update: UpdateIssueInput) => Promise<boolean>
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const pendingUpdate = useRef<Partial<Issue>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (updates: Partial<Issue>) => {
    // Merge with pending updates
    pendingUpdate.current = { ...pendingUpdate.current, ...updates };
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(async () => {
      const updateToSend = { ...pendingUpdate.current, id: issueId };
      pendingUpdate.current = {};
      
      setIsSaving(true);
      const success = await onSave(updateToSend);
      setIsSaving(false);
      
      if (success) {
        setLastSaved(new Date());
      }
    }, 500);
  }, [issueId, onSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { save, isSaving, lastSaved };
}

// ============================================================================
// EDITABLE TITLE
// ============================================================================

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
}

const EditableTitle = memo(function EditableTitle({ value, onChange }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== value) {
      onChange(editValue.trim());
    } else {
      setEditValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-xl font-semibold text-gray-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <h2
      onClick={() => setIsEditing(true)}
      className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
      title="Click to edit"
    >
      {value}
    </h2>
  );
});

// ============================================================================
// DESCRIPTION EDITOR
// ============================================================================

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const DescriptionEditor = memo(function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-full min-h-[120px] text-sm text-gray-700 border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="Add a description..."
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="min-h-[60px] text-sm text-gray-700 whitespace-pre-wrap cursor-pointer hover:bg-gray-100 rounded-md px-3 py-2 -mx-3 -my-2 transition-colors"
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">Add a description...</span>}
    </div>
  );
});

// ============================================================================
// FIELD COMPONENTS
// ============================================================================

interface SelectFieldProps<T extends string> {
  label: string;
  value: T | null;
  options: { value: T; label: string; color?: string }[];
  onChange: (value: T | null) => void;
  allowClear?: boolean;
  placeholder?: string;
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  allowClear = false,
  placeholder = 'Select...',
}: SelectFieldProps<T>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <select
        value={value ?? ''}
        onChange={e => {
          const newValue = e.target.value as T;
          onChange(newValue || null);
        }}
        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {allowClear && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

const NumberField = memo(function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder = '—',
}: NumberFieldProps) {
  const [editValue, setEditValue] = useState(value?.toString() ?? '');

  useEffect(() => {
    setEditValue(value?.toString() ?? '');
  }, [value]);

  const handleBlur = () => {
    const num = editValue ? parseFloat(editValue) : null;
    if (num !== value) {
      onChange(num);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        type="number"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
});

interface DateFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

const DateField = memo(function DateField({ label, value, onChange }: DateFieldProps) {
  // Convert ISO string to date input format (YYYY-MM-DD)
  const inputValue = value ? value.split('T')[0] : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value || null;
    onChange(newValue);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        type="date"
        value={inputValue}
        onChange={handleChange}
        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
});

interface LabelsFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const LabelsField = memo(function LabelsField({ value, onChange }: LabelsFieldProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newLabel = inputValue.trim();
      if (!value.includes(newLabel)) {
        onChange([...value, newLabel]);
      }
      setInputValue('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    onChange(value.filter(l => l !== labelToRemove));
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        Labels
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(label => (
          <span
            key={label}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
          >
            {label}
            <button
              onClick={() => removeLabel(label)}
              className="hover:text-blue-900"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter to add..."
        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
});

interface ComponentsFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const ComponentsField = memo(function ComponentsField({ value, onChange }: ComponentsFieldProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newComponent = inputValue.trim();
      if (!value.includes(newComponent)) {
        onChange([...value, newComponent]);
      }
      setInputValue('');
    }
  };

  const removeComponent = (componentToRemove: string) => {
    onChange(value.filter(c => c !== componentToRemove));
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        Components
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(component => (
          <span
            key={component}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
          >
            {component}
            <button
              onClick={() => removeComponent(component)}
              className="hover:text-gray-900"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter to add..."
        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
});

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

const ReadOnlyField = memo(function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <div className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-md">
        {value || <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface IssueDetailsTabProps {
  issue: Issue;
}

export const IssueDetailsTab = memo(function IssueDetailsTab({ issue }: IssueDetailsTabProps) {
  const updateIssue = useIssueStore(state => state.updateIssue);
  const users = useUserStore(state => state.users);
  const sprints = useSprintStore(state => state.sprints);

  const { save, isSaving, lastSaved } = useAutoSave(issue.id, updateIssue);

  // Get reporter name - find from users array directly
  const reporter = users.find(u => u.id === issue.reporter);
  const reporterName = reporter?.displayName ?? 'Unknown';

  // Build options
  const typeOptions = getAllIssueTypes().map(item => ({
    value: item.type,
    label: item.label,
  }));

  const statusOptions = getAllStatuses().map(item => ({
    value: item.status,
    label: item.label,
  }));

  const priorityOptions = getAllPriorities().map(item => ({
    value: item.priority,
    label: item.label,
  }));

  const userOptions = [
    { value: '', label: 'Unassigned' },
    ...users.map(user => ({
      value: user.id,
      label: user.displayName,
    })),
  ];

  const sprintOptions = [
    { value: '', label: 'None' },
    ...sprints.map(sprint => ({
      value: sprint.id,
      label: sprint.name,
    })),
  ];

  // Field change handlers
  const handleTitleChange = useCallback((title: string) => {
    save({ title });
  }, [save]);

  const handleDescriptionChange = useCallback((description: string) => {
    save({ description });
  }, [save]);

  const handleTypeChange = useCallback((type: IssueType | null) => {
    if (type) save({ type });
  }, [save]);

  const handleStatusChange = useCallback((status: IssueStatus | null) => {
    if (status) save({ status });
  }, [save]);

  const handlePriorityChange = useCallback((priority: Priority | null) => {
    if (priority) save({ priority });
  }, [save]);

  const handleAssigneeChange = useCallback((assignee: string | null) => {
    save({ assignee: assignee || null });
  }, [save]);

  const handleSprintChange = useCallback((sprint: string | null) => {
    save({ sprint: sprint || null });
  }, [save]);

  const handleStoryPointsChange = useCallback((storyPoints: number | null) => {
    save({ storyPoints });
  }, [save]);

  const handleLabelsChange = useCallback((labels: string[]) => {
    save({ labels });
  }, [save]);

  const handleVersionChange = useCallback((version: string | null) => {
    save({ version: version || null });
  }, [save]);

  const handleComponentsChange = useCallback((components: string[]) => {
    save({ components });
  }, [save]);

  const handleStartDateChange = useCallback((startDate: string | null) => {
    save({ startDate });
  }, [save]);

  const handleDueDateChange = useCallback((dueDate: string | null) => {
    save({ dueDate });
  }, [save]);

  const handleOriginalEstimateChange = useCallback((originalEstimate: number | null) => {
    save({ originalEstimate });
  }, [save]);

  const handleTimeSpentChange = useCallback((timeSpent: number | null) => {
    save({ timeSpent });
  }, [save]);

  const handleRemainingEstimateChange = useCallback((remainingEstimate: number | null) => {
    save({ remainingEstimate });
  }, [save]);

  return (
    <div className="p-6">
      {/* Save Status */}
      <div className="flex items-center justify-end gap-2 mb-4 h-5">
        {isSaving && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </span>
        )}
        {!isSaving && lastSaved && (
          <span className="text-xs text-green-600">
            ✓ Saved
          </span>
        )}
      </div>

      {/* Title */}
      <div className="mb-6">
        <EditableTitle value={issue.title} onChange={handleTitleChange} />
      </div>

      {/* Description */}
      <div className="mb-8">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Description
        </label>
        <DescriptionEditor value={issue.description} onChange={handleDescriptionChange} />
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <SelectField
          label="Type"
          value={issue.type}
          options={typeOptions}
          onChange={handleTypeChange}
        />

        {/* Status */}
        <SelectField
          label="Status"
          value={issue.status}
          options={statusOptions}
          onChange={handleStatusChange}
        />

        {/* Priority */}
        <SelectField
          label="Priority"
          value={issue.priority}
          options={priorityOptions}
          onChange={handlePriorityChange}
        />

        {/* Assignee */}
        <SelectField
          label="Assignee"
          value={issue.assignee}
          options={userOptions}
          onChange={handleAssigneeChange}
          allowClear
          placeholder="Unassigned"
        />

        {/* Reporter (read-only) */}
        <ReadOnlyField label="Reporter" value={reporterName} />

        {/* Sprint */}
        <SelectField
          label="Sprint"
          value={issue.sprint}
          options={sprintOptions}
          onChange={handleSprintChange}
          allowClear
          placeholder="None"
        />

        {/* Story Points */}
        <NumberField
          label="Story Points"
          value={issue.storyPoints}
          onChange={handleStoryPointsChange}
          min={0}
          max={100}
          step={1}
        />

        {/* Version */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Version
          </label>
          <input
            type="text"
            value={issue.version ?? ''}
            onChange={e => handleVersionChange(e.target.value || null)}
            placeholder="—"
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Labels */}
      <div className="mt-4">
        <LabelsField value={issue.labels} onChange={handleLabelsChange} />
      </div>

      {/* Components */}
      <div className="mt-4">
        <ComponentsField value={issue.components} onChange={handleComponentsChange} />
      </div>

      {/* Dates Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Dates</h3>
        <div className="grid grid-cols-2 gap-4">
          <DateField
            label="Start Date"
            value={issue.startDate}
            onChange={handleStartDateChange}
          />
          <DateField
            label="Due Date"
            value={issue.dueDate}
            onChange={handleDueDateChange}
          />
        </div>
      </div>

      {/* Time Tracking Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Time Tracking (hours)</h3>
        <div className="grid grid-cols-3 gap-4">
          <NumberField
            label="Original Estimate"
            value={issue.originalEstimate}
            onChange={handleOriginalEstimateChange}
            min={0}
            step={0.5}
          />
          <NumberField
            label="Time Spent"
            value={issue.timeSpent}
            onChange={handleTimeSpentChange}
            min={0}
            step={0.5}
          />
          <NumberField
            label="Remaining"
            value={issue.remainingEstimate}
            onChange={handleRemainingEstimateChange}
            min={0}
            step={0.5}
          />
        </div>
      </div>

      {/* Timestamps */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(issue.createdAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Updated:</span>{' '}
            {new Date(issue.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
});
