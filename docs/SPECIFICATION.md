# Jira Structure Learning Tool — Specification Document

> **Created**: January 26, 2026  
> **Method**: Dylan Davis Three-Document System  
> **Status**: Draft — Ready for Blueprint Phase

---

## 1. Project Overview

### 1.1 Purpose
A locally-hosted web application that simulates Jira with Structure plugin functionality, designed for learning and practicing Jira Structure concepts including hierarchies, issue relationships, and project management workflows.

### 1.2 Target Users
- Primary: The developer (Sam) for learning Jira Structure
- Secondary: A friend who will receive the built application for their own practice

### 1.3 Core Value Proposition
- Learn Jira Structure without needing a Jira Cloud subscription
- Practice hierarchies, relationships, and workflows in a safe local environment
- Later integrate with Claude/AI via MCP for advanced querying and manipulation

---

## 2. Functional Requirements

### 2.1 Hierarchy & Relationship Types

The application must support all major hierarchy and relationship patterns:

| Type | Description | Example |
|------|-------------|---------|
| **Simple Parent-Child** | Basic nesting | Epic → Story → Subtask |
| **Multi-Level Custom Hierarchies** | Deep nesting with custom levels | Initiative → Epic → Feature → Story → Subtask |
| **Cross-Project Relationships** | Links between issues in different projects | Issue in Project A linked to Issue in Project B |
| **Dependencies & Blockers** | Issue relationships with directionality | Issue A blocks Issue B; Issue C is blocked by Issue D |

### 2.2 Views

Two primary visualization modes:

1. **Tree/Outline View**
   - Collapsible hierarchy (like a file explorer)
   - Indent levels showing parent-child relationships
   - Expand/collapse all functionality
   - Visual indicators for issue types and status

2. **Kanban Board View**
   - Drag-and-drop cards between status columns
   - Cards show key issue information
   - Maintains hierarchy context (show parent/children)
   - Customizable columns based on workflow status

### 2.3 Issue Fields (Full Jira Simulation)

#### Standard Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (e.g., "PROJ-123") |
| `key` | string | Yes | Project-prefixed key |
| `title` | string | Yes | Issue summary/title |
| `description` | string | No | Detailed description (supports markdown) |
| `type` | enum | Yes | Initiative, Epic, Feature, Story, Task, Bug, Subtask |
| `status` | enum | Yes | To Do, In Progress, In Review, Done |
| `priority` | enum | Yes | Highest, High, Medium, Low, Lowest |
| `assignee` | string | No | Assigned user |
| `reporter` | string | Yes | Issue creator |
| `labels` | string[] | No | Tags/labels |
| `createdAt` | datetime | Yes | Creation timestamp |
| `updatedAt` | datetime | Yes | Last update timestamp |

#### Agile/Sprint Fields
| Field | Type | Description |
|-------|------|-------------|
| `storyPoints` | number | Estimation in story points |
| `sprint` | string | Sprint name/ID |
| `sprintStartDate` | date | Sprint start |
| `sprintEndDate` | date | Sprint end |

#### Planning Fields
| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Fix version/release |
| `component` | string[] | Project components |
| `dueDate` | date | Target completion date |
| `startDate` | date | Planned start date |

#### Time Tracking
| Field | Type | Description |
|-------|------|-------------|
| `originalEstimate` | number | Original time estimate (hours) |
| `timeSpent` | number | Time logged (hours) |
| `remainingEstimate` | number | Remaining time (hours) |

#### Relationships
| Field | Type | Description |
|-------|------|-------------|
| `parentId` | string | Parent issue ID |
| `childIds` | string[] | Child issue IDs |
| `blockedBy` | string[] | Issues blocking this one |
| `blocks` | string[] | Issues this one blocks |
| `relatedTo` | string[] | Related issues (non-directional) |

### 2.4 Features

#### Filtering & Sorting
- Filter by any field (status, type, assignee, priority, labels, sprint, version, component)
- Multiple simultaneous filters (AND logic)
- Sort by any field (ascending/descending)
- Save filter presets

#### Bulk Editing
- Multi-select issues (checkbox or shift-click)
- Bulk update: status, assignee, priority, labels, sprint, version
- Bulk move (change parent)
- Bulk delete (with confirmation)

#### Import/Export
- Export to JSON (full data structure)
- Export to CSV (flat format for spreadsheets)
- Import from JSON (restore/migrate data)
- Import from CSV (basic issue import)

#### Search (JQL-like Syntax)
- Query language for finding issues
- Support for field comparisons: `status = "In Progress"`
- Support for operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `~` (contains), `IN`, `NOT IN`
- Boolean logic: `AND`, `OR`, `NOT`
- Parentheses for grouping
- Examples:
  - `type = Bug AND priority = High`
  - `assignee = "John" AND status IN ("To Do", "In Progress")`
  - `labels ~ "frontend" AND sprint = "Sprint 5"`

---

## 3. Technical Requirements

### 3.1 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend Framework** | React 18+ | Component-based, robust ecosystem |
| **Language** | TypeScript (strict mode) | Type safety, better maintainability |
| **Build Tool** | Vite | Fast builds, modern tooling |
| **Styling** | Tailwind CSS or CSS Modules | Rapid styling, consistent design |
| **State Management** | Zustand or React Context | Simple, TypeScript-friendly |
| **Data Storage** | Local JSON files | Easy to edit, backup, no database needed |
| **Local Server** | Node.js + Express (minimal) | Serves files, provides REST API for JSON operations |

### 3.2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Tree View  │  │   Kanban    │  │  Issue Detail   │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                         │                                │
│              ┌──────────┴──────────┐                    │
│              │    State Manager    │                    │
│              └──────────┬──────────┘                    │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────┼───────────────────────────────┐
│                Local Express Server                      │
│              ┌──────────┴──────────┐                    │
│              │    REST API Layer   │                    │
│              └──────────┬──────────┘                    │
│                         │                                │
│              ┌──────────┴──────────┐                    │
│              │  JSON File Storage  │                    │
│              └─────────────────────┘                    │
│                    /data/*.json                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Data Storage Structure

```
/data
  /projects.json       # Project definitions
  /issues.json         # All issues across projects
  /structures.json     # Hierarchy/structure definitions
  /sprints.json        # Sprint data
  /users.json          # User data (mock users)
  /config.json         # App configuration
```

### 3.4 Deployment Requirements

- **Must be buildable** for easy distribution
- **No cloud dependencies** — runs 100% locally
- **No authentication required** — single-user local tool
- **Portable** — recipient can run with minimal setup (Node.js only requirement)
- **Offline capable** — no external API calls

### 3.5 Delivery Package

The final deliverable should include:
1. Built static files (HTML/CSS/JS bundle)
2. Minimal Node.js server for local hosting + JSON API
3. Sample data pre-loaded
4. Simple start script (`npm start` or `./start.sh`)
5. README with setup instructions

---

## 4. MCP Integration (Future Phase)

### 4.1 Scope
Full CRUD + Structure manipulation via Model Context Protocol, **compatible with official Atlassian Rovo MCP Server interface**.

### 4.2 Atlassian Compatibility Goal
The MCP server will implement the **same tool names and schemas** as the official Atlassian Rovo MCP Server (https://github.com/atlassian/atlassian-mcp-server). This ensures:

- Claude skills learned locally transfer directly to real Jira Cloud
- Users can switch from local simulator to official Atlassian MCP with no prompt changes
- Same JQL queries, same tool calls, same workflows

### 4.3 Planned Capabilities

**Atlassian-Compatible Tools** (matching official API):
- `searchJiraIssuesUsingJql`: Query issues with JQL
- `getJiraIssue`: Get issue by key
- `createJiraIssue`: Create new issues
- `editJiraIssue`: Update issue fields
- `transitionJiraIssue`: Change status via workflow
- `getVisibleJiraProjects`: List projects
- `addCommentToJiraIssue`: Add comments
- `getTransitionsForJiraIssue`: List workflow transitions

**Structure Extension Tools** (for hierarchy learning, not in official API):
- `getJiraIssueHierarchy`: Get parent/child tree
- `moveJiraIssueInHierarchy`: Change issue parent
- `linkJiraIssues`: Create/remove issue links

### 4.4 MCP Server Requirements
- Local MCP server (Node.js) using **stdio transport** (required for Claude Desktop)
- Connects to same JSON data as web UI
- Exposes tools matching Atlassian's official interface
- No cloud authentication needed (local-only)
- Runs as separate process from Express web server

---

## 5. Sample Data Requirements

### 5.1 Sample Project: "Phoenix Platform"

A realistic software development project with:

**Project Structure:**
- 2-3 Initiatives (high-level goals)
- 5-8 Epics (major features)
- 15-20 Features/Stories
- 30-50 Tasks and Subtasks
- 5-10 Bugs

**Sprints:**
- 3 completed sprints (historical)
- 1 active sprint
- 1 future sprint (planned)

**Relationships:**
- Parent-child hierarchies throughout
- 5-10 blocker relationships
- Cross-epic dependencies
- Related issue links

**Realistic Content:**
- Actual software development scenarios
- Varied statuses across the board
- Multiple assignees
- Mix of priorities

---

## 6. User Interface Requirements

### 6.1 Design Direction
- Similar layout/concepts to Jira (recognizable to Jira users)
- Doesn't need to match Jira exactly
- Modern, clean aesthetic
- Dark mode optional (nice-to-have)

### 6.2 Key UI Components
1. **Sidebar**: Project navigation, filters, saved views
2. **Main Content**: Tree view or Kanban (switchable)
3. **Issue Panel**: Slide-out or modal for issue details
4. **Toolbar**: Actions, view toggle, search
5. **Breadcrumb**: Current location in hierarchy

### 6.3 Responsive Behavior
- Primary target: Desktop (1200px+)
- Tablet support: Nice-to-have
- Mobile: Not required

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Handle 500+ issues without lag
- Tree view should expand/collapse instantly
- Kanban drag-and-drop should feel smooth

### 7.2 Data Integrity
- Auto-save changes to JSON files
- No data loss on browser refresh
- Maintain referential integrity (parent-child relationships)

### 7.3 Error Handling
- Graceful handling of malformed data
- Clear error messages
- Recovery options where possible

---

## 8. Out of Scope (MVP)

The following are explicitly **not** in scope for the initial build:
- Multi-user collaboration
- User authentication/permissions
- Cloud sync or backup
- Real-time updates
- Mobile-optimized UI
- Gantt chart view
- Reporting/analytics dashboards
- Email notifications
- Integrations with external tools (except MCP)
- Workflow customization (fixed workflow for MVP)

---

## 9. Success Criteria

The project is successful when:

1. ✅ User can create, view, edit, and delete issues
2. ✅ User can organize issues in multi-level hierarchies
3. ✅ User can view issues in both Tree and Kanban views
4. ✅ User can create dependencies and relationships between issues
5. ✅ User can filter, sort, and search issues with JQL-like syntax
6. ✅ User can bulk edit multiple issues
7. ✅ User can import/export data as JSON and CSV
8. ✅ Application runs 100% locally with no cloud dependencies
9. ✅ Application can be easily packaged and shared with a friend
10. ✅ Sample data provides realistic learning scenarios

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **Issue** | A single work item (story, task, bug, etc.) |
| **Epic** | A large body of work containing multiple stories |
| **Initiative** | A high-level goal containing multiple epics |
| **Sprint** | A time-boxed iteration (usually 2 weeks) |
| **Structure** | The hierarchical organization of issues |
| **JQL** | Jira Query Language — syntax for searching issues |
| **MCP** | Model Context Protocol — standard for AI tool integration |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | Sam (via Claude) | Initial specification from interview |
| 1.1 | 2026-01-27 | Claude (Opus 4.5) | Updated Section 4 for Atlassian MCP Server compatibility |
