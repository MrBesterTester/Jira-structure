/**
 * RelationshipLines - SVG overlay for drawing relationship lines
 * 
 * Draws visual connections between issues that have blocker
 * or related relationships. Lines are rendered as an SVG overlay
 * positioned over the tree view.
 */

import { memo, useMemo, useEffect, useState, useCallback } from 'react';
import type { Issue } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface RelationshipLinesProps {
  /** All issues to consider for relationships */
  issues: Issue[];
  /** Set of visible issue IDs (currently rendered in tree) */
  visibleIssueIds: string[];
  /** Whether to show the relationship lines */
  show: boolean;
  /** Container element to position relative to */
  containerRef: React.RefObject<HTMLDivElement>;
}

interface LineData {
  id: string;
  type: 'blocks' | 'related';
  fromId: string;
  toId: string;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
}

// ============================================================================
// LINE COLORS
// ============================================================================

const LINE_COLORS = {
  blocks: {
    stroke: '#DC2626', // red-600
    markerFill: '#DC2626',
  },
  related: {
    stroke: '#9CA3AF', // gray-400
    markerFill: '#9CA3AF',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RelationshipLines = memo(function RelationshipLines({
  issues,
  visibleIssueIds,
  show,
  containerRef,
}: RelationshipLinesProps) {
  const [lines, setLines] = useState<LineData[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Build a set of visible IDs for fast lookup
  const visibleIdSet = useMemo(() => new Set(visibleIssueIds), [visibleIssueIds]);

  // Find all relationships between visible issues
  const relationships = useMemo(() => {
    if (!show) return [];

    const rels: { type: 'blocks' | 'related'; fromId: string; toId: string }[] = [];
    const processedPairs = new Set<string>();

    for (const issue of issues) {
      if (!visibleIdSet.has(issue.id)) continue;

      // Process blocker relationships (from this issue)
      for (const blockedId of issue.blocks) {
        if (visibleIdSet.has(blockedId)) {
          const pairKey = `blocks:${issue.id}:${blockedId}`;
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            rels.push({ type: 'blocks', fromId: issue.id, toId: blockedId });
          }
        }
      }

      // Process related relationships (non-directional, so check both directions)
      for (const relatedId of issue.relatedTo) {
        if (visibleIdSet.has(relatedId)) {
          // Create a consistent key regardless of direction
          const sortedIds = [issue.id, relatedId].sort();
          const pairKey = `related:${sortedIds[0]}:${sortedIds[1]}`;
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            rels.push({ type: 'related', fromId: issue.id, toId: relatedId });
          }
        }
      }
    }

    return rels;
  }, [issues, visibleIdSet, show]);

  // Calculate line positions based on DOM elements
  const calculateLines = useCallback(() => {
    if (!containerRef.current || relationships.length === 0) {
      setLines([]);
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Update dimensions
    setDimensions({
      width: container.scrollWidth,
      height: container.scrollHeight,
    });

    const newLines: LineData[] = [];

    for (const rel of relationships) {
      const fromElement = container.querySelector(`[data-issue-id="${rel.fromId}"]`);
      const toElement = container.querySelector(`[data-issue-id="${rel.toId}"]`);

      if (!fromElement || !toElement) continue;

      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();

      // Calculate positions relative to container
      // Position on the right side of the from element, center vertically
      const fromPos = {
        x: fromRect.right - containerRect.left + container.scrollLeft - 80, // Leave room for indicators
        y: fromRect.top - containerRect.top + container.scrollTop + fromRect.height / 2,
      };

      // Position on the left side of the to element, center vertically
      const toPos = {
        x: toRect.left - containerRect.left + container.scrollLeft + 40, // After the chevron/handle
        y: toRect.top - containerRect.top + container.scrollTop + toRect.height / 2,
      };

      newLines.push({
        id: `${rel.type}:${rel.fromId}:${rel.toId}`,
        type: rel.type,
        fromId: rel.fromId,
        toId: rel.toId,
        fromPos,
        toPos,
      });
    }

    setLines(newLines);
  }, [containerRef, relationships]);

  // Recalculate lines when relationships or visibility changes
  useEffect(() => {
    if (!show) {
      setLines([]);
      return;
    }

    // Initial calculation
    calculateLines();

    // Set up resize observer for container
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateLines();
    });

    resizeObserver.observe(container);

    // Also recalculate on scroll
    const handleScroll = () => {
      calculateLines();
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [show, calculateLines, containerRef]);

  // Recalculate when visible issues change (e.g., expand/collapse)
  useEffect(() => {
    if (show) {
      // Use a small delay to allow DOM to update after expand/collapse
      const timeout = setTimeout(calculateLines, 50);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [visibleIssueIds, show, calculateLines]);

  if (!show || lines.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10 overflow-visible"
      width={dimensions.width}
      height={dimensions.height}
      style={{ minWidth: '100%', minHeight: '100%' }}
    >
      {/* Define arrow markers */}
      <defs>
        <marker
          id="arrow-blocks"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={LINE_COLORS.blocks.markerFill}
          />
        </marker>
        <marker
          id="arrow-related"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={LINE_COLORS.related.markerFill}
          />
        </marker>
      </defs>

      {/* Draw relationship lines */}
      {lines.map(line => {
        const colors = LINE_COLORS[line.type];
        const isDashed = line.type === 'related';

        // Calculate control points for a curved line
        const midX = (line.fromPos.x + line.toPos.x) / 2;
        const controlOffset = Math.min(50, Math.abs(line.toPos.y - line.fromPos.y) / 2);

        // Create a curved path
        const pathData = `
          M ${line.fromPos.x} ${line.fromPos.y}
          C ${line.fromPos.x + controlOffset} ${line.fromPos.y},
            ${midX} ${line.fromPos.y},
            ${midX} ${(line.fromPos.y + line.toPos.y) / 2}
          S ${line.toPos.x - controlOffset} ${line.toPos.y},
            ${line.toPos.x} ${line.toPos.y}
        `;

        return (
          <g key={line.id}>
            {/* Line background for better visibility */}
            <path
              d={pathData}
              fill="none"
              stroke="white"
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.8}
            />
            {/* Actual relationship line */}
            <path
              d={pathData}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={isDashed ? '6 4' : 'none'}
              markerEnd={line.type === 'blocks' ? 'url(#arrow-blocks)' : undefined}
              opacity={0.7}
            />
          </g>
        );
      })}
    </svg>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { RelationshipLinesProps };
