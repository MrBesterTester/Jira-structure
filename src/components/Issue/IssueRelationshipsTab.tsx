/**
 * IssueRelationshipsTab - Full relationship management for issues
 * 
 * Features:
 * - Parent section with change/remove
 * - Children section with add/remove
 * - Blocks/Blocked By sections with add/remove
 * - Related To section with add/remove
 * - Issue picker modal for selecting issues
 */

import { useState, useCallback, memo } from 'react';
import type { Issue } from '../../types';
import { useIssueStore, useUIStore } from '../../store';
import { IssueTypeIcon } from './IssueTypeIcon';
import { StatusBadge } from './StatusBadge';
import { IssuePicker } from './IssuePicker';

// ============================================================================
// TYPES
// ============================================================================

type PickerMode = 
  | 'parent' 
  | 'child' 
  | 'blocker' 
  | 'blocking' 
  | 'related' 
  | null;

interface IssueRelationshipsTabProps {
  issue: Issue;
}

// ============================================================================
// ISSUE LINK COMPONENT
// ============================================================================

interface IssueLinkProps {
  issue: Issue;
  onRemove?: () => void;
  onClick?: () => void;
  removeLabel?: string;
}

const IssueLink = memo(function IssueLink({ 
  issue, 
  onRemove, 
  onClick,
  removeLabel = 'Remove',
}: IssueLinkProps) {
  const openDetailPanel = useUIStore(state => state.openDetailPanel);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      openDetailPanel(issue.id);
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-md group">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 flex-1 min-w-0 text-left hover:underline"
      >
        <IssueTypeIcon type={issue.type} size="sm" />
        <span className="font-mono text-xs text-gray-500">{issue.key}</span>
        <span className="text-sm text-gray-700 truncate">{issue.title}</span>
      </button>
      <StatusBadge status={issue.status} size="sm" />
      {onRemove && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
          title={removeLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

// ============================================================================
// SECTION COMPONENT
// ============================================================================

interface RelationshipSectionProps {
  title: string;
  count?: number;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}

const RelationshipSection = memo(function RelationshipSection({
  title,
  count,
  children,
  onAdd,
  addLabel = 'Add',
  emptyMessage = 'None',
  isEmpty = false,
}: RelationshipSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          {title}
          {count !== undefined && (
            <span className="ml-1.5 text-gray-400">({count})</span>
          )}
        </h4>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {addLabel}
          </button>
        )}
      </div>
      {isEmpty ? (
        <p className="text-sm text-gray-400 italic py-2">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IssueRelationshipsTab = memo(function IssueRelationshipsTab({ 
  issue 
}: IssueRelationshipsTabProps) {
  const issues = useIssueStore(state => state.issues);
  const moveIssue = useIssueStore(state => state.moveIssue);
  const addBlocker = useIssueStore(state => state.addBlocker);
  const removeBlocker = useIssueStore(state => state.removeBlocker);
  const addRelated = useIssueStore(state => state.addRelated);
  const removeRelated = useIssueStore(state => state.removeRelated);
  const addChild = useIssueStore(state => state.addChild);
  const removeChild = useIssueStore(state => state.removeChild);

  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to get issue by ID
  const getIssueById = useCallback((id: string) => {
    return issues.find(i => i.id === id);
  }, [issues]);

  // Get related issues
  const parentIssue = issue.parentId ? getIssueById(issue.parentId) : null;
  const childIssues = issue.childIds
    .map(id => getIssueById(id))
    .filter((i): i is Issue => i !== undefined);
  const blockedByIssues = issue.blockedBy
    .map(id => getIssueById(id))
    .filter((i): i is Issue => i !== undefined);
  const blocksIssues = issue.blocks
    .map(id => getIssueById(id))
    .filter((i): i is Issue => i !== undefined);
  const relatedIssues = issue.relatedTo
    .map(id => getIssueById(id))
    .filter((i): i is Issue => i !== undefined);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Change parent
  const handleChangeParent = useCallback(async (newParentId: string) => {
    setIsLoading(true);
    await moveIssue(issue.id, newParentId);
    setIsLoading(false);
  }, [issue.id, moveIssue]);

  // Remove parent (move to root)
  const handleRemoveParent = useCallback(async () => {
    setIsLoading(true);
    await moveIssue(issue.id, null);
    setIsLoading(false);
  }, [issue.id, moveIssue]);

  // Add child
  const handleAddChild = useCallback(async (childId: string) => {
    setIsLoading(true);
    await addChild(issue.id, childId);
    setIsLoading(false);
  }, [issue.id, addChild]);

  // Remove child
  const handleRemoveChild = useCallback(async (childId: string) => {
    setIsLoading(true);
    await removeChild(issue.id, childId);
    setIsLoading(false);
  }, [issue.id, removeChild]);

  // Add blocker (this issue is blocked by...)
  const handleAddBlocker = useCallback(async (blockerId: string) => {
    setIsLoading(true);
    await addBlocker(issue.id, blockerId);
    setIsLoading(false);
  }, [issue.id, addBlocker]);

  // Remove blocker
  const handleRemoveBlocker = useCallback(async (blockerId: string) => {
    setIsLoading(true);
    await removeBlocker(issue.id, blockerId);
    setIsLoading(false);
  }, [issue.id, removeBlocker]);

  // Add blocking (this issue blocks...)
  const handleAddBlocking = useCallback(async (blockedId: string) => {
    setIsLoading(true);
    await addBlocker(blockedId, issue.id);
    setIsLoading(false);
  }, [issue.id, addBlocker]);

  // Remove blocking
  const handleRemoveBlocking = useCallback(async (blockedId: string) => {
    setIsLoading(true);
    await removeBlocker(blockedId, issue.id);
    setIsLoading(false);
  }, [issue.id, removeBlocker]);

  // Add related
  const handleAddRelated = useCallback(async (relatedId: string) => {
    setIsLoading(true);
    await addRelated(issue.id, relatedId);
    setIsLoading(false);
  }, [issue.id, addRelated]);

  // Remove related
  const handleRemoveRelated = useCallback(async (relatedId: string) => {
    setIsLoading(true);
    await removeRelated(issue.id, relatedId);
    setIsLoading(false);
  }, [issue.id, removeRelated]);

  // Picker handlers
  const handlePickerSelect = useCallback((selectedId: string) => {
    switch (pickerMode) {
      case 'parent':
        handleChangeParent(selectedId);
        break;
      case 'child':
        handleAddChild(selectedId);
        break;
      case 'blocker':
        handleAddBlocker(selectedId);
        break;
      case 'blocking':
        handleAddBlocking(selectedId);
        break;
      case 'related':
        handleAddRelated(selectedId);
        break;
    }
    setPickerMode(null);
  }, [pickerMode, handleChangeParent, handleAddChild, handleAddBlocker, handleAddBlocking, handleAddRelated]);

  // Get exclusion list and filter for picker
  const getPickerConfig = useCallback(() => {
    const baseExclude = [issue.id];
    
    switch (pickerMode) {
      case 'parent': {
        // Exclude current issue, its descendants (to prevent circular refs)
        const getDescendants = (id: string): string[] => {
          const iss = getIssueById(id);
          if (!iss) return [];
          return [id, ...iss.childIds.flatMap(getDescendants)];
        };
        return {
          excludeIds: getDescendants(issue.id),
          title: 'Select Parent Issue',
        };
      }
      
      case 'child': {
        // Exclude current issue, its ancestors (to prevent circular refs), and current children
        const getAncestors = (id: string | null): string[] => {
          if (!id) return [];
          const iss = getIssueById(id);
          if (!iss) return [id];
          return [id, ...getAncestors(iss.parentId)];
        };
        return {
          excludeIds: [...baseExclude, ...getAncestors(issue.parentId), ...issue.childIds],
          title: 'Select Child Issue',
        };
      }
      
      case 'blocker':
        return {
          excludeIds: [...baseExclude, ...issue.blockedBy],
          title: 'Select Blocking Issue',
        };
      
      case 'blocking':
        return {
          excludeIds: [...baseExclude, ...issue.blocks],
          title: 'Select Issue to Block',
        };
      
      case 'related':
        return {
          excludeIds: [...baseExclude, ...issue.relatedTo],
          title: 'Select Related Issue',
        };
      
      default:
        return { excludeIds: baseExclude, title: 'Select Issue' };
    }
  }, [pickerMode, issue, getIssueById]);

  const pickerConfig = getPickerConfig();

  return (
    <div className="p-4 space-y-6">
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50">
          <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Parent Section */}
      <RelationshipSection
        title="Parent"
        onAdd={() => setPickerMode('parent')}
        addLabel={parentIssue ? 'Change' : 'Set Parent'}
        isEmpty={!parentIssue}
        emptyMessage="No parent — this is a root-level issue"
      >
        {parentIssue && (
          <IssueLink
            issue={parentIssue}
            onRemove={handleRemoveParent}
            removeLabel="Move to root"
          />
        )}
      </RelationshipSection>

      {/* Children Section */}
      <RelationshipSection
        title="Children"
        count={childIssues.length}
        onAdd={() => setPickerMode('child')}
        addLabel="Add Child"
        isEmpty={childIssues.length === 0}
        emptyMessage="No child issues"
      >
        {childIssues.map(child => (
          <IssueLink
            key={child.id}
            issue={child}
            onRemove={() => handleRemoveChild(child.id)}
            removeLabel="Remove from children"
          />
        ))}
      </RelationshipSection>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Blocked By Section */}
      <RelationshipSection
        title="Blocked By"
        count={blockedByIssues.length}
        onAdd={() => setPickerMode('blocker')}
        addLabel="Add Blocker"
        isEmpty={blockedByIssues.length === 0}
        emptyMessage="Not blocked by any issues"
      >
        {blockedByIssues.map(blocker => (
          <IssueLink
            key={blocker.id}
            issue={blocker}
            onRemove={() => handleRemoveBlocker(blocker.id)}
            removeLabel="Remove blocker"
          />
        ))}
      </RelationshipSection>

      {/* Blocks Section */}
      <RelationshipSection
        title="Blocks"
        count={blocksIssues.length}
        onAdd={() => setPickerMode('blocking')}
        addLabel="Add Blocked"
        isEmpty={blocksIssues.length === 0}
        emptyMessage="Not blocking any issues"
      >
        {blocksIssues.map(blocked => (
          <IssueLink
            key={blocked.id}
            issue={blocked}
            onRemove={() => handleRemoveBlocking(blocked.id)}
            removeLabel="Remove from blocks"
          />
        ))}
      </RelationshipSection>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Related To Section */}
      <RelationshipSection
        title="Related To"
        count={relatedIssues.length}
        onAdd={() => setPickerMode('related')}
        addLabel="Link Issue"
        isEmpty={relatedIssues.length === 0}
        emptyMessage="No related issues"
      >
        {relatedIssues.map(related => (
          <IssueLink
            key={related.id}
            issue={related}
            onRemove={() => handleRemoveRelated(related.id)}
            removeLabel="Remove link"
          />
        ))}
      </RelationshipSection>

      {/* Issue Picker Modal */}
      <IssuePicker
        isOpen={pickerMode !== null}
        onClose={() => setPickerMode(null)}
        onSelect={handlePickerSelect}
        excludeIds={pickerConfig.excludeIds}
        title={pickerConfig.title}
      />
    </div>
  );
});
