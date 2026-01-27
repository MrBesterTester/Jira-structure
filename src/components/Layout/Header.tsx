/**
 * Header - Top navigation bar
 * 
 * Contains breadcrumb navigation, JQL search bar with autocomplete,
 * and view toggle buttons (Tree/Kanban).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIStore, useProjectStore } from '../../store';
import type { ViewType } from '../../types';
import { SearchBar, saveRecentSearch } from '../Search/SearchBar';
import { SearchResults } from '../Search/SearchResults';

export function Header() {
  const currentView = useUIStore(state => state.currentView);
  const setView = useUIStore(state => state.setView);
  const searchQuery = useUIStore(state => state.searchQuery);
  const setSearchQuery = useUIStore(state => state.setSearchQuery);
  const searchResultsVisible = useUIStore(state => state.searchResultsVisible);
  const setSearchResultsVisible = useUIStore(state => state.setSearchResultsVisible);
  const clearSearch = useUIStore(state => state.clearSearch);
  
  const getCurrentProject = useProjectStore(state => state.getCurrentProject);
  const currentProject = getCurrentProject();
  
  const selectedIssueIds = useUIStore(state => state.selectedIssueIds);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Projects', path: '/' },
    ...(currentProject ? [{ label: currentProject.name, path: `/project/${currentProject.key}` }] : []),
    { label: currentView === 'tree' ? 'Structure' : 'Board', path: '#' },
  ];

  // View options
  const viewOptions: { id: ViewType; label: string; icon: JSX.Element }[] = [
    {
      id: 'tree',
      label: 'Tree',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      id: 'kanban',
      label: 'Kanban',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
    },
  ];
  
  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      saveRecentSearch(query);
      setSearchResultsVisible(true);
    } else {
      setSearchResultsVisible(false);
    }
  }, [setSearchQuery, setSearchResultsVisible]);
  
  // Handle closing search results
  const handleCloseResults = useCallback(() => {
    clearSearch();
  }, [clearSearch]);
  
  // Handle selecting an issue from results
  const handleSelectIssue = useCallback((issueId: string) => {
    // Keep search open so user can continue exploring results
    // The detail panel will open via the SearchResults component
  }, []);
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchResultsVisible(false);
      }
    };
    
    if (searchResultsVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [searchResultsVisible, setSearchResultsVisible]);
  
  // Handle escape key to close results
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && searchResultsVisible) {
        setSearchResultsVisible(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [searchResultsVisible, setSearchResultsVisible]);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left side - Breadcrumb */}
      <div className="flex items-center">
        <nav className="flex items-center space-x-1 text-sm">
          {breadcrumbItems.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <svg className="w-4 h-4 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-gray-900 font-medium">{item.label}</span>
              ) : (
                <button className="text-gray-500 hover:text-gray-700 hover:underline">
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Selection indicator */}
        {selectedIssueIds.length > 0 && (
          <div className="ml-4 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            {selectedIssueIds.length} selected
          </div>
        )}
      </div>

      {/* Center - Search bar with results */}
      <div ref={searchContainerRef} className="flex-1 max-w-xl mx-4 relative">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search (JQL): type = Bug AND priority = High"
        />
        
        {/* Search results dropdown */}
        {searchResultsVisible && searchQuery.trim() && (
          <SearchResults
            query={searchQuery}
            onClose={handleCloseResults}
            onSelectIssue={handleSelectIssue}
          />
        )}
      </div>

      {/* Right side - View toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {viewOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setView(option.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentView === option.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {/* Additional actions */}
        <button
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
