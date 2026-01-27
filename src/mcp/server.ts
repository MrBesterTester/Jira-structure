/**
 * Jira Structure Learning Tool - MCP Server
 * 
 * Atlassian-compatible MCP Server using stdio transport for Claude Desktop integration.
 * Implements the same tool names and schemas as the official Atlassian Rovo MCP Server
 * to ensure skill transferability when switching to real Jira Cloud.
 * 
 * Also includes Structure extension tools for hierarchy learning.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
// zod is available if needed for additional validation
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ============================================================================
// TYPES (duplicated from src/types for standalone MCP server)
// ============================================================================

enum IssueType {
  Initiative = 'Initiative',
  Epic = 'Epic',
  Feature = 'Feature',
  Story = 'Story',
  Task = 'Task',
  Bug = 'Bug',
  Subtask = 'Subtask',
}

enum IssueStatus {
  Todo = 'To Do',
  InProgress = 'In Progress',
  InReview = 'In Review',
  Done = 'Done',
}

enum Priority {
  Highest = 'Highest',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Lowest = 'Lowest',
}

enum SprintStatus {
  Planned = 'planned',
  Active = 'active',
  Completed = 'completed',
}

interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  lead: string;
  createdAt: string;
}

interface Sprint {
  id: string;
  name: string;
  projectId: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  goalDescription?: string;
}

interface Issue {
  id: string;
  key: string;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: Priority;
  assignee: string | null;
  reporter: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  storyPoints: number | null;
  sprint: string | null;
  version: string | null;
  components: string[];
  dueDate: string | null;
  startDate: string | null;
  originalEstimate: number | null;
  timeSpent: number | null;
  remainingEstimate: number | null;
  parentId: string | null;
  childIds: string[];
  blockedBy: string[];
  blocks: string[];
  relatedTo: string[];
}

interface Comment {
  id: string;
  issueId: string;
  author: string;
  body: string;
  created: string;
  updated: string;
}

// ============================================================================
// DATA ACCESS LAYER
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get data directory from environment or use default relative path
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../data');

// In-memory comments store (not persisted, just for MCP compatibility)
const commentsStore: Comment[] = [];

function readJsonFile<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

function writeJsonFile<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getIssues(): Issue[] {
  return readJsonFile<Issue[]>('issues.json');
}

function saveIssues(issues: Issue[]): void {
  writeJsonFile('issues.json', issues);
}

function getProjects(): Project[] {
  return readJsonFile<Project[]>('projects.json');
}

function getUsers(): User[] {
  return readJsonFile<User[]>('users.json');
}

// getSprints can be used for sprint-related queries
// function getSprints(): Sprint[] {
//   return readJsonFile<Sprint[]>('sprints.json');
// }

function getIssueByKey(issueIdOrKey: string): Issue | undefined {
  const issues = getIssues();
  return issues.find(i => i.id === issueIdOrKey || i.key === issueIdOrKey);
}

function generateIssueKey(projectKey: string): string {
  const issues = getIssues();
  const projectIssues = issues.filter(i => i.key.startsWith(projectKey + '-'));
  const maxNum = projectIssues.reduce((max, issue) => {
    const num = parseInt(issue.key.split('-')[1], 10);
    return num > max ? num : max;
  }, 0);
  return `${projectKey}-${maxNum + 1}`;
}

function generateIssueId(): string {
  return `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// JQL PARSER (simplified version for MCP)
// ============================================================================

interface JQLCondition {
  field: string;
  operator: string;
  value: string | string[];
}

function parseSimpleJQL(jql: string): JQLCondition[] {
  const conditions: JQLCondition[] = [];
  
  // Simple regex-based parser for common JQL patterns
  // Handles: field = "value", field != value, field IN (v1, v2)
  
  let remaining = jql;
  
  // Parse IN expressions
  const inPattern = /(\w+)\s+IN\s*\(([^)]+)\)/gi;
  let match;
  while ((match = inPattern.exec(jql)) !== null) {
    const values = match[2].split(',').map(v => v.trim().replace(/["']/g, ''));
    conditions.push({ field: match[1].toLowerCase(), operator: 'IN', value: values });
    remaining = remaining.replace(match[0], '');
  }
  
  // Parse comparison expressions
  const compPattern = /(\w+)\s*(=|!=|>=|<=|>|<|~)\s*(?:"([^"]+)"|'([^']+)'|(\S+))/gi;
  while ((match = compPattern.exec(remaining)) !== null) {
    const value = match[3] || match[4] || match[5];
    conditions.push({ field: match[1].toLowerCase(), operator: match[2], value });
  }
  
  return conditions;
}

function matchesCondition(issue: Issue, condition: JQLCondition): boolean {
  const fieldMap: Record<string, keyof Issue> = {
    type: 'type',
    status: 'status',
    priority: 'priority',
    assignee: 'assignee',
    reporter: 'reporter',
    sprint: 'sprint',
    labels: 'labels',
    storypoints: 'storyPoints',
    key: 'key',
    project: 'key', // Extract project from key
  };
  
  const issueField = fieldMap[condition.field];
  if (!issueField) return true; // Unknown field, don't filter
  
  let actualValue = issue[issueField];
  
  // Special handling for project field
  if (condition.field === 'project') {
    actualValue = issue.key.split('-')[0];
  }
  
  // Normalize status values
  const statusMap: Record<string, string> = {
    'todo': 'To Do',
    'to do': 'To Do',
    'inprogress': 'In Progress',
    'in progress': 'In Progress',
    'inreview': 'In Review',
    'in review': 'In Review',
    'done': 'Done',
  };
  
  let expectedValue = condition.value;
  if (condition.field === 'status' && typeof expectedValue === 'string') {
    expectedValue = statusMap[expectedValue.toLowerCase()] || expectedValue;
  }
  
  if (condition.operator === 'IN' && Array.isArray(expectedValue)) {
    if (Array.isArray(actualValue)) {
      return expectedValue.some(v => actualValue.includes(v));
    }
    const normalizedValues = expectedValue.map(v => 
      condition.field === 'status' ? (statusMap[v.toLowerCase()] || v) : v
    );
    return normalizedValues.some(v => 
      String(actualValue).toLowerCase() === v.toLowerCase()
    );
  }
  
  if (actualValue === null || actualValue === undefined) {
    return condition.operator === '!=' || expectedValue === 'null' || expectedValue === '';
  }
  
  const actualStr = String(actualValue).toLowerCase();
  const expectedStr = String(expectedValue).toLowerCase();
  
  switch (condition.operator) {
    case '=':
      return actualStr === expectedStr;
    case '!=':
      return actualStr !== expectedStr;
    case '~':
      return actualStr.includes(expectedStr);
    default:
      return true;
  }
}

function searchIssuesWithJQL(jql: string): Issue[] {
  const issues = getIssues();
  
  if (!jql || jql.trim() === '') {
    return issues;
  }
  
  const conditions = parseSimpleJQL(jql);
  
  return issues.filter(issue => 
    conditions.every(condition => matchesCondition(issue, condition))
  );
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

// Atlassian-compatible tools
const TOOLS: Tool[] = [
  // Core Issue Tools
  {
    name: "searchJiraIssuesUsingJql",
    description: "Search for Jira issues using JQL (Jira Query Language). Returns issues matching the query.",
    inputSchema: {
      type: "object",
      properties: {
        jql: {
          type: "string",
          description: "JQL query string (e.g., 'type = Bug AND priority = High')"
        },
        maxResults: {
          type: "number",
          description: "Maximum number of results to return (default: 50)"
        },
        startAt: {
          type: "number",
          description: "Index of the first result to return (default: 0)"
        }
      },
      required: ["jql"]
    }
  },
  {
    name: "getJiraIssue",
    description: "Get a single Jira issue by its ID or key.",
    inputSchema: {
      type: "object",
      properties: {
        issueIdOrKey: {
          type: "string",
          description: "The issue ID or key (e.g., 'PHOENIX-123')"
        }
      },
      required: ["issueIdOrKey"]
    }
  },
  {
    name: "createJiraIssue",
    description: "Create a new Jira issue.",
    inputSchema: {
      type: "object",
      properties: {
        projectKey: {
          type: "string",
          description: "The project key (e.g., 'PHOENIX')"
        },
        issueType: {
          type: "string",
          description: "Type of issue (Initiative, Epic, Feature, Story, Task, Bug, Subtask)"
        },
        summary: {
          type: "string",
          description: "Issue title/summary"
        },
        description: {
          type: "string",
          description: "Issue description (optional)"
        },
        priority: {
          type: "string",
          description: "Priority level (Highest, High, Medium, Low, Lowest)"
        },
        assignee: {
          type: "string",
          description: "Assignee user ID (optional)"
        },
        labels: {
          type: "array",
          items: { type: "string" },
          description: "Labels to apply (optional)"
        },
        parentKey: {
          type: "string",
          description: "Parent issue key for hierarchy (optional)"
        }
      },
      required: ["projectKey", "issueType", "summary"]
    }
  },
  {
    name: "editJiraIssue",
    description: "Update fields on an existing Jira issue.",
    inputSchema: {
      type: "object",
      properties: {
        issueIdOrKey: {
          type: "string",
          description: "The issue ID or key to update"
        },
        fields: {
          type: "object",
          description: "Fields to update (summary, description, priority, assignee, labels, etc.)"
        }
      },
      required: ["issueIdOrKey", "fields"]
    }
  },
  {
    name: "transitionJiraIssue",
    description: "Change the status of an issue using a workflow transition.",
    inputSchema: {
      type: "object",
      properties: {
        issueIdOrKey: {
          type: "string",
          description: "The issue ID or key"
        },
        transitionId: {
          type: "string",
          description: "The transition ID or name (e.g., 'In Progress', 'Done')"
        }
      },
      required: ["issueIdOrKey", "transitionId"]
    }
  },
  
  // Metadata Tools
  {
    name: "getVisibleJiraProjects",
    description: "List all accessible Jira projects.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "getJiraProjectIssueTypesMetadata",
    description: "Get the available issue types for a project.",
    inputSchema: {
      type: "object",
      properties: {
        projectKey: {
          type: "string",
          description: "The project key"
        }
      },
      required: ["projectKey"]
    }
  },
  {
    name: "getJiraIssueTypeMetaWithFields",
    description: "Get field metadata for a specific issue type.",
    inputSchema: {
      type: "object",
      properties: {
        projectKey: {
          type: "string",
          description: "The project key"
        },
        issueTypeId: {
          type: "string",
          description: "The issue type ID or name"
        }
      },
      required: ["projectKey", "issueTypeId"]
    }
  },
  {
    name: "getTransitionsForJiraIssue",
    description: "Get available workflow transitions for an issue.",
    inputSchema: {
      type: "object",
      properties: {
        issueIdOrKey: {
          type: "string",
          description: "The issue ID or key"
        }
      },
      required: ["issueIdOrKey"]
    }
  },
  
  // User & Comment Tools
  {
    name: "lookupJiraAccountId",
    description: "Find users by name or email.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (name or email)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "addCommentToJiraIssue",
    description: "Add a comment to an issue.",
    inputSchema: {
      type: "object",
      properties: {
        issueIdOrKey: {
          type: "string",
          description: "The issue ID or key"
        },
        body: {
          type: "string",
          description: "Comment text"
        }
      },
      required: ["issueIdOrKey", "body"]
    }
  },
  
  // Structure Extension Tools (not in official Atlassian API)
  {
    name: "getJiraIssueHierarchy",
    description: "Get the parent/child hierarchy tree for an issue. (Structure extension)",
    inputSchema: {
      type: "object",
      properties: {
        issueIdOrKey: {
          type: "string",
          description: "The issue ID or key"
        },
        depth: {
          type: "number",
          description: "How many levels deep to retrieve (default: all)"
        }
      },
      required: ["issueIdOrKey"]
    }
  },
  {
    name: "moveJiraIssueInHierarchy",
    description: "Move an issue to a new parent in the hierarchy. (Structure extension)",
    inputSchema: {
      type: "object",
      properties: {
        issueIdOrKey: {
          type: "string",
          description: "The issue ID or key to move"
        },
        newParentKey: {
          type: "string",
          description: "New parent issue key (omit or null to make root-level)"
        }
      },
      required: ["issueIdOrKey"]
    }
  },
  {
    name: "linkJiraIssues",
    description: "Create or remove issue links (blocks, relates to). (Structure extension)",
    inputSchema: {
      type: "object",
      properties: {
        sourceKey: {
          type: "string",
          description: "Source issue key"
        },
        targetKey: {
          type: "string",
          description: "Target issue key"
        },
        linkType: {
          type: "string",
          description: "Link type: 'blocks', 'blocked_by', 'relates_to'"
        },
        action: {
          type: "string",
          description: "'create' or 'remove'"
        }
      },
      required: ["sourceKey", "targetKey", "linkType", "action"]
    }
  }
];

// ============================================================================
// TOOL HANDLERS
// ============================================================================

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "searchJiraIssuesUsingJql": {
      const jql = args.jql as string;
      const maxResults = (args.maxResults as number) || 50;
      const startAt = (args.startAt as number) || 0;
      
      const allResults = searchIssuesWithJQL(jql);
      const paginatedResults = allResults.slice(startAt, startAt + maxResults);
      
      return {
        issues: paginatedResults.map(formatIssueForAPI),
        total: allResults.length,
        startAt,
        maxResults
      };
    }
    
    case "getJiraIssue": {
      const issueIdOrKey = args.issueIdOrKey as string;
      const issue = getIssueByKey(issueIdOrKey);
      
      if (!issue) {
        throw new Error(`Issue not found: ${issueIdOrKey}`);
      }
      
      return { issue: formatIssueForAPI(issue) };
    }
    
    case "createJiraIssue": {
      const projectKey = args.projectKey as string;
      const issueType = args.issueType as string;
      const summary = args.summary as string;
      const description = (args.description as string) || '';
      const priority = (args.priority as string) || 'Medium';
      const assignee = (args.assignee as string) || null;
      const labels = (args.labels as string[]) || [];
      const parentKey = args.parentKey as string | undefined;
      
      // Validate project exists
      const projects = getProjects();
      const project = projects.find(p => p.key === projectKey);
      if (!project) {
        throw new Error(`Project not found: ${projectKey}`);
      }
      
      // Validate issue type
      if (!Object.values(IssueType).includes(issueType as IssueType)) {
        throw new Error(`Invalid issue type: ${issueType}`);
      }
      
      const issues = getIssues();
      const newId = generateIssueId();
      const newKey = generateIssueKey(projectKey);
      const now = new Date().toISOString();
      
      const newIssue: Issue = {
        id: newId,
        key: newKey,
        title: summary,
        description,
        type: issueType as IssueType,
        status: IssueStatus.Todo,
        priority: priority as Priority,
        assignee,
        reporter: 'user-1', // Default reporter
        labels,
        createdAt: now,
        updatedAt: now,
        storyPoints: null,
        sprint: null,
        version: null,
        components: [],
        dueDate: null,
        startDate: null,
        originalEstimate: null,
        timeSpent: null,
        remainingEstimate: null,
        parentId: null,
        childIds: [],
        blockedBy: [],
        blocks: [],
        relatedTo: []
      };
      
      // Handle parent relationship
      if (parentKey) {
        const parent = issues.find(i => i.key === parentKey);
        if (parent) {
          newIssue.parentId = parent.id;
          parent.childIds.push(newId);
        }
      }
      
      issues.push(newIssue);
      saveIssues(issues);
      
      return {
        id: newId,
        key: newKey,
        self: `/api/issues/${newKey}`
      };
    }
    
    case "editJiraIssue": {
      const issueIdOrKey = args.issueIdOrKey as string;
      const fields = args.fields as Record<string, unknown>;
      
      const issues = getIssues();
      const issueIndex = issues.findIndex(i => i.id === issueIdOrKey || i.key === issueIdOrKey);
      
      if (issueIndex === -1) {
        throw new Error(`Issue not found: ${issueIdOrKey}`);
      }
      
      const issue = issues[issueIndex];
      
      // Map API field names to internal names
      const fieldMap: Record<string, keyof Issue> = {
        summary: 'title',
        description: 'description',
        priority: 'priority',
        assignee: 'assignee',
        labels: 'labels',
        storyPoints: 'storyPoints',
        sprint: 'sprint',
        components: 'components',
        dueDate: 'dueDate',
        startDate: 'startDate',
      };
      
      for (const [apiField, value] of Object.entries(fields)) {
        const internalField = fieldMap[apiField] || apiField;
        if (internalField in issue) {
          (issue as unknown as Record<string, unknown>)[internalField] = value;
        }
      }
      
      issue.updatedAt = new Date().toISOString();
      issues[issueIndex] = issue;
      saveIssues(issues);
      
      return { success: true };
    }
    
    case "transitionJiraIssue": {
      const issueIdOrKey = args.issueIdOrKey as string;
      const transitionId = args.transitionId as string;
      
      const issues = getIssues();
      const issue = issues.find(i => i.id === issueIdOrKey || i.key === issueIdOrKey);
      
      if (!issue) {
        throw new Error(`Issue not found: ${issueIdOrKey}`);
      }
      
      // Map transition names to statuses
      const transitionMap: Record<string, IssueStatus> = {
        'to do': IssueStatus.Todo,
        'todo': IssueStatus.Todo,
        'in progress': IssueStatus.InProgress,
        'inprogress': IssueStatus.InProgress,
        'start progress': IssueStatus.InProgress,
        'in review': IssueStatus.InReview,
        'inreview': IssueStatus.InReview,
        'review': IssueStatus.InReview,
        'done': IssueStatus.Done,
        'complete': IssueStatus.Done,
        'resolve': IssueStatus.Done,
      };
      
      const newStatus = transitionMap[transitionId.toLowerCase()];
      if (!newStatus) {
        // Try direct status value
        if (Object.values(IssueStatus).includes(transitionId as IssueStatus)) {
          issue.status = transitionId as IssueStatus;
        } else {
          throw new Error(`Invalid transition: ${transitionId}`);
        }
      } else {
        issue.status = newStatus;
      }
      
      issue.updatedAt = new Date().toISOString();
      saveIssues(issues);
      
      return { success: true };
    }
    
    case "getVisibleJiraProjects": {
      const projects = getProjects();
      return {
        projects: projects.map(p => ({
          id: p.id,
          key: p.key,
          name: p.name,
          description: p.description,
          lead: p.lead
        }))
      };
    }
    
    case "getJiraProjectIssueTypesMetadata": {
      // Return all issue types (this local tool doesn't restrict by project)
      return {
        issueTypes: Object.values(IssueType).map((type, index) => ({
          id: String(index + 1),
          name: type,
          description: `${type} issue type`,
          subtask: type === IssueType.Subtask
        }))
      };
    }
    
    case "getJiraIssueTypeMetaWithFields": {
      // Return standard fields available for all issue types
      return {
        fields: [
          { key: 'summary', name: 'Summary', required: true, type: 'string' },
          { key: 'description', name: 'Description', required: false, type: 'string' },
          { key: 'priority', name: 'Priority', required: false, type: 'priority', allowedValues: Object.values(Priority) },
          { key: 'assignee', name: 'Assignee', required: false, type: 'user' },
          { key: 'labels', name: 'Labels', required: false, type: 'array' },
          { key: 'storyPoints', name: 'Story Points', required: false, type: 'number' },
          { key: 'sprint', name: 'Sprint', required: false, type: 'sprint' },
          { key: 'dueDate', name: 'Due Date', required: false, type: 'date' },
          { key: 'startDate', name: 'Start Date', required: false, type: 'date' },
          { key: 'components', name: 'Components', required: false, type: 'array' },
        ]
      };
    }
    
    case "getTransitionsForJiraIssue": {
      const issueIdOrKey = args.issueIdOrKey as string;
      const issue = getIssueByKey(issueIdOrKey);
      
      if (!issue) {
        throw new Error(`Issue not found: ${issueIdOrKey}`);
      }
      
      // Return available transitions based on current status
      const allTransitions = [
        { id: '1', name: 'To Do', to: { name: 'To Do' } },
        { id: '2', name: 'Start Progress', to: { name: 'In Progress' } },
        { id: '3', name: 'Review', to: { name: 'In Review' } },
        { id: '4', name: 'Done', to: { name: 'Done' } },
      ];
      
      // Filter out current status
      const transitions = allTransitions.filter(t => t.to.name !== issue.status);
      
      return { transitions };
    }
    
    case "lookupJiraAccountId": {
      const query = (args.query as string).toLowerCase();
      const users = getUsers();
      
      const matches = users.filter(u => 
        u.displayName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
      
      return {
        users: matches.map(u => ({
          accountId: u.id,
          displayName: u.displayName,
          emailAddress: u.email,
          avatarUrl: u.avatarUrl
        }))
      };
    }
    
    case "addCommentToJiraIssue": {
      const issueIdOrKey = args.issueIdOrKey as string;
      const body = args.body as string;
      
      const issue = getIssueByKey(issueIdOrKey);
      if (!issue) {
        throw new Error(`Issue not found: ${issueIdOrKey}`);
      }
      
      const now = new Date().toISOString();
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        issueId: issue.id,
        author: 'user-1',
        body,
        created: now,
        updated: now
      };
      
      commentsStore.push(comment);
      
      return {
        id: comment.id,
        created: comment.created
      };
    }
    
    // Structure Extension Tools
    case "getJiraIssueHierarchy": {
      const issueIdOrKey = args.issueIdOrKey as string;
      const depth = args.depth as number | undefined;
      
      const issues = getIssues();
      const issue = issues.find(i => i.id === issueIdOrKey || i.key === issueIdOrKey);
      
      if (!issue) {
        throw new Error(`Issue not found: ${issueIdOrKey}`);
      }
      
      // Get parent
      let parent: Issue | undefined;
      if (issue.parentId) {
        parent = issues.find(i => i.id === issue.parentId);
      }
      
      // Get children recursively
      function getChildrenRecursive(parentId: string, currentDepth: number): Issue[] {
        if (depth !== undefined && currentDepth >= depth) return [];
        
        const children = issues.filter(i => i.parentId === parentId);
        const result: Issue[] = [];
        
        for (const child of children) {
          result.push(child);
          result.push(...getChildrenRecursive(child.id, currentDepth + 1));
        }
        
        return result;
      }
      
      const children = getChildrenRecursive(issue.id, 0);
      
      return {
        issue: formatIssueForAPI(issue),
        parent: parent ? formatIssueForAPI(parent) : null,
        children: children.map(formatIssueForAPI)
      };
    }
    
    case "moveJiraIssueInHierarchy": {
      const issueIdOrKey = args.issueIdOrKey as string;
      const newParentKey = args.newParentKey as string | undefined;
      
      const issues = getIssues();
      const issue = issues.find(i => i.id === issueIdOrKey || i.key === issueIdOrKey);
      
      if (!issue) {
        throw new Error(`Issue not found: ${issueIdOrKey}`);
      }
      
      // Remove from old parent's childIds
      if (issue.parentId) {
        const oldParent = issues.find(i => i.id === issue.parentId);
        if (oldParent) {
          oldParent.childIds = oldParent.childIds.filter(id => id !== issue.id);
        }
      }
      
      // Set new parent
      if (newParentKey) {
        const newParent = issues.find(i => i.key === newParentKey);
        if (!newParent) {
          throw new Error(`Parent issue not found: ${newParentKey}`);
        }
        
        // Prevent circular reference
        function isDescendant(parentId: string, checkId: string): boolean {
          const parent = issues.find(i => i.id === parentId);
          if (!parent) return false;
          if (parent.parentId === checkId) return true;
          if (parent.parentId) return isDescendant(parent.parentId, checkId);
          return false;
        }
        
        if (newParent.id === issue.id || isDescendant(newParent.id, issue.id)) {
          throw new Error('Cannot move issue to its own descendant');
        }
        
        issue.parentId = newParent.id;
        newParent.childIds.push(issue.id);
      } else {
        issue.parentId = null;
      }
      
      issue.updatedAt = new Date().toISOString();
      saveIssues(issues);
      
      return { success: true };
    }
    
    case "linkJiraIssues": {
      const sourceKey = args.sourceKey as string;
      const targetKey = args.targetKey as string;
      const linkType = args.linkType as string;
      const action = args.action as 'create' | 'remove';
      
      const issues = getIssues();
      const source = issues.find(i => i.key === sourceKey);
      const target = issues.find(i => i.key === targetKey);
      
      if (!source) throw new Error(`Source issue not found: ${sourceKey}`);
      if (!target) throw new Error(`Target issue not found: ${targetKey}`);
      
      const linkTypeMap: Record<string, { sourceField: keyof Issue, targetField: keyof Issue }> = {
        'blocks': { sourceField: 'blocks', targetField: 'blockedBy' },
        'blocked_by': { sourceField: 'blockedBy', targetField: 'blocks' },
        'relates_to': { sourceField: 'relatedTo', targetField: 'relatedTo' },
      };
      
      const mapping = linkTypeMap[linkType.toLowerCase()];
      if (!mapping) {
        throw new Error(`Invalid link type: ${linkType}. Valid types: blocks, blocked_by, relates_to`);
      }
      
      const sourceArray = source[mapping.sourceField] as string[];
      const targetArray = target[mapping.targetField] as string[];
      
      if (action === 'create') {
        if (!sourceArray.includes(target.id)) {
          sourceArray.push(target.id);
        }
        if (!targetArray.includes(source.id)) {
          targetArray.push(source.id);
        }
      } else {
        const sourceIndex = sourceArray.indexOf(target.id);
        if (sourceIndex > -1) sourceArray.splice(sourceIndex, 1);
        
        const targetIndex = targetArray.indexOf(source.id);
        if (targetIndex > -1) targetArray.splice(targetIndex, 1);
      }
      
      source.updatedAt = new Date().toISOString();
      target.updatedAt = new Date().toISOString();
      saveIssues(issues);
      
      return { success: true };
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatIssueForAPI(issue: Issue): Record<string, unknown> {
  return {
    id: issue.id,
    key: issue.key,
    fields: {
      summary: issue.title,
      description: issue.description,
      issuetype: { name: issue.type },
      status: { name: issue.status },
      priority: { name: issue.priority },
      assignee: issue.assignee ? { accountId: issue.assignee } : null,
      reporter: { accountId: issue.reporter },
      labels: issue.labels,
      created: issue.createdAt,
      updated: issue.updatedAt,
      customfield_storypoints: issue.storyPoints,
      sprint: issue.sprint,
      parent: issue.parentId ? { id: issue.parentId } : null,
    }
  };
}

// ============================================================================
// SERVER SETUP
// ============================================================================

const server = new Server(
  {
    name: "jira-structure-local",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const result = await handleToolCall(name, args as Record<string, unknown>);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Jira Structure MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
