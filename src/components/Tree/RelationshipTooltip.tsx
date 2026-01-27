/**
 * RelationshipTooltip - Shows issue relationships on hover
 * 
 * Displays blocked by, blocks, and related to relationships
 * with clickable links to navigate to related issues.
 */

import { memo, useState, useRef, useEffect } from 'react';
import type { Issue } from '../../types';
import { useIssueStore } from '../../store';

// ============================================================================
// TYPES
// ============================================================================

interface RelationshipTooltipProps {
  /** The issue to show relationships for */
  issue: Issue;
  /** Children to wrap with tooltip trigger */
  children: React.ReactNode;
  /** Callback when a related issue is clicked */
  onIssueClick?: ((issueId: string) => void) | undefined;
}

interface TooltipPosition {
  top: number;
  left: number;
}

// ============================================================================
// RELATIONSHIP SECTION
// ============================================================================

interface RelationshipSectionProps {
  title: string;
  issueIds: string[];
  icon: React.ReactNode;
  colorClass: string;
  onIssueClick: ((issueId: string) => void) | undefined;
}

const RelationshipSection = memo(function RelationshipSection({
  title,
  issueIds,
  icon,
  colorClass,
  onIssueClick,
}: RelationshipSectionProps) {
  const getIssueById = useIssueStore(state => state.getIssueById);
  
  if (issueIds.length === 0) return null;
  
  const issues = issueIds
    .map(id => getIssueById(id))
    .filter((issue): issue is Issue => issue !== undefined);
  
  if (issues.length === 0) return null;
  
  return (
    <div className="mb-2 last:mb-0">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${colorClass} mb-1`}>
        {icon}
        {title}
      </div>
      <ul className="space-y-1">
        {issues.map(issue => (
          <li key={issue.id}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIssueClick?.(issue.id);
              }}
              className="text-xs text-gray-600 hover:text-blue-600 hover:underline text-left w-full truncate"
            >
              <span className="font-medium text-gray-700">{issue.key}</span>
              <span className="mx-1">·</span>
              <span>{issue.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RelationshipTooltip = memo(function RelationshipTooltip({
  issue,
  children,
  onIssueClick,
}: RelationshipTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const hasRelationships = 
    issue.blockedBy.length > 0 || 
    issue.blocks.length > 0 || 
    issue.relatedTo.length > 0;
  
  // Calculate tooltip position
  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280;
    const padding = 8;
    
    // Position to the right by default, or left if not enough space
    let left = rect.right + padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = rect.left - tooltipWidth - padding;
    }
    
    // Center vertically on the trigger
    const top = rect.top + rect.height / 2;
    
    setPosition({ top, left });
  };
  
  const handleMouseEnter = () => {
    if (!hasRelationships) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, 300); // 300ms delay before showing
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100); // Small delay to allow moving to tooltip
  };
  
  const handleTooltipMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
  
  const handleTooltipMouseLeave = () => {
    setIsVisible(false);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      
      {isVisible && hasRelationships && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-[280px]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateY(-50%)',
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Relationships</span>
          </div>
          
          {/* Blocked By Section */}
          <RelationshipSection
            title="Blocked by"
            issueIds={issue.blockedBy}
            colorClass="text-red-600"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
            onIssueClick={onIssueClick}
          />
          
          {/* Blocks Section */}
          <RelationshipSection
            title="Blocks"
            issueIds={issue.blocks}
            colorClass="text-orange-600"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            onIssueClick={onIssueClick}
          />
          
          {/* Related To Section */}
          <RelationshipSection
            title="Related to"
            issueIds={issue.relatedTo}
            colorClass="text-gray-600"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
            onIssueClick={onIssueClick}
          />
        </div>
      )}
    </>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { RelationshipTooltipProps };
