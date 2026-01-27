/**
 * FilterByStatus - Checkboxes for filtering by issue status
 */

import { memo } from 'react';
import { IssueStatus } from '../../types';
import { StatusBadge } from '../Issue';

interface FilterByStatusProps {
  selectedStatuses: IssueStatus[];
  onChange: (statuses: IssueStatus[]) => void;
}

const ALL_STATUSES = Object.values(IssueStatus);

export const FilterByStatus = memo(function FilterByStatus({
  selectedStatuses,
  onChange,
}: FilterByStatusProps) {
  const handleToggle = (status: IssueStatus) => {
    if (selectedStatuses.includes(status)) {
      onChange(selectedStatuses.filter(s => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStatuses.length === ALL_STATUSES.length) {
      onChange([]);
    } else {
      onChange([...ALL_STATUSES]);
    }
  };

  const allSelected = selectedStatuses.length === ALL_STATUSES.length;
  const someSelected = selectedStatuses.length > 0 && selectedStatuses.length < ALL_STATUSES.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </label>
        <button
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {allSelected ? 'Clear' : someSelected ? 'Clear' : 'All'}
        </button>
      </div>
      <div className="space-y-1">
        {ALL_STATUSES.map(status => (
          <label
            key={status}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedStatuses.includes(status)}
              onChange={() => handleToggle(status)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <StatusBadge status={status} size="sm" />
          </label>
        ))}
      </div>
    </div>
  );
});
