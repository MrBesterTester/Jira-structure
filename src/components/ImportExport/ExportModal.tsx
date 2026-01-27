/**
 * ExportModal - Modal for exporting data to JSON or CSV
 * 
 * Features:
 * - Format selection (JSON with full data, JSON issues only, CSV)
 * - Preview of data to be exported
 * - Download trigger
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { useIssueStore, useProjectStore, useSprintStore, useUserStore } from '../../store';
import { exportData, type ExportFormat } from '../../utils/exportData';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportModalProps {
  onClose: () => void;
}

type ExportType = 'json-full' | 'json-issues' | 'csv';

// ============================================================================
// COMPONENT
// ============================================================================

export const ExportModal = memo(function ExportModal({ onClose }: ExportModalProps) {
  // Store hooks
  const issues = useIssueStore(state => state.issues);
  const projects = useProjectStore(state => state.projects);
  const sprints = useSprintStore(state => state.sprints);
  const users = useUserStore(state => state.users);
  
  // State
  const [exportType, setExportType] = useState<ExportType>('json-full');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; filename?: string; error?: string } | null>(null);
  
  // Get structures (we don't have a structures store, so we'll pass an empty array)
  const structures = useMemo(() => [], []);
  
  // Stats for preview
  const stats = useMemo(() => ({
    issues: issues.length,
    projects: projects.length,
    sprints: sprints.length,
    users: users.length,
    structures: structures.length,
  }), [issues, projects, sprints, users, structures]);
  
  // Handle export
  const handleExport = useCallback(() => {
    setIsExporting(true);
    setExportResult(null);
    
    let format: ExportFormat;
    let includeAllData: boolean;
    
    switch (exportType) {
      case 'json-full':
        format = 'json';
        includeAllData = true;
        break;
      case 'json-issues':
        format = 'json';
        includeAllData = false;
        break;
      case 'csv':
        format = 'csv';
        includeAllData = false;
        break;
    }
    
    // Small delay to show loading state
    setTimeout(() => {
      const result = exportData(
        issues,
        projects,
        sprints,
        users,
        structures,
        { format, includeAllData }
      );
      
      setExportResult(result);
      setIsExporting(false);
    }, 100);
  }, [exportType, issues, projects, sprints, users, structures]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="json-full"
                  checked={exportType === 'json-full'}
                  onChange={() => setExportType('json-full')}
                  className="mt-0.5 w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">JSON (Full Backup)</div>
                  <div className="text-sm text-gray-500">
                    Export all data including issues, projects, sprints, and users. Best for backups.
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="json-issues"
                  checked={exportType === 'json-issues'}
                  onChange={() => setExportType('json-issues')}
                  className="mt-0.5 w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">JSON (Issues Only)</div>
                  <div className="text-sm text-gray-500">
                    Export only issues. Useful for sharing or migration.
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="csv"
                  checked={exportType === 'csv'}
                  onChange={() => setExportType('csv')}
                  className="mt-0.5 w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">CSV (Spreadsheet)</div>
                  <div className="text-sm text-gray-500">
                    Export issues as CSV. Open in Excel, Google Sheets, etc.
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Data Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Data to Export</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Issues:</span>
                <span className="font-medium text-gray-900">{stats.issues}</span>
              </div>
              {exportType === 'json-full' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Projects:</span>
                    <span className="font-medium text-gray-900">{stats.projects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Sprints:</span>
                    <span className="font-medium text-gray-900">{stats.sprints}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Users:</span>
                    <span className="font-medium text-gray-900">{stats.users}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Export Result */}
          {exportResult && (
            <div className={`p-3 rounded-lg ${
              exportResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {exportResult.success ? (
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">
                    Exported successfully: {exportResult.filename}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm font-medium">
                    Export failed: {exportResult.error}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {exportResult?.success ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ExportModal;
