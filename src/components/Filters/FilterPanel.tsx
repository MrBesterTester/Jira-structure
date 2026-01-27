/**
 * FilterPanel - Main expandable filter panel for sidebar
 * 
 * Contains all filter components and provides a unified filtering experience.
 */

import { memo, useState } from 'react';
import { useUIStore } from '../../store';
import { countActiveFilters } from '../../utils';
import { FilterByType } from './FilterByType';
import { FilterByStatus } from './FilterByStatus';
import { FilterByPriority } from './FilterByPriority';
import { FilterByAssignee } from './FilterByAssignee';
import { FilterBySprint } from './FilterBySprint';
import { FilterByLabels } from './FilterByLabels';
import { FilterByParent } from './FilterByParent';
import { SavedFilters } from './SavedFilters';

interface FilterPanelProps {
  collapsed?: boolean;
}

type FilterSection = 'type' | 'status' | 'priority' | 'assignee' | 'sprint' | 'labels' | 'parent';

export const FilterPanel = memo(function FilterPanel({ collapsed = false }: FilterPanelProps) {
  const filters = useUIStore(state => state.filters);
  const setFilter = useUIStore(state => state.setFilter);
  const setFilters = useUIStore(state => state.setFilters);
  const clearFilters = useUIStore(state => state.clearFilters);

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<FilterSection>>(new Set(['type', 'status']));
  const [panelExpanded, setPanelExpanded] = useState(true);

  const activeFilterCount = countActiveFilters(filters);

  const toggleSection = (section: FilterSection) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // If sidebar is collapsed, show minimal version
  if (collapsed) {
    return (
      <div className="p-2">
        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            activeFilterCount > 0
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title={activeFilterCount > 0 ? `${activeFilterCount} active filters` : 'Filters'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200">
      {/* Panel header */}
      <button
        onClick={() => setPanelExpanded(!panelExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${panelExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearFilters();
            }}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Clear all
          </button>
        )}
      </button>

      {/* Panel content */}
      {panelExpanded && (
        <div className="px-3 pb-3 space-y-4">
          {/* Quick text search */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.searchText}
                onChange={(e) => setFilter('searchText', e.target.value)}
                placeholder="Search issues..."
                className="w-full px-3 py-1.5 pl-8 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {filters.searchText && (
                <button
                  onClick={() => setFilter('searchText', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Saved Filters */}
          <SavedFilters
            currentFilters={filters}
            onLoadFilter={(loadedFilters) => setFilters(loadedFilters)}
          />

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Filter sections */}
          <FilterSection
            title="Type"
            expanded={expandedSections.has('type')}
            onToggle={() => toggleSection('type')}
            hasActiveFilter={filters.types.length > 0}
          >
            <FilterByType
              selectedTypes={filters.types}
              onChange={(types) => setFilter('types', types)}
            />
          </FilterSection>

          <FilterSection
            title="Status"
            expanded={expandedSections.has('status')}
            onToggle={() => toggleSection('status')}
            hasActiveFilter={filters.statuses.length > 0}
          >
            <FilterByStatus
              selectedStatuses={filters.statuses}
              onChange={(statuses) => setFilter('statuses', statuses)}
            />
          </FilterSection>

          <FilterSection
            title="Priority"
            expanded={expandedSections.has('priority')}
            onToggle={() => toggleSection('priority')}
            hasActiveFilter={filters.priorities.length > 0}
          >
            <FilterByPriority
              selectedPriorities={filters.priorities}
              onChange={(priorities) => setFilter('priorities', priorities)}
            />
          </FilterSection>

          <FilterSection
            title="Assignee"
            expanded={expandedSections.has('assignee')}
            onToggle={() => toggleSection('assignee')}
            hasActiveFilter={filters.assignees.length > 0}
          >
            <FilterByAssignee
              selectedAssignees={filters.assignees}
              onChange={(assignees) => setFilter('assignees', assignees)}
            />
          </FilterSection>

          <FilterSection
            title="Sprint"
            expanded={expandedSections.has('sprint')}
            onToggle={() => toggleSection('sprint')}
            hasActiveFilter={filters.sprints.length > 0}
          >
            <FilterBySprint
              selectedSprints={filters.sprints}
              onChange={(sprints) => setFilter('sprints', sprints)}
            />
          </FilterSection>

          <FilterSection
            title="Labels"
            expanded={expandedSections.has('labels')}
            onToggle={() => toggleSection('labels')}
            hasActiveFilter={filters.labels.length > 0}
          >
            <FilterByLabels
              selectedLabels={filters.labels}
              onChange={(labels) => setFilter('labels', labels)}
            />
          </FilterSection>

          <FilterSection
            title="Children of"
            expanded={expandedSections.has('parent')}
            onToggle={() => toggleSection('parent')}
            hasActiveFilter={filters.parentId !== null}
          >
            <FilterByParent
              selectedParentId={filters.parentId}
              onChange={(parentId) => setFilter('parentId', parentId)}
            />
          </FilterSection>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// FILTER SECTION WRAPPER
// ============================================================================

interface FilterSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  hasActiveFilter: boolean;
  children: React.ReactNode;
}

function FilterSection({ title, expanded, onToggle, hasActiveFilter, children }: FilterSectionProps) {
  return (
    <div className="border-b border-gray-100 pb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-1 text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-medium text-gray-600">{title}</span>
          {hasActiveFilter && (
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>
      </button>
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  );
}
