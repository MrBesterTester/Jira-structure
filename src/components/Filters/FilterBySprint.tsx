/**
 * FilterBySprint - Dropdown/checkboxes for filtering by sprint
 */

import { memo } from 'react';
import { useSprintStore } from '../../store';
import { SprintStatus } from '../../types';

interface FilterBySprintProps {
  selectedSprints: string[];
  onChange: (sprints: string[]) => void;
}

export const FilterBySprint = memo(function FilterBySprint({
  selectedSprints,
  onChange,
}: FilterBySprintProps) {
  const sprints = useSprintStore(state => state.sprints);

  const handleToggle = (sprintId: string) => {
    if (selectedSprints.includes(sprintId)) {
      onChange(selectedSprints.filter(id => id !== sprintId));
    } else {
      onChange([...selectedSprints, sprintId]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  // Group sprints by status
  const activeSprints = sprints.filter(s => s.status === SprintStatus.Active);
  const plannedSprints = sprints.filter(s => s.status === SprintStatus.Planned);
  const completedSprints = sprints.filter(s => s.status === SprintStatus.Completed);

  const getStatusBadge = (status: SprintStatus) => {
    switch (status) {
      case SprintStatus.Active:
        return <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700">Active</span>;
      case SprintStatus.Planned:
        return <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Planned</span>;
      case SprintStatus.Completed:
        return <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">Completed</span>;
    }
  };

  const renderSprintGroup = (groupSprints: typeof sprints, label: string) => {
    if (groupSprints.length === 0) return null;
    
    return (
      <div className="space-y-1">
        <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">
          {label}
        </div>
        {groupSprints.map(sprint => (
          <label
            key={sprint.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedSprints.includes(sprint.id)}
              onChange={() => handleToggle(sprint.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 flex-1">{sprint.name}</span>
            {getStatusBadge(sprint.status)}
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Sprint
        </label>
        {selectedSprints.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {/* No sprint option */}
        <label
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selectedSprints.includes('__backlog__')}
            onChange={() => handleToggle('__backlog__')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500 italic">Backlog (no sprint)</span>
        </label>

        {renderSprintGroup(activeSprints, 'Active')}
        {renderSprintGroup(plannedSprints, 'Planned')}
        {renderSprintGroup(completedSprints, 'Completed')}
      </div>
    </div>
  );
});
