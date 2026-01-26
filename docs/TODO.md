# Jira Structure Learning Tool — To-Dos

> **Created**: January 26, 2026  
> **Method**: Dylan Davis Three-Document System  
> **Blueprint**: `docs/BLUEPRINT.md`  
> **Status**: Ready to Start

---

## Progress Summary

| Phase | Description | Status | Progress |
|-------|-------------|--------|----------|
| 1 | Project Setup & Core Data Layer | Not Started | 0/4 |
| 2 | State Management & Basic UI Shell | Not Started | 0/3 |
| 3 | Tree View Implementation | Not Started | 0/3 |
| 4 | Kanban Board Implementation | Not Started | 0/3 |
| 5 | Issue Management & Search | Not Started | 0/4 |
| 6 | Bulk Operations, Import/Export & Polish | Not Started | 0/4 |
| 7 | MCP Integration (Future) | Not Started | 0/1 |

**Total Progress: 0/22 steps completed**

---

## Phase 1: Project Setup & Core Data Layer

### Step 1.1: Initialize React + TypeScript + Vite Project
- [ ] Create new Vite project with React-TS template
- [ ] Configure tsconfig.json for strict TypeScript mode
- [ ] Install and configure Tailwind CSS
- [ ] Verify app runs with `npm run dev`
- [ ] **TEST**: Default Vite page displays correctly

### Step 1.2: Define Core TypeScript Types
- [ ] Create src/types/index.ts
- [ ] Define IssueType enum (Initiative, Epic, Feature, Story, Task, Bug, Subtask)
- [ ] Define IssueStatus enum (Todo, InProgress, InReview, Done)
- [ ] Define Priority enum (Highest, High, Medium, Low, Lowest)
- [ ] Define Issue interface with all fields
- [ ] Define Project interface
- [ ] Define Sprint interface
- [ ] Define User interface
- [ ] Define Structure interface
- [ ] **TEST**: TypeScript compiles with no errors

### Step 1.3: Create Data Storage Layer
- [ ] Create src/server/index.ts with Express server
- [ ] Implement GET/PUT endpoints for all JSON files
- [ ] Create /data directory structure
- [ ] Create initial empty JSON files
- [ ] Add CORS support for development
- [ ] Create src/services/api.ts with typed fetch functions
- [ ] **TEST**: Can read/write JSON via API, data persists

### Step 1.4: Create Sample Data
- [ ] Create projects.json with Phoenix Platform project
- [ ] Create users.json with 5 team members
- [ ] Create sprints.json with 5 sprints (3 completed, 1 active, 1 planned)
- [ ] Create issues.json with full hierarchy:
  - [ ] 2 Initiatives
  - [ ] 6 Epics
  - [ ] 15 Stories
  - [ ] 20 Tasks/Subtasks
  - [ ] 8 Bugs
- [ ] Create structures.json with default structure
- [ ] Verify all relationships are valid (parentId/childIds match)
- [ ] **TEST**: Sample data loads correctly

---

## Phase 2: State Management & Basic UI Shell

### Step 2.1: Implement State Management
- [ ] Install Zustand
- [ ] Create IssueStore with state and actions
- [ ] Create ProjectStore with state and actions
- [ ] Create SprintStore with state and actions
- [ ] Create UIStore with state and actions
- [ ] Implement API sync on mutations
- [ ] Add loading and error states
- [ ] **TEST**: State updates reflect in React DevTools

### Step 2.2: Create Application Shell
- [ ] Create AppShell.tsx (main layout)
- [ ] Create Sidebar.tsx (navigation, filters)
- [ ] Create Header.tsx (breadcrumb, search, view toggle)
- [ ] Create MainContent.tsx (view container)
- [ ] Style with Tailwind CSS
- [ ] **TEST**: App displays sidebar and main content, navigation works

### Step 2.3: Create Issue Card Component
- [ ] Create IssueCard.tsx (compact and expanded modes)
- [ ] Create IssueTypeIcon.tsx with icons for each type
- [ ] Create StatusBadge.tsx with colored badges
- [ ] Create PriorityIndicator.tsx with visual indicators
- [ ] Add click handler for selection
- [ ] **TEST**: Issue cards display correctly with all info

---

## Phase 3: Tree View Implementation

### Step 3.1: Create Tree Node Component
- [ ] Create TreeView.tsx (main container)
- [ ] Create TreeNode.tsx (recursive component)
- [ ] Create TreeToolbar.tsx (expand/collapse, filters, sort)
- [ ] Implement indentation based on depth
- [ ] Add expand/collapse chevron
- [ ] Implement keyboard navigation (arrows, Enter)
- [ ] **TEST**: Issues display in correct hierarchy, expand/collapse works

### Step 3.2: Implement Drag-and-Drop for Tree
- [ ] Install @dnd-kit/core and related packages
- [ ] Update TreeView with DndContext
- [ ] Make TreeNode draggable and droppable
- [ ] Create treeOperations.ts utility
- [ ] Prevent invalid moves (circular references)
- [ ] Add moveIssue action to IssueStore
- [ ] **TEST**: Can drag issues to new parents, hierarchy updates, data persists

### Step 3.3: Add Relationship Visualization
- [ ] Create RelationshipLines.tsx (SVG overlay)
- [ ] Add blocked/blocking indicators to TreeNode
- [ ] Create RelationshipTooltip.tsx
- [ ] Add toggle to show/hide relationship lines
- [ ] **TEST**: Dependency lines show correctly, blocked items visually distinct

---

## Phase 4: Kanban Board Implementation

### Step 4.1: Create Kanban Board Structure
- [ ] Create KanbanBoard.tsx (main container)
- [ ] Create KanbanColumn.tsx (status column)
- [ ] Create KanbanCard.tsx (card variant)
- [ ] Create KanbanToolbar.tsx (filters, grouping)
- [ ] Style columns with status colors
- [ ] **TEST**: Board displays columns, issues in correct columns

### Step 4.2: Implement Kanban Drag-and-Drop
- [ ] Add DndContext to KanbanBoard
- [ ] Make KanbanColumn droppable
- [ ] Make KanbanCard draggable
- [ ] Add updateIssueStatus action
- [ ] Implement optimistic updates
- [ ] Add smooth transition animations
- [ ] **TEST**: Can drag cards between columns, status updates, data persists

### Step 4.3: Add Swimlanes (Grouping)
- [ ] Add groupBy state to KanbanBoard
- [ ] Create KanbanSwimlane.tsx
- [ ] Update KanbanToolbar with group dropdown
- [ ] Implement collapsible swimlane headers
- [ ] Handle cross-swimlane drag (update grouped field)
- [ ] **TEST**: Can group by assignee/epic, swimlanes display correctly

---

## Phase 5: Issue Management & Search

### Step 5.1: Create Issue Detail Panel
- [ ] Create IssueDetailPanel.tsx (slide-out panel)
- [ ] Create IssueDetailsTab.tsx with all fields
- [ ] Implement inline editing for title
- [ ] Add markdown editor for description
- [ ] Create field grid with all standard fields
- [ ] Implement auto-save on blur/change
- [ ] Add delete issue with confirmation
- [ ] **TEST**: Can view and edit all fields, changes persist

### Step 5.2: Create Issue Relationships Tab
- [ ] Create IssueRelationshipsTab.tsx
- [ ] Implement Parent section with change/remove
- [ ] Implement Children section with add/remove
- [ ] Implement Blocks/Blocked By sections
- [ ] Implement Related To section
- [ ] Create IssuePicker.tsx modal
- [ ] **TEST**: Can view and manage all relationship types

### Step 5.3: Implement Create Issue Flow
- [ ] Create CreateIssueModal.tsx
- [ ] Add quick create from sidebar
- [ ] Add quick create from tree (sibling/child)
- [ ] Add quick create from Kanban column
- [ ] Implement createIssue action with key generation
- [ ] Auto-select and highlight new issue
- [ ] **TEST**: Can create issues at any level, validation works

### Step 5.4: Implement JQL-like Search
- [ ] Create jqlParser.ts (query to AST)
- [ ] Create jqlEvaluator.ts (evaluate against issues)
- [ ] Create SearchBar.tsx with syntax highlighting
- [ ] Add autocomplete suggestions
- [ ] Create SearchResults.tsx
- [ ] Save recent searches to localStorage
- [ ] **TEST**: JQL syntax works, results accurate, handles invalid queries

---

## Phase 6: Bulk Operations, Import/Export & Polish

### Step 6.1: Implement Bulk Editing
- [ ] Add checkboxes to issue cards
- [ ] Implement shift+click range selection
- [ ] Implement ctrl/cmd+click toggle selection
- [ ] Create BulkActionBar.tsx
- [ ] Create BulkEditModal.tsx
- [ ] Implement bulkUpdateIssues action
- [ ] Implement bulkDeleteIssues action
- [ ] Create BulkMoveModal.tsx
- [ ] **TEST**: Can select multiple, bulk actions update all selected

### Step 6.2: Implement Import/Export
- [ ] Create exportData.ts (JSON and CSV)
- [ ] Create importData.ts (parse and validate)
- [ ] Create ExportModal.tsx with format selection
- [ ] Create ImportModal.tsx with file upload
- [ ] Add conflict handling options
- [ ] Add import progress and results summary
- [ ] **TEST**: Export produces valid files, import restores correctly

### Step 6.3: Add Filtering UI
- [ ] Create FilterPanel.tsx
- [ ] Create filter components for each field type
- [ ] Update UIStore with filter state
- [ ] Create filterIssues.ts utility
- [ ] Create SavedFilters.tsx
- [ ] Apply filters to Tree and Kanban views
- [ ] **TEST**: Filters work correctly, can combine multiple filters

### Step 6.4: Final Polish & Build Setup
- [ ] Update package.json scripts (dev, build, start, preview)
- [ ] Create production Express server configuration
- [ ] Add loading spinners and skeletons
- [ ] Add error boundaries
- [ ] Add toast notifications
- [ ] Create keyboard shortcuts help modal
- [ ] Add empty states with helpful messages
- [ ] Create start.sh for Mac/Linux
- [ ] Create start.bat for Windows
- [ ] Write comprehensive README.md
- [ ] Test full build and distribution
- [ ] **TEST**: App builds successfully, runs from built files

---

## Phase 7 (Future): MCP Integration

### Step 7.1: Create MCP Server
- [ ] Install @modelcontextprotocol/sdk
- [ ] Create src/mcp/server.ts
- [ ] Connect to JSON data files
- [ ] Implement MCP tools:
  - [ ] list_projects
  - [ ] get_issue
  - [ ] search_issues
  - [ ] create_issue
  - [ ] update_issue
  - [ ] delete_issue
  - [ ] move_issue
  - [ ] link_issues
  - [ ] unlink_issues
  - [ ] get_structure
- [ ] Implement MCP resources
- [ ] Add mcp script to package.json
- [ ] Document MCP setup
- [ ] **TEST**: MCP server works with Claude Desktop / Cursor

---

## Notes & Lessons Learned

> Add lessons learned during development here to prevent future mistakes.

### Lesson Template
```
**Issue**: [Description of the problem]
**Cause**: [Root cause]
**Solution**: [How it was fixed]
**Prevention**: [How to avoid in future]
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | Claude (Opus 4.5) | Initial to-dos from blueprint |
