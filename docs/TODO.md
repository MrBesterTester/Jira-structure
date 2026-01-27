# Jira Structure Learning Tool — To-Dos

> **Created**: January 26, 2026  
> **Method**: Dylan Davis Three-Document System  
> **Blueprint**: `docs/BLUEPRINT.md`  
> **Status**: Ready to Start

---

## Progress Summary

| Phase | Description | Status | Progress |
|-------|-------------|--------|----------|
| 1 | Project Setup & Core Data Layer | Complete | 4/4 |
| 2 | State Management & Basic UI Shell | Complete | 3/3 |
| 3 | Tree View Implementation | Complete | 3/3 |
| 4 | Kanban Board Implementation | In Progress | 2/3 |
| 5 | Issue Management & Search | Not Started | 0/4 |
| 6 | Bulk Operations, Import/Export & Polish | Not Started | 0/4 |
| 7 | MCP Integration (Atlassian-Compatible) | Not Started | 0/3 |

**Total Progress: 12/24 steps completed**

---

## Phase 1: Project Setup & Core Data Layer

### Step 1.1: Initialize React + TypeScript + Vite Project
- [x] Create new Vite project with React-TS template
- [x] Configure tsconfig.json for strict TypeScript mode
- [x] Install and configure Tailwind CSS
- [x] Verify app runs with `npm run dev`
- [x] **TEST**: Default Vite page displays correctly

### Step 1.2: Define Core TypeScript Types
- [x] Create src/types/index.ts
- [x] Define IssueType enum (Initiative, Epic, Feature, Story, Task, Bug, Subtask)
- [x] Define IssueStatus enum (Todo, InProgress, InReview, Done)
- [x] Define Priority enum (Highest, High, Medium, Low, Lowest)
- [x] Define Issue interface with all fields
- [x] Define Project interface
- [x] Define Sprint interface
- [x] Define User interface
- [x] Define Structure interface
- [x] **TEST**: TypeScript compiles with no errors

### Step 1.3: Create Data Storage Layer
- [x] Create src/server/index.ts with Express server
- [x] Implement GET/PUT endpoints for all JSON files
- [x] Create /data directory structure
- [x] Create initial empty JSON files
- [x] Add CORS support for development
- [x] Create src/services/api.ts with typed fetch functions
- [x] **TEST**: Can read/write JSON via API, data persists

### Step 1.4: Create Sample Data
- [x] Create projects.json with Phoenix Platform project
- [x] Create users.json with 5 team members
- [x] Create sprints.json with 5 sprints (3 completed, 1 active, 1 planned)
- [x] Create issues.json with full hierarchy:
  - [x] 2 Initiatives
  - [x] 6 Epics
  - [x] 15 Stories
  - [x] 22 Tasks/Subtasks
  - [x] 8 Bugs
- [x] Create structures.json with default structure
- [x] Verify all relationships are valid (parentId/childIds match)
- [x] **TEST**: Sample data loads correctly

---

## Phase 2: State Management & Basic UI Shell

### Step 2.1: Implement State Management
- [x] Install Zustand
- [x] Create IssueStore with state and actions
- [x] Create ProjectStore with state and actions
- [x] Create SprintStore with state and actions
- [x] Create UIStore with state and actions
- [x] Implement API sync on mutations
- [x] Add loading and error states
- [x] **TEST**: State updates reflect in React DevTools

### Step 2.2: Create Application Shell
- [x] Create AppShell.tsx (main layout)
- [x] Create Sidebar.tsx (navigation, filters)
- [x] Create Header.tsx (breadcrumb, search, view toggle)
- [x] Create MainContent.tsx (view container)
- [x] Style with Tailwind CSS
- [x] **TEST**: App displays sidebar and main content, navigation works

### Step 2.3: Create Issue Card Component
- [x] Create IssueCard.tsx (compact and expanded modes)
- [x] Create IssueTypeIcon.tsx with icons for each type
- [x] Create StatusBadge.tsx with colored badges
- [x] Create PriorityIndicator.tsx with visual indicators
- [x] Add click handler for selection
- [x] **TEST**: Issue cards display correctly with all info

---

## Phase 3: Tree View Implementation

### Step 3.1: Create Tree Node Component
- [x] Create TreeView.tsx (main container)
- [x] Create TreeNode.tsx (recursive component)
- [x] Create TreeToolbar.tsx (expand/collapse, filters, sort)
- [x] Implement indentation based on depth
- [x] Add expand/collapse chevron
- [x] Implement keyboard navigation (arrows, Enter)
- [x] **TEST**: Issues display in correct hierarchy, expand/collapse works

### Step 3.2: Implement Drag-and-Drop for Tree
- [x] Install @dnd-kit/core and related packages
- [x] Update TreeView with DndContext
- [x] Make TreeNode draggable and droppable
- [x] Create treeOperations.ts utility
- [x] Prevent invalid moves (circular references)
- [x] Add moveIssue action to IssueStore (already existed)
- [x] **TEST**: Can drag issues to new parents, hierarchy updates, data persists

### Step 3.3: Add Relationship Visualization
- [x] Create RelationshipLines.tsx (SVG overlay)
- [x] Add blocked/blocking indicators to TreeNode
- [x] Create RelationshipTooltip.tsx
- [x] Add toggle to show/hide relationship lines
- [x] **TEST**: Dependency lines show correctly, blocked items visually distinct

---

## Phase 4: Kanban Board Implementation

### Step 4.1: Create Kanban Board Structure
- [x] Create KanbanBoard.tsx (main container)
- [x] Create KanbanColumn.tsx (status column)
- [x] Create KanbanCard.tsx (card variant)
- [x] Create KanbanToolbar.tsx (filters, grouping)
- [x] Style columns with status colors
- [x] **TEST**: Board displays columns, issues in correct columns

### Step 4.2: Implement Kanban Drag-and-Drop
- [x] Add DndContext to KanbanBoard
- [x] Make KanbanColumn droppable
- [x] Make KanbanCard draggable
- [x] Add updateIssueStatus action
- [x] Implement optimistic updates
- [x] Add smooth transition animations
- [x] **TEST**: Can drag cards between columns, status updates, data persists

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
- [ ] Update package.json scripts (dev, build, start, preview, package)
- [ ] Create production Express server configuration
- [ ] Add loading spinners and skeletons
- [ ] Add error boundaries
- [ ] Add toast notifications
- [ ] Create keyboard shortcuts help modal
- [ ] Add empty states with helpful messages
- [ ] Create START-HERE.command for Mac (double-click to run)
- [ ] Create START-HERE.bat for Windows (double-click to run)
- [ ] Create `npm run package` script that:
  - [ ] Builds the app
  - [ ] Creates jira-structure.zip with all needed files
  - [ ] Includes START-HERE scripts, data folder, server, README
  - [ ] Excludes node_modules, .git, docs/, dev files
- [ ] Write comprehensive README.md (user-facing)
- [ ] Test full build and distribution:
  - [ ] Unzip to fresh folder
  - [ ] Double-click START-HERE works
  - [ ] All features work from built files
- [ ] **TEST**: App builds, packages, and runs from zip with minimal setup

---

## Phase 7 (Future): MCP Integration

> **Goal**: Mirror official Atlassian Rovo MCP Server interface for skill transferability.

### Step 7.1: Create Atlassian-Compatible MCP Server
- [ ] Install @modelcontextprotocol/sdk and zod
- [ ] Create src/mcp/server.ts with **stdio transport** (required for Claude Desktop)
- [ ] Connect to JSON data files with file locking
- [ ] Implement Atlassian-compatible tools (exact names from official API):
  - [ ] `searchJiraIssuesUsingJql` - JQL search
  - [ ] `getJiraIssue` - Get issue by key
  - [ ] `createJiraIssue` - Create new issue
  - [ ] `editJiraIssue` - Update issue fields
  - [ ] `transitionJiraIssue` - Change status via workflow
  - [ ] `getVisibleJiraProjects` - List projects
  - [ ] `getJiraProjectIssueTypesMetadata` - List issue types
  - [ ] `getJiraIssueTypeMetaWithFields` - Field metadata
  - [ ] `getTransitionsForJiraIssue` - Available transitions
  - [ ] `lookupJiraAccountId` - Find users
  - [ ] `addCommentToJiraIssue` - Add comments
- [ ] Implement Structure extension tools (for hierarchy learning):
  - [ ] `getJiraIssueHierarchy` - Get parent/child tree
  - [ ] `moveJiraIssueInHierarchy` - Change parent
  - [ ] `linkJiraIssues` - Create/remove links
- [ ] Add npm scripts: "mcp" and "mcp:dev"
- [ ] **TEST**: MCP server connects via stdio, tools respond correctly

### Step 7.2: Configure Claude Desktop Integration
- [ ] Create docs/MCP-SETUP.md with configuration instructions
- [ ] Document claude_desktop_config.json setup (macOS + Windows paths)
- [ ] Add "Transitioning to Real Jira" section
- [ ] Update START-HERE scripts to mention MCP option
- [ ] Add MCP section to main README.md
- [ ] **TEST**: User can add server to Claude Desktop and query data

### Step 7.3: Test Atlassian Compatibility
- [ ] Create tests/mcp-compatibility.test.ts
- [ ] Test tool inputs/outputs match Atlassian documentation
- [ ] Verify error response patterns
- [ ] Document intentional deviations (Structure extensions)
- [ ] Create example Claude prompts that work with both local and real Jira
- [ ] **TEST**: Same prompts work identically when switching to official Atlassian MCP

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
| 1.1 | 2026-01-27 | Claude (Opus 4.5) | Updated Phase 7 for Atlassian MCP compatibility (3 steps) |
