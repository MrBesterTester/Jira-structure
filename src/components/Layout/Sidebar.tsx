/**
 * Sidebar - Navigation and filters sidebar
 * 
 * Contains project selector, navigation links, filters section,
 * import/export actions, and create issue button.
 */

import { useState } from 'react';
import { useUIStore, useProjectStore, useSprintStore } from '../../store';
import { ExportModal, ImportModal } from '../ImportExport';
import { FilterPanel } from '../Filters';

// Navigation item type
interface NavItem {
  id: string;
  label: string;
  icon: string;
  active?: boolean;
}

export function Sidebar() {
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const openCreateIssueModal = useUIStore(state => state.openCreateIssueModal);
  const importModalOpen = useUIStore(state => state.importModalOpen);
  const exportModalOpen = useUIStore(state => state.exportModalOpen);
  const openImportModal = useUIStore(state => state.openImportModal);
  const closeImportModal = useUIStore(state => state.closeImportModal);
  const openExportModal = useUIStore(state => state.openExportModal);
  const closeExportModal = useUIStore(state => state.closeExportModal);
  
  const projects = useProjectStore(state => state.projects);
  const currentProjectId = useProjectStore(state => state.currentProjectId);
  const setCurrentProject = useProjectStore(state => state.setCurrentProject);
  const getCurrentProject = useProjectStore(state => state.getCurrentProject);
  
  const getActiveSprint = useSprintStore(state => state.getActiveSprint);
  
  const [dataExpanded, setDataExpanded] = useState(true);

  const currentProject = getCurrentProject();
  const activeSprint = getActiveSprint();

  // Navigation items
  const navItems: NavItem[] = [
    { id: 'structure', label: 'Structure', icon: '📊', active: true },
    { id: 'backlog', label: 'Backlog', icon: '📋' },
    { id: 'active-sprint', label: 'Active Sprint', icon: '🏃' },
    { id: 'board', label: 'Board', icon: '📌' },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with toggle */}
      <div className="border-b border-gray-200">
        <div className="h-14 flex items-center justify-between px-4">
          {!sidebarCollapsed && (
            <span className="font-semibold text-gray-800 text-sm truncate">
              Learning Jira Structure
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
        {!sidebarCollapsed && (
          <div className="px-4 pb-2 flex items-center gap-2 text-xs text-gray-500">
            <span>{__BUILD_DATE__}</span>
            <span>•</span>
            <a 
              href="https://github.com/MrBesterTester/Jira-structure" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              GitHub repo
            </a>
          </div>
        )}
      </div>

      {/* Project Selector */}
      <div className={`border-b border-gray-200 ${sidebarCollapsed ? 'p-2' : 'p-3'}`}>
        {sidebarCollapsed ? (
          <div 
            className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer"
            title={currentProject?.name || 'Select project'}
          >
            {currentProject?.key?.charAt(0) || 'P'}
          </div>
        ) : (
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Project
            </label>
            <select
              value={currentProjectId || ''}
              onChange={(e) => setCurrentProject(e.target.value || null)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-3'}`}>
        <div className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                sidebarCollapsed 
                  ? 'justify-center p-2.5' 
                  : 'px-3 py-2'
              } ${
                item.active 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </div>

        {/* Active Sprint Info */}
        {!sidebarCollapsed && activeSprint && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 text-green-700">
              <span className="text-xs font-medium uppercase tracking-wide">Active Sprint</span>
            </div>
            <p className="text-sm font-semibold text-green-800 mt-1">{activeSprint.name}</p>
            <p className="text-xs text-green-600 mt-0.5">
              {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Filters Section */}
        {!sidebarCollapsed && (
          <div className="mt-4">
            <FilterPanel collapsed={false} />
          </div>
        )}

        {/* Data Section (Import/Export) */}
        {!sidebarCollapsed && (
          <div className="mt-6">
            <button
              onClick={() => setDataExpanded(!dataExpanded)}
              className="w-full flex items-center justify-between px-1 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
            >
              <span>Data</span>
              <svg 
                className={`w-4 h-4 transition-transform ${dataExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {dataExpanded && (
              <div className="mt-2 space-y-2 pl-1">
                <button
                  onClick={openImportModal}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Import</span>
                </button>
                <button
                  onClick={openExportModal}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export</span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Create Issue Button */}
      <div className={`border-t border-gray-200 ${sidebarCollapsed ? 'p-2' : 'p-3'}`}>
        {/* Import/Export buttons when collapsed */}
        {sidebarCollapsed && (
          <div className="flex flex-col gap-2 mb-2">
            <button
              onClick={openImportModal}
              className="w-full p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              title="Import"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <button
              onClick={openExportModal}
              className="w-full p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              title="Export"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        )}
        <button
          onClick={() => openCreateIssueModal(null)}
          className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors ${
            sidebarCollapsed ? 'p-2.5' : 'px-4 py-2.5'
          }`}
          title={sidebarCollapsed ? 'Create Issue' : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {!sidebarCollapsed && <span className="text-sm">Create Issue</span>}
        </button>
      </div>

      {/* Import Modal */}
      {importModalOpen && <ImportModal onClose={closeImportModal} />}
      
      {/* Export Modal */}
      {exportModalOpen && <ExportModal onClose={closeExportModal} />}
    </aside>
  );
}
