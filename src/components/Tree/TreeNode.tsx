/**
 * TreeNode - Recursive tree node component
 * 
 * Displays a single issue in the tree with:
 * - Indentation based on depth
 * - Expand/collapse chevron (if has children)
 * - IssueCard in compact mode
 * - Drag handle placeholder (for future drag-and-drop)
 * - Recursive rendering of children when expanded
 */

import { memo, useCallback, forwardRef } from 'react';
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
// DRAG HANDLE (placeholder for Phase 3.2)
// ============================================================================

const DragHandle = memo(function DragHandle() {
  return (
    <div 
      className="w-4 h-5 flex items-center justify-center shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      title="Drag to move"
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
// MAIN COMPONENT
// ============================================================================

export const TreeNode = memo(forwardRef<HTMLDivElement, TreeNodeProps>(function TreeNode(
  {
    issue,
    depth,
    isExpanded,
    children,
    expandedIds,
    getChildrenForIssue,
    isFocused,
    onToggleExpand,
    onIssueClick,
    onIssueDoubleClick,
    nodeRef,
  },
  _ref
) {
  const hasChildren = children.length > 0;
  const indentPx = BASE_PADDING + depth * INDENT_PER_LEVEL;

  // Handle chevron click
  const handleChevronClick = useCallback(() => {
    onToggleExpand(issue.id);
  }, [issue.id, onToggleExpand]);

  // Handle card click
  const handleCardClick = useCallback((clickedIssue: Issue) => {
    // Create a synthetic event for the click handler
    // Note: This is called from IssueCard, so we wrap it
    onIssueClick(clickedIssue, { ctrlKey: false, metaKey: false, shiftKey: false } as React.MouseEvent);
  }, [onIssueClick]);

  // Handle card double-click
  const handleCardDoubleClick = useCallback((clickedIssue: Issue) => {
    onIssueDoubleClick(clickedIssue);
  }, [onIssueDoubleClick]);

  // Reference callback for keyboard navigation
  const setRef = useCallback((element: HTMLDivElement | null) => {
    nodeRef?.(issue.id, element);
  }, [issue.id, nodeRef]);

  return (
    <>
      {/* Current node */}
      <div
        ref={setRef}
        className={`
          group flex items-center gap-1 py-0.5 border-l-2 transition-colors
          ${isFocused 
            ? 'bg-blue-50 border-l-blue-400' 
            : 'border-l-transparent hover:bg-gray-50'
          }
        `}
        style={{ paddingLeft: `${indentPx}px` }}
        data-issue-id={issue.id}
        tabIndex={-1}
      >
        {/* Drag handle (shown on hover) */}
        <DragHandle />
        
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
      {isExpanded && hasChildren && (
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
              onToggleExpand={onToggleExpand}
              onIssueClick={onIssueClick}
              onIssueDoubleClick={onIssueDoubleClick}
              nodeRef={nodeRef}
            />
          ))}
        </div>
      )}
    </>
  );
}));

// ============================================================================
// EXPORTS
// ============================================================================

export type { TreeNodeProps };
