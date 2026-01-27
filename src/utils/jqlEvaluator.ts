/**
 * JQL Evaluator - Evaluates parsed JQL AST against Issue arrays
 * 
 * Supports:
 * - All comparison operators: =, !=, >, <, >=, <=, ~ (contains)
 * - Boolean operators: AND, OR, NOT
 * - IN and NOT IN for set membership
 * - Case-insensitive string matching
 * - Array field handling (labels, components)
 */

import type { Issue, IssueType, IssueStatus, Priority } from '../types';
import type {
  ASTNode,
  BinaryExpression,
  UnaryExpression,
  ComparisonExpression,
  InExpression,
  Literal,
} from './jqlParser';

// ============================================================================
// FIELD VALUE EXTRACTION
// ============================================================================

/**
 * Maps JQL field names to Issue property names (case-insensitive)
 */
const FIELD_MAP: Record<string, keyof Issue> = {
  'type': 'type',
  'status': 'status',
  'priority': 'priority',
  'assignee': 'assignee',
  'reporter': 'reporter',
  'sprint': 'sprint',
  'labels': 'labels',
  'storypoints': 'storyPoints',
  'version': 'version',
  'component': 'components',
  'components': 'components',
  'duedate': 'dueDate',
  'startdate': 'startDate',
  'createdat': 'createdAt',
  'updatedat': 'updatedAt',
  'key': 'key',
  'title': 'title',
  'description': 'description',
  'parentid': 'parentId',
  'parent': 'parentId',
};

/**
 * Normalize enum values for comparison
 */
const ENUM_NORMALIZATIONS: Record<string, Record<string, string>> = {
  type: {
    'initiative': 'Initiative',
    'epic': 'Epic',
    'feature': 'Feature',
    'story': 'Story',
    'task': 'Task',
    'bug': 'Bug',
    'subtask': 'Subtask',
  },
  status: {
    'todo': 'To Do',
    'to do': 'To Do',
    'inprogress': 'In Progress',
    'in progress': 'In Progress',
    'inreview': 'In Review',
    'in review': 'In Review',
    'done': 'Done',
  },
  priority: {
    'highest': 'Highest',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
    'lowest': 'Lowest',
  },
};

/**
 * Get the normalized field name from a JQL field
 */
function getIssueField(jqlField: string): keyof Issue | null {
  const normalized = jqlField.toLowerCase().replace(/[_-]/g, '');
  return FIELD_MAP[normalized] || null;
}

/**
 * Get the value of a field from an issue
 */
function getFieldValue(issue: Issue, field: string): unknown {
  const issueField = getIssueField(field);
  if (!issueField) {
    return undefined;
  }
  return issue[issueField];
}

/**
 * Normalize a value based on field type
 */
function normalizeValue(field: string, value: string | number): string | number {
  if (typeof value === 'number') return value;
  
  const normalizedField = field.toLowerCase().replace(/[_-]/g, '');
  const enumMap = ENUM_NORMALIZATIONS[normalizedField];
  
  if (enumMap) {
    const normalizedInput = value.toLowerCase();
    return enumMap[normalizedInput] || value;
  }
  
  return value;
}

// ============================================================================
// COMPARISON FUNCTIONS
// ============================================================================

/**
 * Case-insensitive string comparison
 */
function compareStrings(a: string, b: string): number {
  return a.toLowerCase().localeCompare(b.toLowerCase());
}

/**
 * Check if a value equals another (case-insensitive for strings)
 */
function equals(actual: unknown, expected: unknown): boolean {
  if (actual === null || actual === undefined) {
    return expected === null || expected === undefined || expected === '';
  }
  
  // Array fields (labels, components)
  if (Array.isArray(actual)) {
    const expectedStr = String(expected).toLowerCase();
    return actual.some(item => String(item).toLowerCase() === expectedStr);
  }
  
  // Number comparison
  if (typeof actual === 'number' && typeof expected === 'number') {
    return actual === expected;
  }
  
  // String comparison (case-insensitive)
  return String(actual).toLowerCase() === String(expected).toLowerCase();
}

/**
 * Check if actual contains expected (case-insensitive)
 */
function contains(actual: unknown, expected: unknown): boolean {
  if (actual === null || actual === undefined) {
    return false;
  }
  
  const expectedStr = String(expected).toLowerCase();
  
  // Array fields
  if (Array.isArray(actual)) {
    return actual.some(item => String(item).toLowerCase().includes(expectedStr));
  }
  
  // String contains
  return String(actual).toLowerCase().includes(expectedStr);
}

/**
 * Compare two values numerically or as strings
 */
function compare(actual: unknown, expected: unknown, operator: '>' | '<' | '>=' | '<='): boolean {
  if (actual === null || actual === undefined) {
    return false;
  }
  
  // Numeric comparison
  if (typeof actual === 'number' && typeof expected === 'number') {
    switch (operator) {
      case '>': return actual > expected;
      case '<': return actual < expected;
      case '>=': return actual >= expected;
      case '<=': return actual <= expected;
    }
  }
  
  // Date comparison (ISO strings)
  const actualStr = String(actual);
  const expectedStr = String(expected);
  
  // Try to parse as dates
  const actualDate = Date.parse(actualStr);
  const expectedDate = Date.parse(expectedStr);
  
  if (!isNaN(actualDate) && !isNaN(expectedDate)) {
    switch (operator) {
      case '>': return actualDate > expectedDate;
      case '<': return actualDate < expectedDate;
      case '>=': return actualDate >= expectedDate;
      case '<=': return actualDate <= expectedDate;
    }
  }
  
  // String comparison
  const cmp = compareStrings(actualStr, expectedStr);
  switch (operator) {
    case '>': return cmp > 0;
    case '<': return cmp < 0;
    case '>=': return cmp >= 0;
    case '<=': return cmp <= 0;
  }
}

// ============================================================================
// AST EVALUATION
// ============================================================================

/**
 * Evaluate an AST node against an issue
 */
function evaluateNode(node: ASTNode, issue: Issue): boolean {
  switch (node.type) {
    case 'BinaryExpression':
      return evaluateBinaryExpression(node, issue);
    case 'UnaryExpression':
      return evaluateUnaryExpression(node, issue);
    case 'ComparisonExpression':
      return evaluateComparisonExpression(node, issue);
    case 'InExpression':
      return evaluateInExpression(node, issue);
    default:
      // Identifiers and Literals shouldn't appear at the top level
      return false;
  }
}

function evaluateBinaryExpression(node: BinaryExpression, issue: Issue): boolean {
  const leftResult = evaluateNode(node.left, issue);
  
  // Short-circuit evaluation
  if (node.operator === 'AND') {
    if (!leftResult) return false;
    return evaluateNode(node.right, issue);
  } else {
    // OR
    if (leftResult) return true;
    return evaluateNode(node.right, issue);
  }
}

function evaluateUnaryExpression(node: UnaryExpression, issue: Issue): boolean {
  const operandResult = evaluateNode(node.operand, issue);
  return !operandResult;
}

function evaluateComparisonExpression(node: ComparisonExpression, issue: Issue): boolean {
  const actualValue = getFieldValue(issue, node.field);
  const expectedValue = normalizeValue(node.field, node.value.value);
  
  switch (node.operator) {
    case '=':
      return equals(actualValue, expectedValue);
    case '!=':
      return !equals(actualValue, expectedValue);
    case '~':
      return contains(actualValue, expectedValue);
    case '>':
    case '<':
    case '>=':
    case '<=':
      return compare(actualValue, expectedValue, node.operator);
    default:
      return false;
  }
}

function evaluateInExpression(node: InExpression, issue: Issue): boolean {
  const actualValue = getFieldValue(issue, node.field);
  
  const matchesAny = node.values.some(literal => {
    const expectedValue = normalizeValue(node.field, literal.value);
    return equals(actualValue, expectedValue);
  });
  
  return node.negated ? !matchesAny : matchesAny;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Evaluate a JQL AST against an array of issues
 * @param ast The parsed JQL AST (null means no filter, return all)
 * @param issues The issues to filter
 * @returns Matching issues
 */
export function evaluateJQL(ast: ASTNode | null, issues: Issue[]): Issue[] {
  if (!ast) {
    return issues;
  }
  
  return issues.filter(issue => evaluateNode(ast, issue));
}

/**
 * Evaluate a JQL AST against a single issue
 * @param ast The parsed JQL AST
 * @param issue The issue to test
 * @returns true if the issue matches the query
 */
export function matchesJQL(ast: ASTNode | null, issue: Issue): boolean {
  if (!ast) {
    return true;
  }
  
  return evaluateNode(ast, issue);
}

/**
 * Get available values for a field (for autocomplete)
 */
export function getFieldValues(field: string, issues: Issue[]): string[] {
  const issueField = getIssueField(field);
  if (!issueField) return [];
  
  const values = new Set<string>();
  
  for (const issue of issues) {
    const value = issue[issueField];
    if (value === null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      value.forEach(v => values.add(String(v)));
    } else {
      values.add(String(value));
    }
  }
  
  return Array.from(values).sort();
}

/**
 * Get enum values for a field
 */
export function getEnumValues(field: string): string[] {
  const normalizedField = field.toLowerCase().replace(/[_-]/g, '');
  
  switch (normalizedField) {
    case 'type':
      return Object.values(IssueType);
    case 'status':
      return Object.values(IssueStatus);
    case 'priority':
      return Object.values(Priority);
    default:
      return [];
  }
}

// Re-export types
import { IssueType as IT, IssueStatus as IS, Priority as P } from '../types';
export { IT as IssueType, IS as IssueStatus, P as Priority };
