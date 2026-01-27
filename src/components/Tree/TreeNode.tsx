/**
 * TreeNode - Recursive tree node component with drag-and-drop
 * 
 * Displays a single issue in the tree with:
 * - Indentation based on depth
 * - Expand/collapse chevron (if has children)
 * - IssueCard in compact mode
 * - Drag handle for reordering
 * - Drop zones for hierarchy changes
 * - Recursive rendering of children when expanded
 */

import { memo, useCallback, useMemo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Issue } from '../../types';
import { IssueCard } from '../Issue';

// ============================================================================
// TYPES
// ============================================================================

interface TreeNodeProps {
  /** The issue to display */
  issue: Issue;
  /** Depth level in the tree (0 = root) */
  depth: number;
  /** Whether this node is expanded */
  isExpanded: boolean;
  /** Child issues (already resolved from issue.childIds) */
  children: Issue[];
  /** Set of all expanded issue IDs (for recursive rendering) */
  expandedIds: Set<string>;
  /** Function to get children for an issue ID */
  getChildrenForIssue: (issueId: string) => Issue[];
  /** Whether this node is currently focused for keyboard navigation */
  isFocused: boolean;
  /** ID of the issue being dragged (for styling) */
  draggingId: string | null;
  /** ID of current drop target */
  dropTargetId: string | null;
  /** Handler for expand/collapse toggle */
  onToggleExpand: (issueId: string) => void;
  /** Handler for issue click (selection) */
  onIssueClick: (issue: Issue, event: React.MouseEvent) => void;
  /** Handler for issue double-click (open detail) */
  onIssueDoubleClick: (issue: Issue) => void;
  /** Reference callback for keyboard navigation */
  nodeRef?: (issueId: string, element: HTMLDivElement | null) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Pixels of indentation per depth level */
const INDENT_PER_LEVEL = 24;

/** Base left padding */
const BASE_PADDING = 8;

// ============================================================================
// EXPAND CHEVRON
// ============================================================================

interface ChevronProps {
  isExpanded: boolean;
  hasChildren: boolean;
  onClick: () => void;
}

const Chevron = memo(function Chevron({ isExpanded, hasChildren, onClick }: ChevronProps) {
  if (!hasChildren) {
    // Empty space placeholder to maintain alignment
    return <div className="w-5 h-5 shrink-0" />;
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-5 h-5 flex items-center justify-center shrink-0 rounded hover:bg-gray-200 transition-colors"
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
    >
      <svg 
        className={`w-4 h-4 text-gray-500 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
});

// ============================================================================
// DRAG HANDLE
// ============================================================================

interface DragHandleProps {
  listeners: ReturnType<typeof useDraggable>['listeners'];
  attributes: ReturnType<typeof useDraggable>['attributes'];
  isDragging: boolean;
}

const DragHandle = memo(function DragHandle({ listeners, attributes, isDragging }: DragHandleProps) {
  return (
    <div 
      className={`
        w-4 h-5 flex items-center justify-center shrink-0 
        cursor-grab active:cursor-grabbing
        opacity-0 group-hover:opacity-100 transition-opacity
        ${isDragging ? 'opacity-100' : ''}
      `}
      title="Drag to move"
      {...listeners}
      {...attributes}
    >
      <svg className="w-3 h-4 text-gray-400" viewBox="0 0 6 10" fill="currentColor">
        <circle cx="1" cy="1" r="1" />
        <circle cx="5" cy="1" r="1" />
        <circle cx="1" cy="5" r="1" />
        <circle cx="5" cy="5" r="1" />
        <circle cx="1" cy="9" r="1" />
        <circle cx="5" cy="9" r="1" />
      </svg>
    </div>
  );
});

// ============================================================================
// DROP INDICATOR
// ============================================================================

interface DropIndicatorProps {
  position: 'before' | 'inside' | 'after';
  indentPx: number;
}

const DropIndicator = memo(function DropIndicator({ position, indentPx }: DropIndicatorProps) {
  if (position === 'inside') {
    return null; // Shown via border styling on the node itself
  }

  return (
    <div
      className={`
        absolute left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none
        ${position === 'before' ? 'top-0' : 'bottom-0'}
      `}
      style={{ marginLeft: `${indentPx}px` }}
    >
      <div 
        className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-blue-500"
      />
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TreeNode = memo(function TreeNode({
  issue,
  depth,
  isExpanded,
  children,
  expandedIds,
  getChildrenForIssue,
  isFocused,
  draggingId,
  dropTargetId,
  onToggleExpand,
  onIssueClick,
  onIssueDoubleClick,
  nodeRef,
}: TreeNodeProps) {
  const hasChildren = children.length > 0;
  const indentPx = BASE_PADDING + depth * INDENT_PER_LEVEL;
  const isDropTarget = dropTargetId === issue.id;

  // Draggable setup
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging: isDraggingActive,
  } = useDraggable({
    id: issue.id,
    data: {
      type: 'tree-node',
      issue,
      depth,
    },
  });

  // Droppable setup
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: issue.id,
    data: {
      type: 'tree-node',
      issue,
      depth,
      accepts: 'tree-node',
    },
  });

  // Combine refs
  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      setDragRef(element);
      setDropRef(element);
      nodeRef?.(issue.id, element);
    },
    [setDragRef, setDropRef, nodeRef, issue.id]
  );

  // Transform style for dragging
  const style = useMemo(() => {
    if (!transform) return undefined;
    return {
      transform: CSS.Translate.toString(transform),
      zIndex: isDraggingActive ? 1000 : undefined,
    };
  }, [transform, isDraggingActive]);

  // Handle chevron click
  const handleChevronClick = useCallback(() => {
    onToggleExpand(issue.id);
  }, [issue.id, onToggleExpand]);

  // Handle card click
  const handleCardClick = useCallback((clickedIssue: Issue) => {
    // Create a synthetic event for the click handler
    onIssueClick(clickedIssue, { ctrlKey: false, metaKey: false, shiftKey: false } as React.MouseEvent);
  }, [onIssueClick]);

  // Handle card double-click
  const handleCardDoubleClick = useCallback((clickedIssue: Issue) => {
    onIssueDoubleClick(clickedIssue);
  }, [onIssueDoubleClick]);

  // Don't render children of dragged node while dragging
  const shouldRenderChildren = isExpanded && hasChildren && !isDraggingActive;

  return (
    <>
      {/* Current node */}
      <div
        ref={setRefs}
        className={`
          group flex items-center gap-1 py-0.5 border-l-2 transition-colors relative
          ${isFocused 
            ? 'bg-blue-50 border-l-blue-400' 
            : isDraggingActive
              ? 'opacity-50 bg-gray-100 border-l-gray-300'
              : isOver || isDropTarget
                ? 'bg-blue-100 border-l-blue-400 ring-2 ring-blue-300 ring-inset'
                : 'border-l-transparent hover:bg-gray-50'
          }
        `}
        style={{ 
          paddingLeft: `${indentPx}px`,
          ...style,
        }}
        data-issue-id={issue.id}
        tabIndex={-1}
      >
        {/* Drop indicator for before/after */}
        {isOver && <DropIndicator position="inside" indentPx={indentPx} />}

        {/* Drag handle (shown on hover) */}
        <DragHandle 
          listeners={listeners} 
          attributes={attributes} 
          isDragging={isDraggingActive}
        />
        
        {/* Expand/collapse chevron */}
        <Chevron
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onClick={handleChevronClick}
        />

        {/* Issue card */}
        <div className="flex-1 min-w-0">
          <IssueCard
            issue={issue}
            mode="compact"
            onClick={handleCardClick}
            onDoubleClick={handleCardDoubleClick}
          />
        </div>

        {/* Children count badge */}
        {hasChildren && (
          <span className="text-xs text-gray-400 pr-2 shrink-0">
            {children.length} {children.length === 1 ? 'child' : 'children'}
          </span>
        )}
      </div>

      {/* Recursively render children when expanded */}
      {shouldRenderChildren && (
        <div className="tree-children">
          {children.map(childIssue => (
            <TreeNode
              key={childIssue.id}
              issue={childIssue}
              depth={depth + 1}
              isExpanded={expandedIds.has(childIssue.id)}
              children={getChildrenForIssue(childIssue.id)}
              expandedIds={expandedIds}
              getChildrenForIssue={getChildrenForIssue}
              isFocused={false} // Focused state is managed by parent
              draggingId={draggingId}
              dropTargetId={dropTargetId}
              onToggleExpand={onToggleExpand}
              onIssueClick={onIssueClick}
              onIssueDoubleClick={onIssueDoubleClick}
              {...(nodeRef ? { nodeRef } : {})}
            />
          ))}
        </div>
      )}
    </>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { TreeNodeProps };
