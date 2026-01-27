/**
 * ImportModal - Modal for importing data from JSON or CSV files
 * 
 * Features:
 * - File upload with drag-and-drop
 * - Format auto-detection
 * - Preview of data to import
 * - Conflict resolution options
 * - Progress and results display
 */

import { memo, useState, useCallback, useMemo, useRef } from 'react';
import { useIssueStore, useProjectStore, useSprintStore, useUserStore } from '../../store';
import * as api from '../../services/api';
import {
  processImport,
  detectFormat,
  type ImportFormat,
  type ConflictResolution,
  type ImportResult,
} from '../../utils/importData';
import type { AppData } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ImportModalProps {
  onClose: () => void;
}

type ImportStep = 'select' | 'preview' | 'importing' | 'complete';

// ============================================================================
// COMPONENT
// ============================================================================

export const ImportModal = memo(function ImportModal({ onClose }: ImportModalProps) {
  // Store hooks
  const issues = useIssueStore(state => state.issues);
  const fetchIssues = useIssueStore(state => state.fetchIssues);
  const projects = useProjectStore(state => state.projects);
  const fetchProjects = useProjectStore(state => state.fetchProjects);
  const sprints = useSprintStore(state => state.sprints);
  const fetchSprints = useSprintStore(state => state.fetchSprints);
  const users = useUserStore(state => state.users);
  const fetchUsers = useUserStore(state => state.fetchUsers);
  
  // State
  const [step, setStep] = useState<ImportStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<ImportFormat | null>(null);
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('skip');
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Current data for merging
  const existingData: AppData = useMemo(() => ({
    issues,
    projects,
    sprints,
    users,
    structures: [], // We don't have a structures store
  }), [issues, projects, sprints, users]);
  
  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const format = detectFormat(file);
    setSelectedFile(file);
    setDetectedFormat(format);
    setStep('preview');
  }, []);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'json' || ext === 'csv') {
        handleFileSelect(file);
      }
    }
  }, [handleFileSelect]);
  
  // Handle import
  const handleImport = useCallback(async () => {
    if (!selectedFile) return;
    
    setStep('importing');
    
    try {
      const result = await processImport(selectedFile, existingData, {
        conflictResolution,
      });
      
      if (result.success && result.data) {
        // Save to API
        await Promise.all([
          result.data.issues && api.updateIssues(result.data.issues),
          result.data.projects && api.updateProjects(result.data.projects),
          result.data.sprints && api.updateSprints(result.data.sprints),
          result.data.users && api.updateUsers(result.data.users),
        ]);
        
        // Refresh stores
        await Promise.all([
          fetchIssues(),
          fetchProjects(),
          fetchSprints(),
          fetchUsers(),
        ]);
      }
      
      setImportResult(result);
      setStep('complete');
    } catch (error) {
      setImportResult({
        success: false,
        data: null,
        stats: {
          issuesImported: 0,
          issuesSkipped: 0,
          issuesOverwritten: 0,
          projectsImported: 0,
          sprintsImported: 0,
          usersImported: 0,
          structuresImported: 0,
        },
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
        warnings: [],
      });
      setStep('complete');
    }
  }, [selectedFile, existingData, conflictResolution, fetchIssues, fetchProjects, fetchSprints, fetchUsers]);
  
  // Reset to start
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setDetectedFormat(null);
    setImportResult(null);
    setStep('select');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  // File size display
  const fileSize = useMemo(() => {
    if (!selectedFile) return '';
    const bytes = selectedFile.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [selectedFile]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Import Data</h2>
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
        <div className="px-6 py-4">
          {/* Step: Select File */}
          {step === 'select' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500">JSON or CSV files only</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Supported Formats</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    JSON - Full backup with all data or issues only
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    CSV - Spreadsheet format (issues only)
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Step: Preview */}
          {step === 'preview' && selectedFile && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  detectedFormat === 'json' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>
                  {detectedFormat === 'json' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {detectedFormat?.toUpperCase()} • {fileSize}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Conflict Resolution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  If duplicates are found:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="conflict"
                      value="skip"
                      checked={conflictResolution === 'skip'}
                      onChange={() => setConflictResolution('skip')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Skip duplicates</div>
                      <div className="text-sm text-gray-500">Keep existing data, ignore imported duplicates</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="conflict"
                      value="overwrite"
                      checked={conflictResolution === 'overwrite'}
                      onChange={() => setConflictResolution('overwrite')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Overwrite existing</div>
                      <div className="text-sm text-gray-500">Replace existing data with imported data</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="conflict"
                      value="create_new"
                      checked={conflictResolution === 'create_new'}
                      onChange={() => setConflictResolution('create_new')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Create new copies</div>
                      <div className="text-sm text-gray-500">Import as new items with different keys</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="py-8 text-center">
              <svg className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600">Importing data...</p>
              <p className="text-sm text-gray-500">This may take a moment</p>
            </div>
          )}
          
          {/* Step: Complete */}
          {step === 'complete' && importResult && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg ${
                importResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {importResult.success ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <div>
                    <h3 className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {importResult.success ? 'Import Complete' : 'Import Failed'}
                    </h3>
                    {!importResult.success && importResult.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {importResult.errors[0].message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              {importResult.success && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Import Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Issues imported:</span>
                      <span className="font-medium text-green-600">{importResult.stats.issuesImported}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Issues skipped:</span>
                      <span className="font-medium text-gray-600">{importResult.stats.issuesSkipped}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Issues overwritten:</span>
                      <span className="font-medium text-orange-600">{importResult.stats.issuesOverwritten}</span>
                    </div>
                    {importResult.stats.projectsImported > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Projects imported:</span>
                        <span className="font-medium text-green-600">{importResult.stats.projectsImported}</span>
                      </div>
                    )}
                    {importResult.stats.sprintsImported > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Sprints imported:</span>
                        <span className="font-medium text-green-600">{importResult.stats.sprintsImported}</span>
                      </div>
                    )}
                    {importResult.stats.usersImported > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Users imported:</span>
                        <span className="font-medium text-green-600">{importResult.stats.usersImported}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Warnings</h3>
                  <ul className="text-sm text-yellow-700 space-y-1 max-h-24 overflow-y-auto">
                    {importResult.warnings.slice(0, 5).map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                    {importResult.warnings.length > 5 && (
                      <li className="text-yellow-600">...and {importResult.warnings.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Errors */}
              {importResult.errors.length > 1 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Errors</h3>
                  <ul className="text-sm text-red-700 space-y-1 max-h-24 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>
                        • {error.row ? `Row ${error.row}: ` : ''}{error.message}
                      </li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-red-600">...and {importResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          {step === 'select' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
          )}
          
          {step === 'preview' && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
              </button>
            </>
          )}
          
          {step === 'complete' && (
            <>
              {!importResult?.success && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                {importResult?.success ? 'Done' : 'Close'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default ImportModal;
