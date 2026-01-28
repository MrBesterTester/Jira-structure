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
| 4 | Kanban Board Implementation | Complete | 3/3 |
| 5 | Issue Management & Search | Complete | 4/4 |
| 6 | Bulk Operations, Import/Export & Polish | Complete | 4/4 |
| 7 | MCP Integration (Atlassian-Compatible) | Complete | 3/3 |
| 8 | Release | In Progress | 1/2 |

**Total Progress: 24/26 steps completed**

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
- [x] Add groupBy state to KanbanBoard
- [x] Create KanbanSwimlane.tsx
- [x] Update KanbanToolbar with group dropdown
- [x] Implement collapsible swimlane headers
- [x] Handle cross-swimlane drag (update grouped field)
- [x] **TEST**: Can group by assignee/epic, swimlanes display correctly

---

## Phase 5: Issue Management & Search

### Step 5.1: Create Issue Detail Panel
- [x] Create IssueDetailPanel.tsx (slide-out panel)
- [x] Create IssueDetailsTab.tsx with all fields
- [x] Implement inline editing for title
- [x] Add markdown editor for description
- [x] Create field grid with all standard fields
- [x] Implement auto-save on blur/change
- [x] Add delete issue with confirmation
- [x] **TEST**: Can view and edit all fields, changes persist

### Step 5.2: Create Issue Relationships Tab
- [x] Create IssueRelationshipsTab.tsx
- [x] Implement Parent section with change/remove
- [x] Implement Children section with add/remove
- [x] Implement Blocks/Blocked By sections
- [x] Implement Related To section
- [x] Create IssuePicker.tsx modal
- [x] **TEST**: Can view and manage all relationship types

### Step 5.3: Implement Create Issue Flow
- [x] Create CreateIssueModal.tsx
- [x] Add quick create from sidebar
- [x] Add quick create from tree (sibling/child)
- [x] Add quick create from Kanban column
- [x] Implement createIssue action with key generation
- [x] Auto-select and highlight new issue
- [x] **TEST**: Can create issues at any level, validation works

### Step 5.4: Implement JQL-like Search
- [x] Create jqlParser.ts (query to AST)
- [x] Create jqlEvaluator.ts (evaluate against issues)
- [x] Create SearchBar.tsx with syntax highlighting
- [x] Add autocomplete suggestions
- [x] Create SearchResults.tsx
- [x] Save recent searches to localStorage
- [x] **TEST**: JQL syntax works, results accurate, handles invalid queries

---

## Phase 6: Bulk Operations, Import/Export & Polish

### Step 6.1: Implement Bulk Editing
- [x] Add checkboxes to issue cards
- [x] Implement shift+click range selection
- [x] Implement ctrl/cmd+click toggle selection
- [x] Create BulkActionBar.tsx
- [x] Create BulkEditModal.tsx
- [x] Implement bulkUpdateIssues action
- [x] Implement bulkDeleteIssues action
- [x] Create BulkMoveModal.tsx
- [x] **TEST**: Can select multiple, bulk actions update all selected

### Step 6.2: Implement Import/Export
- [x] Create exportData.ts (JSON and CSV)
- [x] Create importData.ts (parse and validate)
- [x] Create ExportModal.tsx with format selection
- [x] Create ImportModal.tsx with file upload
- [x] Add conflict handling options
- [x] Add import progress and results summary
- [x] **TEST**: Export produces valid files, import restores correctly

### Step 6.3: Add Filtering UI
- [x] Create FilterPanel.tsx
- [x] Create filter components for each field type
- [x] Update UIStore with filter state
- [x] Create filterIssues.ts utility
- [x] Create SavedFilters.tsx
- [x] Apply filters to Tree and Kanban views
- [x] **TEST**: Filters work correctly, can combine multiple filters

### Step 6.4: Final Polish & Build Setup
- [x] Update package.json scripts (dev, build, start, preview, package)
- [x] Create production Express server configuration
- [x] Add loading spinners and skeletons
- [x] Add error boundaries
- [x] Add toast notifications
- [x] Create keyboard shortcuts help modal
- [x] Add empty states with helpful messages
- [x] Create START-HERE.command for Mac (double-click to run)
- [x] Create START-HERE.bat for Windows (double-click to run)
- [x] Create `npm run package` script that:
  - [x] Builds the app
  - [x] Creates jira-structure.zip with all needed files
  - [x] Includes START-HERE scripts, data folder, server, README
  - [x] Excludes node_modules, .git, docs/, dev files
- [x] Write comprehensive README.md (user-facing)
- [x] Test full build and distribution:
  - [x] Unzip to fresh folder
  - [x] Double-click START-HERE works
  - [x] All features work from built files
- [x] **TEST**: App builds, packages, and runs from zip with minimal setup

---

## Phase 7 (Future): MCP Integration

> **Goal**: Mirror official Atlassian Rovo MCP Server interface for skill transferability.

### Step 7.1: Create Atlassian-Compatible MCP Server
- [x] Install @modelcontextprotocol/sdk and zod
- [x] Create src/mcp/server.ts with **stdio transport** (required for Claude Desktop)
- [x] Connect to JSON data files with file locking
- [x] Implement Atlassian-compatible tools (exact names from official API):
  - [x] `searchJiraIssuesUsingJql` - JQL search
  - [x] `getJiraIssue` - Get issue by key
  - [x] `createJiraIssue` - Create new issue
  - [x] `editJiraIssue` - Update issue fields
  - [x] `transitionJiraIssue` - Change status via workflow
  - [x] `getVisibleJiraProjects` - List projects
  - [x] `getJiraProjectIssueTypesMetadata` - List issue types
  - [x] `getJiraIssueTypeMetaWithFields` - Field metadata
  - [x] `getTransitionsForJiraIssue` - Available transitions
  - [x] `lookupJiraAccountId` - Find users
  - [x] `addCommentToJiraIssue` - Add comments
- [x] Implement Structure extension tools (for hierarchy learning):
  - [x] `getJiraIssueHierarchy` - Get parent/child tree
  - [x] `moveJiraIssueInHierarchy` - Change parent
  - [x] `linkJiraIssues` - Create/remove links
- [x] Add npm scripts: "mcp" and "mcp:dev"
- [x] **TEST**: MCP server connects via stdio, tools respond correctly

### Step 7.2: Configure Claude Desktop Integration
- [x] Create docs/MCP-SETUP.md with configuration instructions
- [x] Document claude_desktop_config.json setup (macOS + Windows paths)
- [x] Add "Transitioning to Real Jira" section
- [x] Update START-HERE scripts to mention MCP option
- [x] Add MCP section to main README.md
- [x] **TEST**: User can add server to Claude Desktop and query data

### Step 7.3: Test Atlassian Compatibility
- [x] Create tests/mcp-compatibility.test.ts
- [x] Test tool inputs/outputs match Atlassian documentation
- [x] Verify error response patterns
- [x] Document intentional deviations (Structure extensions)
- [x] Create example Claude prompts that work with both local and real Jira
- [x] **TEST**: Run the tests for the builtin MCP server and file the results.
- [ ] **TEST**: Same prompts work identically when switching to official Atlassian MCP

---

## Phase 8: Release

> **Goal**: Publish to GitHub and create distributable package for sharing.

### Step 8.1: Prepare for GitHub Publishing
- [x] Add `jira-structure.zip` to .gitignore (exclude built package from repo)
- [x] Create LICENSE file (MIT recommended for learning tools)
- [x] Review README.md for any sensitive paths or personal info
- [x] Create GitHub repository at https://github.com/new (name: `Jira-structure`)
- [x] Push code to GitHub:
  ```bash
  git remote add origin git@github.com:MrBesterTester/Jira-structure.git
  git branch -M main
  git push -u origin main
  ```
- [x] **TEST**: Repository is public and accessible at https://github.com/MrBesterTester/Jira-structure

### Step 8.2: Create Release Package
- [ ] Run `npm run package` to create jira-structure.zip
- [ ] Verify zip contents include dist/, dist-server/, data/, START-HERE scripts:
  ```bash
  unzip -l jira-structure.zip
  ```
- [ ] Test zip on fresh machine (or fresh folder):
  ```bash
  # From project root
  rm -rf ../jira-structure-pkg-test && mkdir ../jira-structure-pkg-test
  cp jira-structure.zip ../jira-structure-pkg-test/
  cd ../jira-structure-pkg-test
  unzip jira-structure.zip
  ./START-HERE.command   # Mac (or START-HERE.bat on Windows)
  ```
  - [ ] Unzip extracts successfully
  - [ ] Double-click START-HERE opens browser
  - [ ] Web app works (create/edit issues, tree view, kanban)
  - [ ] MCP server path is correct in docs/MCP-SETUP.md
- [ ] Create git tag for the release:
  > **Note**: Tag uses format `rel_YYYY-MM-DD_HHMM` in PST. The actual build time on GitHub will be a few minutes later—close enough given the expected release frequency.
  ```bash
  git tag -a rel_2026-01-28_1150 -m "Release 2026-01-28_1150"
  git push origin rel_2026-01-28_1150
  ```
- [ ] Create GitHub Release with zip attached:
  ```bash
  gh release create rel_2026-01-28_1150 \
    --title "Jira Structure Learning Tool - Initial Release (2026-01-28)" \
    --notes "$(cat <<'EOF'
  Initial release of the Jira Structure Learning Tool.

  ## Features
  - Tree view with drag-and-drop hierarchy management
  - Kanban board with status transitions
  - JQL-like search
  - Bulk operations
  - Import/Export (JSON & CSV)
  - MCP server for Claude Desktop integration

  ## Getting Started
  1. Download jira-structure.zip below
  2. Unzip to any folder
  3. Double-click START-HERE.command (Mac) or START-HERE.bat (Windows)
  4. Browser opens automatically

  Requires Node.js 18+.
  EOF
  )" \
    jira-structure.zip
  ```
- [ ] Verify release page: https://github.com/MrBesterTester/jira-structure/releases/tag/rel_2026-01-28_1150
- [ ] Share download link with friend
- [ ] **TEST**: Friend can download, unzip, and run successfully

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

### Lesson 1: UI Component Testing (Step 5.1)
**Issue**: IssueDetailPanel crashed the entire app when opened. AI declared step "complete" after linter passed.
**Cause**: ESLint doesn't catch TypeScript type errors. Code passed `{type, label}` objects to a function expecting `IssueType` enum. TypeScript would have caught this but `tsc` wasn't run.
**Solution**: Fixed the type mismatch by properly destructuring objects from `getAllIssueTypes()`.
**Prevention**: For UI components, ALWAYS test in browser before marking complete. Use browser-use subagent or manual testing. Run `tsc --noEmit` to catch type errors, not just ESLint.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | Claude (Opus 4.5) | Initial to-dos from blueprint |
| 1.1 | 2026-01-27 | Claude (Opus 4.5) | Updated Phase 7 for Atlassian MCP compatibility (3 steps) |
| 1.2 | 2026-01-27 | Claude (Opus 4.5) | Completed Step 5.1, added Lesson 1 (UI testing) |
| 1.3 | 2026-01-27 | Claude (Opus 4.5) | Completed Step 7.2, added Phase 8: Release (2 steps) |