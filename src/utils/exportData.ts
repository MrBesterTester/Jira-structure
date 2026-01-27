/**
 * Export Data Utilities
 * 
 * Functions for exporting application data to JSON and CSV formats.
 * Supports full export (all data) and issues-only export.
 */

import type { Issue, Project, Sprint, User, Structure, AppData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  includeAllData?: boolean; // For JSON: include projects, users, sprints, structures
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  error?: string;
}

// ============================================================================
// JSON EXPORT
// ============================================================================

/**
 * Export all data to JSON format
 * Returns a complete AppData object that can be imported later
 */
export function exportToJSON(
  issues: Issue[],
  projects: Project[],
  sprints: Sprint[],
  users: User[],
  structures: Structure[]
): string {
  const data: AppData = {
    projects,
    issues,
    sprints,
    users,
    structures,
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * Export only issues to JSON format
 */
export function exportIssuesToJSON(issues: Issue[]): string {
  return JSON.stringify({ issues }, null, 2);
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Escape a value for CSV format
 */
function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, newline, or double quote, wrap in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert an array to a CSV-safe string
 */
function arrayToCsvValue(arr: string[]): string {
  if (!arr || arr.length === 0) return '';
  return escapeCsvValue(arr.join('; '));
}

/**
 * Export issues to CSV format
 * Creates a flat representation with one row per issue
 */
export function exportToCSV(issues: Issue[]): string {
  // Define CSV headers matching issue fields
  const headers = [
    'key',
    'title',
    'description',
    'type',
    'status',
    'priority',
    'assignee',
    'reporter',
    'labels',
    'createdAt',
    'updatedAt',
    'storyPoints',
    'sprint',
    'version',
    'components',
    'dueDate',
    'startDate',
    'originalEstimate',
    'timeSpent',
    'remainingEstimate',
    'parentId',
    'childIds',
    'blockedBy',
    'blocks',
    'relatedTo',
  ];
  
  // Create header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = issues.map(issue => {
    const values = [
      escapeCsvValue(issue.key),
      escapeCsvValue(issue.title),
      escapeCsvValue(issue.description),
      escapeCsvValue(issue.type),
      escapeCsvValue(issue.status),
      escapeCsvValue(issue.priority),
      escapeCsvValue(issue.assignee),
      escapeCsvValue(issue.reporter),
      arrayToCsvValue(issue.labels),
      escapeCsvValue(issue.createdAt),
      escapeCsvValue(issue.updatedAt),
      escapeCsvValue(issue.storyPoints),
      escapeCsvValue(issue.sprint),
      escapeCsvValue(issue.version),
      arrayToCsvValue(issue.components),
      escapeCsvValue(issue.dueDate),
      escapeCsvValue(issue.startDate),
      escapeCsvValue(issue.originalEstimate),
      escapeCsvValue(issue.timeSpent),
      escapeCsvValue(issue.remainingEstimate),
      escapeCsvValue(issue.parentId),
      arrayToCsvValue(issue.childIds),
      arrayToCsvValue(issue.blockedBy),
      arrayToCsvValue(issue.blocks),
      arrayToCsvValue(issue.relatedTo),
    ];
    
    return values.join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

// ============================================================================
// FILE DOWNLOAD
// ============================================================================

/**
 * Trigger a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to document, click, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Revoke the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generate a default filename based on format and timestamp
 */
export function generateFilename(format: ExportFormat, prefix: string = 'jira-structure'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const extension = format === 'json' ? 'json' : 'csv';
  return `${prefix}-export-${timestamp}.${extension}`;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Main export function that handles all export formats
 */
export function exportData(
  issues: Issue[],
  projects: Project[],
  sprints: Sprint[],
  users: User[],
  structures: Structure[],
  options: ExportOptions
): ExportResult {
  try {
    let content: string;
    let mimeType: string;
    const filename = options.filename || generateFilename(options.format);
    
    if (options.format === 'json') {
      if (options.includeAllData) {
        content = exportToJSON(issues, projects, sprints, users, structures);
      } else {
        content = exportIssuesToJSON(issues);
      }
      mimeType = 'application/json';
    } else {
      content = exportToCSV(issues);
      mimeType = 'text/csv';
    }
    
    downloadFile(content, filename, mimeType);
    
    return {
      success: true,
      filename,
    };
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: error instanceof Error ? error.message : 'Unknown error during export',
    };
  }
}
