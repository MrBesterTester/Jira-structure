/**
 * Import Data Utilities
 * 
 * Functions for importing data from JSON and CSV files.
 * Includes validation, conflict detection, and error reporting.
 */

import type { Issue, Project, Sprint, User, Structure, AppData } from '../types';
import { IssueType, IssueStatus, Priority, SprintStatus } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type ImportFormat = 'json' | 'csv';
export type ConflictResolution = 'skip' | 'overwrite' | 'create_new';

export interface ImportOptions {
  conflictResolution: ConflictResolution;
}

export interface ImportError {
  row?: number;
  field?: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  data: Partial<AppData> | null;
  stats: {
    issuesImported: number;
    issuesSkipped: number;
    issuesOverwritten: number;
    projectsImported: number;
    sprintsImported: number;
    usersImported: number;
    structuresImported: number;
  };
  errors: ImportError[];
  warnings: string[];
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a value is a valid IssueType
 */
function isValidIssueType(value: string): value is IssueType {
  return Object.values(IssueType).includes(value as IssueType);
}

/**
 * Check if a value is a valid IssueStatus
 */
function isValidIssueStatus(value: string): value is IssueStatus {
  return Object.values(IssueStatus).includes(value as IssueStatus);
}

/**
 * Check if a value is a valid Priority
 */
function isValidPriority(value: string): value is Priority {
  return Object.values(Priority).includes(value as Priority);
}

/**
 * Check if a value is a valid SprintStatus
 */
function isValidSprintStatus(value: string): value is SprintStatus {
  return Object.values(SprintStatus).includes(value as SprintStatus);
}

/**
 * Validate an issue object
 */
function validateIssue(issue: unknown, rowNum?: number): { valid: boolean; errors: ImportError[] } {
  const errors: ImportError[] = [];
  const row = rowNum;
  
  if (!issue || typeof issue !== 'object') {
    errors.push({ row, message: 'Invalid issue object' });
    return { valid: false, errors };
  }
  
  const i = issue as Record<string, unknown>;
  
  // Required fields
  if (!i.id || typeof i.id !== 'string') {
    errors.push({ row, field: 'id', message: 'Missing or invalid id' });
  }
  if (!i.key || typeof i.key !== 'string') {
    errors.push({ row, field: 'key', message: 'Missing or invalid key' });
  }
  if (!i.title || typeof i.title !== 'string') {
    errors.push({ row, field: 'title', message: 'Missing or invalid title' });
  }
  if (!i.type || !isValidIssueType(String(i.type))) {
    errors.push({ row, field: 'type', message: `Invalid type: ${i.type}` });
  }
  if (!i.status || !isValidIssueStatus(String(i.status))) {
    errors.push({ row, field: 'status', message: `Invalid status: ${i.status}` });
  }
  if (!i.priority || !isValidPriority(String(i.priority))) {
    errors.push({ row, field: 'priority', message: `Invalid priority: ${i.priority}` });
  }
  if (!i.reporter || typeof i.reporter !== 'string') {
    errors.push({ row, field: 'reporter', message: 'Missing or invalid reporter' });
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// FILE READING
// ============================================================================

/**
 * Read a file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Detect the format of a file based on extension and content
 */
export function detectFormat(file: File): ImportFormat {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'csv';
  return 'json';
}

// ============================================================================
// JSON IMPORT
// ============================================================================

/**
 * Parse and validate JSON data
 */
export function parseJSONData(content: string): { 
  data: Partial<AppData> | null; 
  errors: ImportError[];
  warnings: string[];
} {
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    errors.push({ message: `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}` });
    return { data: null, errors, warnings };
  }
  
  if (!parsed || typeof parsed !== 'object') {
    errors.push({ message: 'JSON must be an object' });
    return { data: null, errors, warnings };
  }
  
  const data: Partial<AppData> = {};
  const obj = parsed as Record<string, unknown>;
  
  // Parse issues
  if (obj.issues && Array.isArray(obj.issues)) {
    data.issues = [];
    obj.issues.forEach((issue, index) => {
      const validation = validateIssue(issue, index + 1);
      if (validation.valid) {
        data.issues!.push(issue as Issue);
      } else {
        errors.push(...validation.errors);
      }
    });
  }
  
  // Parse projects
  if (obj.projects && Array.isArray(obj.projects)) {
    data.projects = obj.projects as Project[];
  }
  
  // Parse sprints
  if (obj.sprints && Array.isArray(obj.sprints)) {
    data.sprints = [];
    obj.sprints.forEach((sprint, index) => {
      const s = sprint as Record<string, unknown>;
      if (s.status && !isValidSprintStatus(String(s.status))) {
        warnings.push(`Sprint ${index + 1}: Invalid status "${s.status}", skipping`);
      } else {
        data.sprints!.push(sprint as Sprint);
      }
    });
  }
  
  // Parse users
  if (obj.users && Array.isArray(obj.users)) {
    data.users = obj.users as User[];
  }
  
  // Parse structures
  if (obj.structures && Array.isArray(obj.structures)) {
    data.structures = obj.structures as Structure[];
  }
  
  return { data, errors, warnings };
}

// ============================================================================
// CSV IMPORT
// ============================================================================

/**
 * Parse a CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next char
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Don't forget the last value
  values.push(current);
  
  return values;
}

/**
 * Parse semicolon-separated values into an array
 */
function parseArrayValue(value: string): string[] {
  if (!value || value.trim() === '') return [];
  return value.split(';').map(v => v.trim()).filter(v => v.length > 0);
}

/**
 * Parse CSV data into issues
 */
export function parseCSVData(content: string): {
  data: Partial<AppData> | null;
  errors: ImportError[];
  warnings: string[];
} {
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  const issues: Issue[] = [];
  
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    errors.push({ message: 'CSV must have at least a header row and one data row' });
    return { data: null, errors, warnings };
  }
  
  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  
  // Required headers
  const requiredHeaders = ['key', 'title', 'type', 'status', 'priority', 'reporter'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    errors.push({ message: `Missing required headers: ${missingHeaders.join(', ')}` });
    return { data: null, errors, warnings };
  }
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      warnings.push(`Row ${rowNum}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
    }
    
    // Create issue object from row
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    // Build issue object
    const now = new Date().toISOString();
    const issue: Issue = {
      id: row.id || `imported-${Date.now()}-${i}`,
      key: row.key || '',
      title: row.title || '',
      description: row.description || '',
      type: row.type as IssueType || IssueType.Task,
      status: row.status as IssueStatus || IssueStatus.Todo,
      priority: row.priority as Priority || Priority.Medium,
      assignee: row.assignee || null,
      reporter: row.reporter || 'unknown',
      labels: parseArrayValue(row.labels),
      createdAt: row.createdat || now,
      updatedAt: row.updatedat || now,
      storyPoints: row.storypoints ? parseInt(row.storypoints, 10) : null,
      sprint: row.sprint || null,
      version: row.version || null,
      components: parseArrayValue(row.components),
      dueDate: row.duedate || null,
      startDate: row.startdate || null,
      originalEstimate: row.originalestimate ? parseFloat(row.originalestimate) : null,
      timeSpent: row.timespent ? parseFloat(row.timespent) : null,
      remainingEstimate: row.remainingestimate ? parseFloat(row.remainingestimate) : null,
      parentId: row.parentid || null,
      childIds: parseArrayValue(row.childids),
      blockedBy: parseArrayValue(row.blockedby),
      blocks: parseArrayValue(row.blocks),
      relatedTo: parseArrayValue(row.relatedto),
    };
    
    // Validate the issue
    const validation = validateIssue(issue, rowNum);
    if (validation.valid) {
      issues.push(issue);
    } else {
      errors.push(...validation.errors);
    }
  }
  
  return { 
    data: { issues }, 
    errors, 
    warnings 
  };
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Merge imported data with existing data based on conflict resolution strategy
 */
export function mergeData(
  existing: AppData,
  imported: Partial<AppData>,
  options: ImportOptions
): { merged: AppData; stats: ImportResult['stats'] } {
  const stats: ImportResult['stats'] = {
    issuesImported: 0,
    issuesSkipped: 0,
    issuesOverwritten: 0,
    projectsImported: 0,
    sprintsImported: 0,
    usersImported: 0,
    structuresImported: 0,
  };
  
  const merged: AppData = {
    projects: [...existing.projects],
    issues: [...existing.issues],
    sprints: [...existing.sprints],
    users: [...existing.users],
    structures: [...existing.structures],
  };
  
  // Merge issues
  if (imported.issues) {
    imported.issues.forEach(importedIssue => {
      const existingIndex = merged.issues.findIndex(
        e => e.id === importedIssue.id || e.key === importedIssue.key
      );
      
      if (existingIndex >= 0) {
        // Conflict found
        switch (options.conflictResolution) {
          case 'skip':
            stats.issuesSkipped++;
            break;
          case 'overwrite':
            merged.issues[existingIndex] = importedIssue;
            stats.issuesOverwritten++;
            break;
          case 'create_new': {
            // Generate new ID and key
            const newIssue = {
              ...importedIssue,
              id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              key: `${importedIssue.key}-COPY`,
            };
            merged.issues.push(newIssue);
            stats.issuesImported++;
            break;
          }
        }
      } else {
        // No conflict, just add
        merged.issues.push(importedIssue);
        stats.issuesImported++;
      }
    });
  }
  
  // Merge projects (simpler - just add new ones)
  if (imported.projects) {
    imported.projects.forEach(project => {
      if (!merged.projects.find(p => p.id === project.id)) {
        merged.projects.push(project);
        stats.projectsImported++;
      }
    });
  }
  
  // Merge sprints
  if (imported.sprints) {
    imported.sprints.forEach(sprint => {
      if (!merged.sprints.find(s => s.id === sprint.id)) {
        merged.sprints.push(sprint);
        stats.sprintsImported++;
      }
    });
  }
  
  // Merge users
  if (imported.users) {
    imported.users.forEach(user => {
      if (!merged.users.find(u => u.id === user.id)) {
        merged.users.push(user);
        stats.usersImported++;
      }
    });
  }
  
  // Merge structures
  if (imported.structures) {
    imported.structures.forEach(structure => {
      if (!merged.structures.find(s => s.id === structure.id)) {
        merged.structures.push(structure);
        stats.structuresImported++;
      }
    });
  }
  
  return { merged, stats };
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

/**
 * Main import function that handles file parsing and validation
 */
export async function importFile(file: File): Promise<{
  data: Partial<AppData> | null;
  errors: ImportError[];
  warnings: string[];
}> {
  const format = detectFormat(file);
  const content = await readFileAsText(file);
  
  if (format === 'json') {
    return parseJSONData(content);
  } else {
    return parseCSVData(content);
  }
}

/**
 * Complete import process: parse, validate, merge, and return result
 */
export async function processImport(
  file: File,
  existingData: AppData,
  options: ImportOptions
): Promise<ImportResult> {
  const parseResult = await importFile(file);
  
  if (!parseResult.data) {
    return {
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
      errors: parseResult.errors,
      warnings: parseResult.warnings,
    };
  }
  
  const { merged, stats } = mergeData(existingData, parseResult.data, options);
  
  return {
    success: parseResult.errors.length === 0,
    data: merged,
    stats,
    errors: parseResult.errors,
    warnings: parseResult.warnings,
  };
}
