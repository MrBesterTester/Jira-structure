# Jira Structure Learning Tool — Blueprint Document

> **Created**: January 26, 2026  
> **Method**: Dylan Davis Three-Document System  
> **Specification**: `docs/SPECIFICATION.md`  
> **Status**: Ready for Implementation

---

## Overview

This blueprint breaks down the Jira Structure Learning Tool into **6 phases**, each containing **iterative, testable steps**. Each step includes an embedded prompt ready to copy/paste for code generation.

**Estimated Total Build Time**: 4-6 sessions (following one phase per session)

---

## Phase 1: Project Setup & Core Data Layer

**Goal**: Establish project structure, TypeScript configuration, and core data models.

### Step 1.1: Initialize React + TypeScript + Vite Project

**Test**: Project runs with `npm run dev`, shows default Vite page.

```
PROMPT:
Create a new React project with Vite and strict TypeScript:
1. Initialize with: npm create vite@latest jira-structure-app -- --template react-ts
2. Configure tsconfig.json for strict mode (strict: true, noImplicitAny: true, strictNullChecks: true)
3. Install dependencies: npm install
4. Add Tailwind CSS with: npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
5. Configure Tailwind in tailwind.config.js and add directives to index.css
6. Verify the app runs with npm run dev
```

### Step 1.2: Define Core TypeScript Types

**Test**: TypeScript compiles with no errors. Types are importable across the app.

```
PROMPT:
Create a comprehensive types file at src/types/index.ts with strict TypeScript types for:

1. IssueType enum: Initiative, Epic, Feature, Story, Task, Bug, Subtask
2. IssueStatus enum: Todo, InProgress, InReview, Done
3. Priority enum: Highest, High, Medium, Low, Lowest

4. Issue interface with ALL fields from the specification:
   - id, key, title, description, type, status, priority
   - assignee, reporter, labels (string array)
   - createdAt, updatedAt (ISO date strings)
   - storyPoints, sprint, sprintStartDate, sprintEndDate
   - version, component (string array), dueDate, startDate
   - originalEstimate, timeSpent, remainingEstimate (numbers for hours)
   - parentId (string | null), childIds (string array)
   - blockedBy, blocks, relatedTo (string arrays)

5. Project interface: id, key, name, description, lead, createdAt

6. Sprint interface: id, name, projectId, startDate, endDate, status (planned/active/completed), goalDescription

7. User interface: id, displayName, email, avatarUrl

8. Structure interface: id, name, projectId, rootIssueIds (string array)

Use strict typing - no 'any' types allowed. Export all types.
```

### Step 1.3: Create Data Storage Layer

**Test**: Can read/write JSON files via API. Data persists across server restarts.

```
PROMPT:
Create a minimal Express server (src/server/index.ts) that:

1. Serves static files from the React build directory
2. Provides REST API endpoints for JSON file operations:
   - GET /api/projects - read projects.json
   - PUT /api/projects - write projects.json
   - GET /api/issues - read issues.json
   - PUT /api/issues - write issues.json
   - GET /api/sprints - read sprints.json
   - PUT /api/sprints - write sprints.json
   - GET /api/users - read users.json
   - PUT /api/users - write users.json
   - GET /api/structures - read structures.json
   - PUT /api/structures - write structures.json

3. Store data in /data directory at project root
4. Create initial empty JSON files if they don't exist
5. Use proper error handling and TypeScript throughout
6. Add CORS support for development mode

Also create a src/services/api.ts with typed fetch functions for each endpoint.
```

### Step 1.4: Create Sample Data

**Test**: Sample data loads correctly. All relationships are valid.

```
PROMPT:
Create realistic sample data for the "Phoenix Platform" project in the /data directory:

1. projects.json: One project "Phoenix Platform" (key: PHOENIX)

2. users.json: 5 team members with realistic names and roles

3. sprints.json: 
   - Sprint 1-3: completed
   - Sprint 4: active (current)
   - Sprint 5: planned (future)

4. issues.json: Create a comprehensive dataset with:
   - 2 Initiatives (high-level product goals)
   - 6 Epics (major features)
   - 15 Stories with realistic titles/descriptions
   - 20 Tasks and Subtasks
   - 8 Bugs (various priorities)
   
   Ensure:
   - Proper parent-child relationships (parentId/childIds match)
   - Some blocker relationships (5-10)
   - Various statuses distributed realistically
   - Assigned to different team members
   - Spread across sprints
   - Story points on stories (1, 2, 3, 5, 8, 13)
   
5. structures.json: One default structure showing the full hierarchy

Use the Phoenix Platform theme: authentication system, dashboard, API, notifications, etc.
All data must match the TypeScript types exactly.
```

---

## Phase 2: State Management & Basic UI Shell

**Goal**: Set up state management and create the application shell with navigation.

### Step 2.1: Implement State Management

**Test**: State updates reflect in React DevTools. Data syncs with API.

```
PROMPT:
Set up Zustand for state management in src/store/index.ts:

1. Create an IssueStore with:
   - issues: Issue[] state
   - loading, error states
   - Actions: fetchIssues, createIssue, updateIssue, deleteIssue, bulkUpdateIssues
   - Selectors: getIssueById, getIssuesByParentId, getRootIssues, getIssuesByStatus

2. Create a ProjectStore with:
   - projects, currentProjectId
   - Actions: fetchProjects, setCurrentProject

3. Create a SprintStore with:
   - sprints, activeSprint
   - Actions: fetchSprints, getSprintById, getActiveSprin

4. Create a UIStore with:
   - currentView: 'tree' | 'kanban'
   - selectedIssueIds: string[]
   - expandedIssueIds: string[]
   - filters: FilterState
   - Actions: setView, toggleIssueSelection, toggleIssueExpanded, setFilters, clearFilters

5. All stores should sync with the API service on mutations
6. Use TypeScript strict mode throughout
7. Include proper loading and error handling states
```

### Step 2.2: Create Application Shell

**Test**: App displays sidebar and main content area. Navigation works.

```
PROMPT:
Create the main application shell with these components:

1. src/components/Layout/AppShell.tsx
   - Full-height layout with sidebar and main content
   - Responsive sidebar (collapsible on smaller screens)

2. src/components/Layout/Sidebar.tsx
   - Project selector dropdown at top
   - Navigation links: Structure, Backlog, Active Sprint, Board
   - Filters section (collapsible)
   - "Create Issue" button

3. src/components/Layout/Header.tsx
   - Breadcrumb navigation
   - Search bar (placeholder for now)
   - View toggle buttons (Tree/Kanban)

4. src/components/Layout/MainContent.tsx
   - Container for the current view
   - Renders Tree or Kanban based on UIStore.currentView

5. Use Tailwind CSS for styling
6. Design should be clean and similar to Jira's layout concepts
7. Include proper TypeScript props for all components
```

### Step 2.3: Create Issue Card Component

**Test**: Issue cards display correctly with all key information.

```
PROMPT:
Create reusable issue display components:

1. src/components/Issue/IssueCard.tsx
   - Displays: key, title, type icon, status badge, priority indicator
   - Shows: assignee avatar, story points (if set)
   - Compact mode for tree view, expanded mode for kanban
   - Click handler for selection
   - Visual indicator when selected

2. src/components/Issue/IssueTypeIcon.tsx
   - Different icons for each issue type (use emoji or simple SVG)
   - Color-coded by type

3. src/components/Issue/StatusBadge.tsx
   - Colored badge showing status
   - To Do: gray, In Progress: blue, In Review: yellow, Done: green

4. src/components/Issue/PriorityIndicator.tsx
   - Visual priority indicator (arrows or colored dots)
   - Highest: red ↑↑, High: orange ↑, Medium: yellow -, Low: blue ↓, Lowest: gray ↓↓

5. All components strictly typed with proper interfaces
```

---

## Phase 3: Tree View Implementation

**Goal**: Build the interactive tree/outline view for hierarchy visualization.

### Step 3.1: Create Tree Node Component

**Test**: Issues display in correct hierarchy. Expand/collapse works.

```
PROMPT:
Create the tree view components:

1. src/components/Tree/TreeView.tsx
   - Main container for tree display
   - Fetches and displays root-level issues
   - Handles expand/collapse all functionality
   - Shows loading and empty states

2. src/components/Tree/TreeNode.tsx
   - Recursive component for each issue in tree
   - Props: issue, depth level, isExpanded
   - Indentation based on depth (24px per level)
   - Expand/collapse chevron (only if has children)
   - Renders IssueCard in compact mode
   - Recursively renders children when expanded
   - Drag handle for reordering (implement drag later)

3. src/components/Tree/TreeToolbar.tsx
   - Expand all / Collapse all buttons
   - Filter quick toggles (show/hide by type)
   - Sort dropdown (by priority, status, created date)

4. Keyboard navigation:
   - Arrow up/down to move selection
   - Arrow right to expand
   - Arrow left to collapse
   - Enter to open issue detail

5. Use proper TypeScript and memoization for performance
```

### Step 3.2: Implement Drag-and-Drop for Tree

**Test**: Can drag issues to new parents. Hierarchy updates correctly. Data persists.

```
PROMPT:
Add drag-and-drop to the tree view using @dnd-kit/core:

1. Install: npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

2. Update TreeView.tsx:
   - Wrap with DndContext
   - Handle onDragEnd to update issue parent
   - Visual feedback during drag

3. Update TreeNode.tsx:
   - Make draggable with useDraggable hook
   - Make droppable with useDroppable hook
   - Show drop indicator when dragging over
   - Prevent dropping on own children (circular reference)

4. Create src/utils/treeOperations.ts:
   - moveIssue(issueId, newParentId): updates parent-child relationships
   - reorderChildren(parentId, orderedChildIds): reorder siblings
   - validateMove(issueId, targetParentId): check for valid moves

5. Update IssueStore:
   - Add moveIssue action that calls API and updates state
   - Maintain childIds order

6. Ensure data integrity: when moving, update both old parent's childIds and new parent's childIds
```

### Step 3.3: Add Relationship Visualization

**Test**: Dependency lines show correctly. Blocked items are visually distinct.

```
PROMPT:
Add relationship visualization to the tree view:

1. src/components/Tree/RelationshipLines.tsx
   - SVG overlay component for drawing relationship lines
   - Draw lines between blocked/blocking issues
   - Different line styles: solid for blocks, dashed for related

2. Update TreeNode.tsx:
   - Show "blocked" indicator if issue has blockedBy entries
   - Show "blocking" indicator if issue has blocks entries
   - Tooltip showing what's blocking/blocked

3. src/components/Tree/RelationshipTooltip.tsx
   - Hover tooltip showing all relationships for an issue
   - Click to navigate to related issue

4. Add toggle in TreeToolbar to show/hide relationship lines

5. Color coding:
   - Red line: blocker relationship
   - Gray dashed line: related to
   
6. Performance: only render visible relationship lines
```

---

## Phase 4: Kanban Board Implementation

**Goal**: Build the Kanban board view with drag-and-drop status changes.

### Step 4.1: Create Kanban Board Structure

**Test**: Board displays columns for each status. Issues appear in correct columns.

```
PROMPT:
Create the Kanban board components:

1. src/components/Kanban/KanbanBoard.tsx
   - Main container with horizontal scroll
   - Displays columns for each status: To Do, In Progress, In Review, Done
   - Column headers with issue count
   - Fetches issues and groups by status

2. src/components/Kanban/KanbanColumn.tsx
   - Single column component
   - Props: status, issues, onDrop
   - Header with status name, count, color indicator
   - Scrollable card container
   - Empty state when no issues

3. src/components/Kanban/KanbanCard.tsx
   - Card variant of IssueCard for Kanban display
   - Shows: key, title, type, priority, assignee
   - Parent breadcrumb (if has parent)
   - Story points badge

4. src/components/Kanban/KanbanToolbar.tsx
   - Filter by assignee dropdown
   - Filter by epic/parent dropdown
   - Group by toggle (none, assignee, priority)

5. Style columns with distinct header colors matching status
6. Proper TypeScript throughout
```

### Step 4.2: Implement Kanban Drag-and-Drop

**Test**: Can drag cards between columns. Status updates correctly. Data persists.

```
PROMPT:
Add drag-and-drop to Kanban board:

1. Update KanbanBoard.tsx:
   - Wrap with DndContext from @dnd-kit/core
   - Handle onDragEnd to update issue status
   - Show placeholder in source column while dragging

2. Update KanbanColumn.tsx:
   - Use useDroppable hook
   - Visual feedback when card is dragged over
   - Highlight valid drop zone

3. Update KanbanCard.tsx:
   - Use useDraggable hook
   - Show drag preview
   - Dim original card while dragging

4. Create transition animation:
   - Smooth card movement on drop
   - Status badge updates with animation

5. Update IssueStore:
   - updateIssueStatus action
   - Optimistic update (immediate UI change, then API call)
   - Rollback on API failure

6. Maintain card order within columns (optional: persist order)
```

### Step 4.3: Add Swimlanes (Grouping)

**Test**: Can group by assignee or epic. Swimlanes display correctly.

```
PROMPT:
Add swimlane support to Kanban board:

1. Update KanbanBoard.tsx:
   - Add groupBy state: 'none' | 'assignee' | 'epic' | 'priority'
   - Group issues by selected field
   - Render KanbanSwimlane for each group

2. src/components/Kanban/KanbanSwimlane.tsx
   - Horizontal row containing all status columns for one group
   - Collapsible header with group name and issue count
   - All columns are drop zones within the swimlane

3. Update KanbanToolbar.tsx:
   - Group by dropdown with options
   - Clear grouping button

4. Visual design:
   - Swimlane headers span full width
   - Alternating background colors for swimlanes
   - Collapse/expand animation

5. Maintain drag-and-drop across swimlanes:
   - Moving card to different swimlane should update the grouped field
   - e.g., moving from "John's" swimlane to "Jane's" updates assignee
```

---

## Phase 5: Issue Management & Search

**Goal**: Implement issue CRUD operations, detail view, and JQL-like search.

### Step 5.1: Create Issue Detail Panel

**Test**: Can view and edit all issue fields. Changes persist correctly.

```
PROMPT:
Create the issue detail view:

1. src/components/Issue/IssueDetailPanel.tsx
   - Slide-out panel from right side (60% width)
   - Header: issue key, type icon, close button
   - Tabbed content: Details, Relationships, Activity

2. Details Tab - src/components/Issue/IssueDetailsTab.tsx
   - Editable title (inline edit)
   - Description with markdown editor (use react-markdown or similar)
   - Field grid layout:
     - Status dropdown
     - Priority dropdown
     - Assignee dropdown
     - Reporter (read-only)
     - Sprint dropdown
     - Story points input
     - Labels tag input
     - Version dropdown
     - Component multi-select
     - Dates: start date, due date (date pickers)
     - Time tracking: original estimate, time spent, remaining

3. All fields should save on blur/change
4. Show loading indicator during save
5. Validation: required fields, number formats

6. Add "Delete Issue" button with confirmation modal
```

### Step 5.2: Create Issue Relationships Tab

**Test**: Can view and manage all relationship types. Links work correctly.

```
PROMPT:
Create the relationships management:

1. src/components/Issue/IssueRelationshipsTab.tsx
   - Sections: Parent, Children, Blocks, Blocked By, Related To
   - Each section shows linked issues with clickable links

2. Parent section:
   - Shows current parent (if any)
   - "Change Parent" button opens picker modal
   - "Remove Parent" button (makes issue root-level)

3. Children section:
   - List of child issues
   - "Add Child" button to create new issue as child
   - Each child has "Remove" action (moves to root)

4. Blocks/Blocked By sections:
   - List of blocking relationships
   - "Add Blocker" button opens issue picker
   - Remove blocker button on each item

5. Related To section:
   - List of related issues (non-directional)
   - "Link Issue" button opens picker
   - Remove link button

6. src/components/Issue/IssuePicker.tsx
   - Modal for selecting issues
   - Search/filter capability
   - Exclude current issue and invalid targets
   - Returns selected issue ID
```

### Step 5.3: Implement Create Issue Flow

**Test**: Can create issues at any level. Required fields validate. Issue appears correctly.

```
PROMPT:
Create the new issue flow:

1. src/components/Issue/CreateIssueModal.tsx
   - Modal dialog for creating new issues
   - Fields: type, title, description (required)
   - Optional: parent, sprint, assignee, priority, story points
   - Create button validates and submits
   - Cancel button closes without saving

2. Quick create options:
   - "Create Issue" in sidebar opens modal with no parent
   - "Add Child" from issue detail pre-fills parent
   - "+" button in tree view creates sibling at that level
   - "+" button in Kanban column creates issue with that status

3. Update IssueStore:
   - createIssue action generates unique key (PROJECT-###)
   - Sets createdAt, updatedAt, reporter
   - Updates parent's childIds if parentId is set
   - Syncs to API

4. After creation:
   - Close modal
   - Select and highlight new issue
   - Expand parent in tree view to show new child
```

### Step 5.4: Implement JQL-like Search

**Test**: Search syntax works correctly. Results are accurate. Handles invalid queries gracefully.

```
PROMPT:
Implement JQL-like search functionality:

1. src/utils/jqlParser.ts
   - Parse JQL query string into AST
   - Support operators: =, !=, >, <, >=, <=, ~ (contains), IN, NOT IN
   - Support fields: type, status, priority, assignee, sprint, labels, etc.
   - Support boolean: AND, OR, NOT (AND has higher precedence)
   - Support parentheses for grouping
   - Return parse errors with position info

2. src/utils/jqlEvaluator.ts
   - Evaluate parsed query against Issue array
   - Return matching issues
   - Handle type coercion (string comparisons, date comparisons)
   - Case-insensitive string matching

3. src/components/Search/SearchBar.tsx
   - Input field with JQL syntax
   - Real-time syntax highlighting (valid: green, error: red)
   - Autocomplete suggestions for field names and values
   - Error message display below input
   - "Search" button and Enter key trigger

4. src/components/Search/SearchResults.tsx
   - Display matching issues in list format
   - Show match count
   - Click to navigate to issue
   - "Clear" button to reset

5. Example queries to support:
   - type = Bug AND priority = High
   - assignee = "John Doe" AND status != Done
   - labels ~ "frontend" OR labels ~ "ui"
   - sprint IN ("Sprint 4", "Sprint 5")
   - storyPoints > 5 AND status = "In Progress"

6. Save recent searches in localStorage
```

---

## Phase 6: Bulk Operations, Import/Export & Polish

**Goal**: Complete feature set with bulk editing, data portability, and UI polish.

### Step 6.1: Implement Bulk Editing

**Test**: Can select multiple issues. Bulk actions update all selected. Data persists.

```
PROMPT:
Add bulk editing capabilities:

1. Update issue selection in Tree and Kanban views:
   - Checkbox on each issue card
   - Shift+click for range selection
   - Ctrl/Cmd+click for toggle selection
   - "Select All" / "Deselect All" in toolbar

2. src/components/BulkActions/BulkActionBar.tsx
   - Appears when issues are selected
   - Shows count: "X issues selected"
   - Action buttons: Change Status, Change Assignee, Change Priority, Add Labels, Move to Sprint, Delete

3. src/components/BulkActions/BulkEditModal.tsx
   - Modal for bulk field updates
   - Dropdown/input for new value
   - Preview of affected issues
   - "Apply to X issues" button

4. Update IssueStore:
   - bulkUpdateIssues(issueIds, updates) action
   - bulkDeleteIssues(issueIds) action with confirmation
   - Optimistic updates with rollback

5. src/components/BulkActions/BulkMoveModal.tsx
   - Change parent for all selected issues
   - Warning if issues have different current parents
```

### Step 6.2: Implement Import/Export

**Test**: Export produces valid JSON/CSV. Import restores data correctly. Handles errors.

```
PROMPT:
Add import/export functionality:

1. src/utils/exportData.ts
   - exportToJSON(): returns full data structure (all JSON files combined)
   - exportToCSV(): returns flat CSV with one row per issue
   - Download file helper function

2. src/utils/importData.ts
   - importFromJSON(file): parse and validate JSON structure
   - importFromCSV(file): parse CSV, create issues (basic fields only)
   - Validation: check required fields, valid relationships
   - Return import report: success count, error count, error details

3. src/components/ImportExport/ExportModal.tsx
   - Format selection: JSON (full) or CSV (issues only)
   - Optional: select which projects/data to export
   - Download button generates file

4. src/components/ImportExport/ImportModal.tsx
   - File upload dropzone
   - Format auto-detection
   - Preview of data to import
   - Conflict handling: skip, overwrite, create new
   - Progress indicator for large imports
   - Results summary

5. Add Import/Export buttons to sidebar or settings menu
```

### Step 6.3: Add Filtering UI

**Test**: Filters work correctly. Can combine multiple filters. Clear filters resets view.

```
PROMPT:
Create comprehensive filtering UI:

1. src/components/Filters/FilterPanel.tsx
   - Expandable panel in sidebar
   - Active filter count badge
   - Clear all filters button

2. Individual filter components:
   - FilterByType.tsx: checkboxes for each type
   - FilterByStatus.tsx: checkboxes for each status
   - FilterByPriority.tsx: checkboxes for each priority
   - FilterByAssignee.tsx: dropdown with team members
   - FilterBySprint.tsx: dropdown with sprints
   - FilterByLabels.tsx: tag input for label matching
   - FilterByParent.tsx: issue picker for "children of"

3. Update UIStore:
   - filters state object with all filter criteria
   - setFilter(field, value) action
   - clearFilters() action

4. Create src/utils/filterIssues.ts
   - filterIssues(issues, filters): apply all active filters
   - Return filtered array

5. src/components/Filters/SavedFilters.tsx
   - Save current filter combination with name
   - Load saved filter
   - Delete saved filter
   - Store in localStorage

6. Apply filters to both Tree and Kanban views
```

### Step 6.4: Final Polish & Build Setup

**Test**: App builds successfully. Runs from built files. Package is ready for distribution.

```
PROMPT:
Final polish and build configuration:

1. Update package.json scripts:
   - "dev": runs both React dev server and Express API
   - "build": builds React app for production
   - "start": serves built app + API (for distribution)
   - "preview": test production build locally

2. Create production Express server:
   - Serves built React files from /dist
   - API endpoints for JSON data
   - Single entry point

3. UI Polish:
   - Loading spinners/skeletons where appropriate
   - Error boundaries with friendly messages
   - Toast notifications for actions (save success, errors)
   - Keyboard shortcuts help modal
   - Empty states with helpful messages

4. Create start scripts:
   - start.sh (Mac/Linux)
   - start.bat (Windows)
   - Both: check Node.js, install deps if needed, run app

5. Update README.md with:
   - Project description
   - Prerequisites (Node.js 18+)
   - Quick start instructions
   - Available features
   - Keyboard shortcuts
   - Troubleshooting

6. Test full build and distribution:
   - Build the app
   - Copy to fresh directory
   - Run start script
   - Verify all features work
```

---

## Phase 7 (Future): MCP Integration

**Goal**: Add Model Context Protocol server for AI interaction.

> Note: This phase is for after the core app is complete.

### Step 7.1: Create MCP Server

```
PROMPT:
Create an MCP server for the Jira Structure tool:

1. Create src/mcp/server.ts using @modelcontextprotocol/sdk
2. Connect to the same JSON data files as the web app

3. Implement MCP tools:
   - list_projects: Get all projects
   - get_issue: Get issue by key
   - search_issues: JQL search
   - create_issue: Create new issue
   - update_issue: Update issue fields
   - delete_issue: Delete issue
   - move_issue: Change parent
   - link_issues: Create relationship
   - unlink_issues: Remove relationship
   - get_structure: Get full hierarchy tree

4. Implement MCP resources:
   - jira://projects - list of projects
   - jira://issues/{key} - individual issue
   - jira://structure/{projectKey} - project structure

5. Add to package.json scripts: "mcp": starts MCP server
6. Document MCP setup for Claude Desktop / Cursor
```

---

## Appendix: File Structure

```
jira-structure-app/
├── data/                      # JSON data files
│   ├── projects.json
│   ├── issues.json
│   ├── sprints.json
│   ├── users.json
│   └── structures.json
├── src/
│   ├── components/
│   │   ├── Layout/           # App shell components
│   │   ├── Tree/             # Tree view components
│   │   ├── Kanban/           # Kanban board components
│   │   ├── Issue/            # Issue-related components
│   │   ├── Filters/          # Filter components
│   │   ├── Search/           # Search components
│   │   ├── BulkActions/      # Bulk operation components
│   │   └── ImportExport/     # Import/export components
│   ├── store/                # Zustand stores
│   ├── services/             # API service layer
│   ├── utils/                # Utility functions
│   ├── types/                # TypeScript types
│   ├── server/               # Express server
│   ├── mcp/                  # MCP server (Phase 7)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── start.sh
├── start.bat
└── README.md
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | Claude (Opus 4.5) | Initial blueprint from specification |
