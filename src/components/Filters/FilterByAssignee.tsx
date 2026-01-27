/**
 * FilterByAssignee - Dropdown/checkboxes for filtering by assignee
 */

import { memo } from 'react';
import { useUserStore } from '../../store';

interface FilterByAssigneeProps {
  selectedAssignees: string[];
  onChange: (assignees: string[]) => void;
}

export const FilterByAssignee = memo(function FilterByAssignee({
  selectedAssignees,
  onChange,
}: FilterByAssigneeProps) {
  const users = useUserStore(state => state.users);

  const handleToggle = (userId: string) => {
    if (selectedAssignees.includes(userId)) {
      onChange(selectedAssignees.filter(id => id !== userId));
    } else {
      onChange([...selectedAssignees, userId]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Assignee
        </label>
        {selectedAssignees.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {/* Unassigned option */}
        <label
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selectedAssignees.includes('__unassigned__')}
            onChange={() => handleToggle('__unassigned__')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-sm text-gray-500 italic">Unassigned</span>
        </label>

        {/* User list */}
        {users.map(user => (
          <label
            key={user.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedAssignees.includes(user.id)}
              onChange={() => handleToggle(user.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-700 truncate">{user.displayName}</span>
          </label>
        ))}
      </div>
    </div>
  );
});
