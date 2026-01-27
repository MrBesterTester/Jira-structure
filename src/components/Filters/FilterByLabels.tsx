/**
 * FilterByLabels - Tag input for filtering by labels
 */

import { memo, useState, useMemo, useRef, useEffect } from 'react';
import { useIssueStore } from '../../store';
import { getAllLabels } from '../../utils';

interface FilterByLabelsProps {
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
}

export const FilterByLabels = memo(function FilterByLabels({
  selectedLabels,
  onChange,
}: FilterByLabelsProps) {
  const issues = useIssueStore(state => state.issues);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all unique labels from issues
  const allLabels = useMemo(() => getAllLabels(issues), [issues]);

  // Filter suggestions based on input and exclude already selected
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) {
      return allLabels.filter(label => !selectedLabels.includes(label));
    }
    return allLabels.filter(
      label => 
        label.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedLabels.includes(label)
    );
  }, [allLabels, inputValue, selectedLabels]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddLabel = (label: string) => {
    if (!selectedLabels.includes(label)) {
      onChange([...selectedLabels, label]);
    }
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveLabel = (label: string) => {
    onChange(selectedLabels.filter(l => l !== label));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      // Add first suggestion or the input value as new label
      const firstSuggestion = suggestions[0];
      if (firstSuggestion) {
        handleAddLabel(firstSuggestion);
      } else if (inputValue.trim()) {
        handleAddLabel(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedLabels.length > 0) {
      const lastLabel = selectedLabels[selectedLabels.length - 1];
      if (lastLabel) {
        handleRemoveLabel(lastLabel);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    onChange([]);
    setInputValue('');
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Labels
        </label>
        {selectedLabels.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Selected labels */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map(label => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {label}
              <button
                onClick={() => handleRemoveLabel(label)}
                className="hover:text-blue-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input with suggestions */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search labels..."
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map(label => (
              <button
                key={label}
                onClick={() => handleAddLabel(label)}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {allLabels.length === 0 && (
        <p className="text-xs text-gray-400 italic">No labels found in issues</p>
      )}
    </div>
  );
});
