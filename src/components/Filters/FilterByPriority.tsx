/**
 * FilterByPriority - Checkboxes for filtering by priority
 */

import { memo } from 'react';
import { Priority } from '../../types';
import { PriorityIndicator } from '../Issue';

interface FilterByPriorityProps {
  selectedPriorities: Priority[];
  onChange: (priorities: Priority[]) => void;
}

const ALL_PRIORITIES = Object.values(Priority);

export const FilterByPriority = memo(function FilterByPriority({
  selectedPriorities,
  onChange,
}: FilterByPriorityProps) {
  const handleToggle = (priority: Priority) => {
    if (selectedPriorities.includes(priority)) {
      onChange(selectedPriorities.filter(p => p !== priority));
    } else {
      onChange([...selectedPriorities, priority]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPriorities.length === ALL_PRIORITIES.length) {
      onChange([]);
    } else {
      onChange([...ALL_PRIORITIES]);
    }
  };

  const allSelected = selectedPriorities.length === ALL_PRIORITIES.length;
  const someSelected = selectedPriorities.length > 0 && selectedPriorities.length < ALL_PRIORITIES.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Priority
        </label>
        <button
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {allSelected ? 'Clear' : someSelected ? 'Clear' : 'All'}
        </button>
      </div>
      <div className="space-y-1">
        {ALL_PRIORITIES.map(priority => (
          <label
            key={priority}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedPriorities.includes(priority)}
              onChange={() => handleToggle(priority)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <PriorityIndicator priority={priority} showLabel />
          </label>
        ))}
      </div>
    </div>
  );
});
