/**
 * FilterByType - Checkboxes for filtering by issue type
 */

import { memo } from 'react';
import { IssueType } from '../../types';
import { IssueTypeIcon } from '../Issue';

interface FilterByTypeProps {
  selectedTypes: IssueType[];
  onChange: (types: IssueType[]) => void;
}

const ALL_TYPES = Object.values(IssueType);

export const FilterByType = memo(function FilterByType({
  selectedTypes,
  onChange,
}: FilterByTypeProps) {
  const handleToggle = (type: IssueType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter(t => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTypes.length === ALL_TYPES.length) {
      onChange([]);
    } else {
      onChange([...ALL_TYPES]);
    }
  };

  const allSelected = selectedTypes.length === ALL_TYPES.length;
  const someSelected = selectedTypes.length > 0 && selectedTypes.length < ALL_TYPES.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Type
        </label>
        <button
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {allSelected ? 'Clear' : someSelected ? 'Clear' : 'All'}
        </button>
      </div>
      <div className="space-y-1">
        {ALL_TYPES.map(type => (
          <label
            key={type}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => handleToggle(type)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <IssueTypeIcon type={type} size="sm" />
            <span className="text-sm text-gray-700">{type}</span>
          </label>
        ))}
      </div>
    </div>
  );
});
