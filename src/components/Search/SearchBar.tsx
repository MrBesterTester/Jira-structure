/**
 * SearchBar - JQL-like search input with syntax highlighting and autocomplete
 * 
 * Features:
 * - Real-time syntax highlighting (valid: normal, error: red underline)
 * - Autocomplete suggestions for field names and values
 * - Error message display
 * - Recent searches support
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { parseJQL, getJQLFieldNames, getJQLOperators, getJQLBooleanOperators, Token, TokenType } from '../../utils/jqlParser';
import { getFieldValues, getEnumValues } from '../../utils/jqlEvaluator';
import { useIssueStore } from '../../store';
import type { Issue } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  value: string;
  label: string;
  type: 'field' | 'operator' | 'value' | 'boolean' | 'recent';
  insertText?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RECENT_SEARCHES_KEY = 'jira-structure-recent-searches';
const MAX_RECENT_SEARCHES = 10;

// ============================================================================
// RECENT SEARCHES HELPERS
// ============================================================================

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter(s => s !== trimmed);
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

// ============================================================================
// AUTOCOMPLETE LOGIC
// ============================================================================

function getAutocompleteContext(query: string, cursorPosition: number): {
  type: 'field' | 'operator' | 'value' | 'boolean' | 'start';
  currentWord: string;
  fieldContext?: string;
  startPosition: number;
} {
  // Get the text before cursor
  const beforeCursor = query.substring(0, cursorPosition);
  
  // Find the current word being typed
  const wordMatch = beforeCursor.match(/[\w.]+$/);
  const currentWord = wordMatch ? wordMatch[0] : '';
  const startPosition = cursorPosition - currentWord.length;
  
  // Tokenize to understand context
  try {
    const result = parseJQL(beforeCursor);
    const tokens = result.tokens;
    
    if (tokens.length === 0 || (tokens.length === 1 && tokens[0].type === TokenType.EOF)) {
      return { type: 'start', currentWord, startPosition };
    }
    
    // Get the last meaningful token (excluding EOF)
    const nonEofTokens = tokens.filter(t => t.type !== TokenType.EOF);
    const lastToken = nonEofTokens[nonEofTokens.length - 1];
    
    if (!lastToken) {
      return { type: 'field', currentWord, startPosition };
    }
    
    // Determine context based on last token
    switch (lastToken.type) {
      case TokenType.AND:
      case TokenType.OR:
      case TokenType.NOT:
      case TokenType.LPAREN:
        return { type: 'field', currentWord, startPosition };
        
      case TokenType.IDENTIFIER:
        // Could be starting a field name or need an operator
        // Check if there's whitespace after
        if (beforeCursor.endsWith(' ') || !currentWord) {
          return { type: 'operator', currentWord, fieldContext: lastToken.value, startPosition };
        }
        return { type: 'field', currentWord, startPosition };
        
      case TokenType.EQUALS:
      case TokenType.NOT_EQUALS:
      case TokenType.GREATER:
      case TokenType.LESS:
      case TokenType.GREATER_EQ:
      case TokenType.LESS_EQ:
      case TokenType.CONTAINS:
      case TokenType.IN:
      case TokenType.NOT_IN:
      case TokenType.COMMA:
        // Need a value - find the field name
        const fieldToken = nonEofTokens.findLast(t => t.type === TokenType.IDENTIFIER);
        return { 
          type: 'value', 
          currentWord, 
          fieldContext: fieldToken?.value,
          startPosition,
        };
        
      case TokenType.STRING:
      case TokenType.NUMBER:
      case TokenType.RPAREN:
        // After a value, need AND/OR or end
        return { type: 'boolean', currentWord, startPosition };
        
      default:
        return { type: 'field', currentWord, startPosition };
    }
  } catch {
    // If parsing fails, default to field suggestions
    return { type: 'field', currentWord, startPosition };
  }
}

function getSuggestions(
  query: string,
  cursorPosition: number,
  issues: Issue[]
): Suggestion[] {
  const context = getAutocompleteContext(query, cursorPosition);
  const currentWordLower = context.currentWord.toLowerCase();
  const suggestions: Suggestion[] = [];
  
  // If empty query, show recent searches
  if (!query.trim()) {
    const recent = getRecentSearches();
    recent.forEach(search => {
      suggestions.push({
        value: search,
        label: search,
        type: 'recent',
        insertText: search,
      });
    });
    return suggestions.slice(0, 8);
  }
  
  switch (context.type) {
    case 'start':
    case 'field':
      // Suggest field names
      getJQLFieldNames().forEach(field => {
        if (field.toLowerCase().startsWith(currentWordLower)) {
          suggestions.push({
            value: field,
            label: field,
            type: 'field',
          });
        }
      });
      break;
      
    case 'operator':
      // Suggest operators
      getJQLOperators().forEach(op => {
        if (op.toLowerCase().startsWith(currentWordLower)) {
          suggestions.push({
            value: op,
            label: op,
            type: 'operator',
          });
        }
      });
      break;
      
    case 'value':
      // First, suggest enum values if applicable
      if (context.fieldContext) {
        const enumValues = getEnumValues(context.fieldContext);
        enumValues.forEach(value => {
          if (value.toLowerCase().startsWith(currentWordLower)) {
            // Quote values with spaces
            const insertValue = value.includes(' ') ? `"${value}"` : value;
            suggestions.push({
              value: insertValue,
              label: value,
              type: 'value',
            });
          }
        });
        
        // Then suggest values from actual issues
        const fieldValues = getFieldValues(context.fieldContext, issues);
        fieldValues.forEach(value => {
          // Skip if already added from enums
          if (suggestions.some(s => s.label === value)) return;
          
          if (value.toLowerCase().startsWith(currentWordLower)) {
            const insertValue = value.includes(' ') ? `"${value}"` : value;
            suggestions.push({
              value: insertValue,
              label: value,
              type: 'value',
            });
          }
        });
      }
      break;
      
    case 'boolean':
      // Suggest boolean operators
      getJQLBooleanOperators().forEach(op => {
        if (op.toLowerCase().startsWith(currentWordLower)) {
          suggestions.push({
            value: op,
            label: op,
            type: 'boolean',
          });
        }
      });
      break;
  }
  
  return suggestions.slice(0, 10);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SearchBar({ value, onChange, onSearch, placeholder, className }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const issues = useIssueStore(state => state.issues);
  
  // Parse the query for validation
  const parseResult = useMemo(() => parseJQL(value), [value]);
  const hasError = !parseResult.success && value.trim().length > 0;
  
  // Get suggestions based on current context
  const suggestions = useMemo(
    () => getSuggestions(value, cursorPosition, issues),
    [value, cursorPosition, issues]
  );
  
  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
    setSelectedIndex(0);
    setShowSuggestions(true);
  }, [onChange]);
  
  // Handle cursor position changes
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorPosition(target.selectionStart || 0);
  }, []);
  
  // Handle focus
  const handleFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);
  
  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 150);
  }, []);
  
  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: Suggestion) => {
    if (suggestion.type === 'recent') {
      onChange(suggestion.insertText || suggestion.value);
      onSearch(suggestion.insertText || suggestion.value);
    } else {
      const context = getAutocompleteContext(value, cursorPosition);
      const beforeWord = value.substring(0, context.startPosition);
      const afterCursor = value.substring(cursorPosition);
      
      // Add appropriate spacing
      let insertValue = suggestion.value;
      if (suggestion.type !== 'value' && !afterCursor.startsWith(' ')) {
        insertValue += ' ';
      }
      
      const newValue = beforeWord + insertValue + afterCursor;
      onChange(newValue);
      
      // Move cursor after inserted text
      const newPosition = beforeWord.length + insertValue.length;
      setTimeout(() => {
        inputRef.current?.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
      }, 0);
    }
    
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [value, cursorPosition, onChange, onSearch]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveRecentSearch(value);
        onSearch(value);
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          saveRecentSearch(value);
          onSearch(value);
          setShowSuggestions(false);
        }
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, selectSuggestion, value, onSearch]);
  
  // Scroll selected suggestion into view
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selectedEl = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showSuggestions]);
  
  // Get suggestion type colors
  const getSuggestionTypeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'field': return 'bg-blue-100 text-blue-700';
      case 'operator': return 'bg-purple-100 text-purple-700';
      case 'value': return 'bg-green-100 text-green-700';
      case 'boolean': return 'bg-orange-100 text-orange-700';
      case 'recent': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <div className={`relative ${className || ''}`}>
      {/* Input */}
      <div className="relative">
        <svg 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onSelect={handleSelect}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Search (JQL): type = Bug AND priority = High"}
          className={`w-full pl-10 pr-10 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400 ${
            hasError 
              ? 'border-red-300 focus:ring-red-500 text-red-900' 
              : 'border-gray-200 focus:ring-blue-500'
          }`}
        />
        
        {/* Clear button */}
        {value && (
          <button
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Error message */}
      {hasError && parseResult.error && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 z-50">
          <span className="font-medium">Parse error:</span> {parseResult.error.message}
          {parseResult.error.position > 0 && (
            <span className="text-red-400"> (position {parseResult.error.position})</span>
          )}
        </div>
      )}
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && !hasError && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}`}
              onClick={() => selectSuggestion(suggestion)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getSuggestionTypeColor(suggestion.type)}`}>
                {suggestion.type === 'recent' ? 'history' : suggestion.type}
              </span>
              <span className="flex-1 truncate">{suggestion.label}</span>
              {suggestion.type === 'recent' && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { saveRecentSearch, getRecentSearches };
