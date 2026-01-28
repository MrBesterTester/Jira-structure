# Jira Structure Learning Tool

A locally-hosted Jira simulator with Structure plugin functionality, designed for practicing project management with **Claude Cowork** in Claude Desktop.

---

## Table of Contents

- [What Is This?](#what-is-this)
- [Quick Start](#quick-start)
- [Sharing with Others](#sharing-with-others)
- [Connecting Claude Desktop (MCP Integration)](#connecting-claude-desktop-mcp-integration)
- [Sample Data](#sample-data)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Data Storage](#data-storage)
- [Cross-Platform Compatibility](#cross-platform-compatibility)
- [Known Testing Limitations](#known-testing-limitations)
- [Troubleshooting](#troubleshooting)
- [Learning Resources](#learning-resources)
- [Privacy & Security](#privacy--security)
- [For Developers: Continuing This Project](#for-developers-continuing-this-project)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## What Is This?

This application simulates Atlassian Jira with the Structure plugin, purpose-built for learning how to use **Claude Cowork** to manage projects through natural language.

**Core Purpose:**
- Use Claude Desktop's Cowork feature to query, create, and manipulate Jira-like issues
- Learn Jira Structure hierarchies (Initiative → Epic → Story → Task) without a Jira subscription
- Practice AI-assisted project management in a safe, local environment
- **Transferable skills**: The MCP server mirrors the official Atlassian Rovo MCP interface, so prompts you learn here work identically with real Jira Cloud
  - *"Find all high-priority bugs in the current sprint"*
  - *"Create a story under epic PHOENIX-5"*

### Key Features

| Feature | Description |
|---------|-------------|
| **Tree View** | Collapsible hierarchy showing parent-child relationships |
| **Kanban Board** | Drag-and-drop cards between status columns |
| **Full Issue Fields** | Sprints, story points, versions, components, time tracking |
| **Relationships** | Parent-child, blockers, dependencies, cross-project links |
| **JQL-like Search** | Query issues with syntax like `type = Bug AND priority = High` |
| **Bulk Editing** | Select multiple issues and update them at once |
| **Import/Export** | Move data in and out via JSON or CSV |

---

## Quick Start

### Prerequisites

- **Node.js 18 or higher** (tested on 18, 20, and 22) — [Download here](https://nodejs.org/)
- **Claude Desktop** — Required for Claude Cowork integration (or Cursor IDE)

### Installation

**Option A: Double-click to start (easiest)**

1. Unzip the `jira-structure.zip` file to any folder
2. Double-click `START-HERE.command` (Mac) or `START-HERE.bat` (Windows)
3. A browser window opens automatically — you're ready!

**Option B: Command line**

1. Unzip and open a terminal in the folder
2. Run:
   ```bash
   npm install && npm start
   ```
3. Open `http://localhost:3000` in your browser

The app comes pre-loaded with a sample project to explore.

---

## Sharing with Others

To share this tool with a friend:

1. **Create the package**: Run `npm run package` (creates `jira-structure.zip`)
2. **Send the zip file** via email, Dropbox, USB drive, etc.
3. **Recipient instructions**:
   - Install [Node.js 18 or higher](https://nodejs.org/) if not already installed
   - Unzip the file
   - Double-click the start script
   - That's it!

No git, no cloning, no command line expertise needed.

---

## Connecting Claude Desktop (MCP Integration)

This is the main event! The tool includes an MCP (Model Context Protocol) server that lets Claude interact with your Jira data through natural language.

### Why a Local MCP Server?

You might wonder: *"Why not just use Atlassian's official MCP server?"*

**Because Atlassian's MCP requires a Jira Cloud subscription.** It connects to Atlassian's paid cloud APIs — you can't use it without an account and API token.

This local MCP server is **completely free** and connects to your local sample data instead:

| | This Local MCP | Atlassian's Official MCP |
|---|---|---|
| **Cost** | Free | Requires Jira Cloud subscription |
| **Connects to** | Local JSON files | Atlassian Cloud APIs |
| **Data** | Safe sample data | Your real production data |
| **Purpose** | Learn & practice | Production use |

The tool names and parameters mirror Atlassian's interface, so when you're ready to upgrade to real Jira, your Claude prompts transfer directly — no relearning needed.

> **Detailed Setup Guide**: See [docs/MCP-SETUP.md](docs/MCP-SETUP.md) for complete configuration instructions, troubleshooting, and example prompts.

### Quick Setup

The MCP server is pre-built and included in the package — no build step required.

1. **Edit your Claude Desktop config file**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add this configuration** (edit the paths to match your installation):

   **Mac/Linux:**
   ```json
   {
     "mcpServers": {
       "jira-structure-local": {
         "command": "node",
         "args": ["/path/to/jira-structure/dist-server/mcp/server.js"],
         "env": {
           "DATA_DIR": "/path/to/jira-structure/data"
         }
       }
     }
   }
   ```

   **Windows:**
   ```json
   {
     "mcpServers": {
       "jira-structure-local": {
         "command": "node",
         "args": ["C:\\path\\to\\jira-structure\\dist-server\\mcp\\server.js"],
         "env": {
           "DATA_DIR": "C:\\path\\to\\jira-structure\\data"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop** (fully quit and reopen)
4. Look for the Jira Structure tools in Claude's tool list — you're connected!

### For Cursor IDE Users

1. Open Cursor settings (`Cmd/Ctrl + ,`)
2. Search for "MCP"
3. Add the Jira Structure MCP server path (same as above)
4. Restart Cursor

### Transitioning to Real Jira

This MCP server mirrors the **official Atlassian Rovo MCP Server** interface. When you're ready to use real Jira Cloud:

1. Remove `jira-structure-local` from your config
2. Install the [official Atlassian MCP Server](https://github.com/atlassian/atlassian-mcp-server)
3. **Your prompts work identically!** The skills you learn here transfer directly.

See [docs/MCP-SETUP.md](docs/MCP-SETUP.md) for detailed transition instructions.

### What You Can Ask Claude

Once connected, try these natural language commands:

**Querying Issues:**
- "Show me all open bugs in the Phoenix project"
- "What's blocking PHOENIX-42?"
- "List all stories assigned to John in Sprint 4"
- "Find high priority items that are overdue"

**Creating Issues:**
- "Create a bug titled 'Login button not working' with high priority"
- "Add a new story under the Authentication epic"
- "Create a subtask for PHOENIX-15 about unit tests"

**Updating Issues:**
- "Move PHOENIX-23 to In Progress"
- "Assign all bugs in Sprint 4 to Sarah"
- "Add the 'urgent' label to PHOENIX-10"
- "Change the parent of PHOENIX-30 to PHOENIX-5"

**Structure Operations:**
- "Show me the full hierarchy under the Dashboard initiative"
- "What are all the children of PHOENIX-8?"
- "Find all issues that block the release"
- "List epics with incomplete stories"

---

## Sample Data

The app includes a realistic sample project called **"Phoenix Platform"** — a cloud-based development platform with authentication, dashboards, and analytics.

> **Note on Issue Keys:** In Jira, all issues within a project share the same key prefix (e.g., `PHOENIX-1`, `PHOENIX-2`). The issue type (Initiative, Epic, Story, Bug, etc.) is stored as a separate field, not embedded in the key. This is a Jira platform limitation — you identify issue types by looking at the Type field or icon, not the key itself.

### Project (1)

| Key | Name | Description |
|-----|------|-------------|
| PHOENIX | Phoenix Platform | A modern cloud-based development platform featuring user authentication, role-based access control, real-time dashboards, and comprehensive analytics. |

### Team Members (5)

| Name | Role | Email |
|------|------|-------|
| Alex Chen | Project Lead | alex.chen@phoenix.dev |
| Sarah Kim | Senior Developer | sarah.kim@phoenix.dev |
| Marcus Johnson | Frontend Developer | marcus.johnson@phoenix.dev |
| Emma Rodriguez | Backend Developer | emma.rodriguez@phoenix.dev |
| David Park | QA Engineer | david.park@phoenix.dev |

### Sprints (5)

| Sprint | Status | Goal |
|--------|--------|------|
| Sprint 1 | ✅ Completed | Set up project foundation and implement user registration flow |
| Sprint 2 | ✅ Completed | Complete authentication system and begin role-based access control |
| Sprint 3 | ✅ Completed | Finalize RBAC and start dashboard implementation |
| Sprint 4 | 🔄 Active | Complete dashboard core features and implement widget system |
| Sprint 5 | 📅 Planned | Analytics & reporting features and notification system |

### Issues (53 total)

#### Initiatives (2)

| Key | Title | Status |
|-----|-------|--------|
| PHOENIX-1 | User Authentication & Authorization Platform | In Progress |
| PHOENIX-2 | Dashboard & Analytics Platform | In Progress |

#### Epics (6)

| Key | Title | Parent | Status |
|-----|-------|--------|--------|
| PHOENIX-3 | User Registration & Onboarding | PHOENIX-1 | Done |
| PHOENIX-4 | Authentication System | PHOENIX-1 | In Progress |
| PHOENIX-5 | Role-Based Access Control | PHOENIX-1 | In Progress |
| PHOENIX-6 | Main Dashboard | PHOENIX-2 | In Progress |
| PHOENIX-7 | Analytics & Reporting | PHOENIX-2 | To Do |
| PHOENIX-8 | Notification System | PHOENIX-2 | To Do |

#### Stories (15)

| Key | Title | Epic | Points | Status |
|-----|-------|------|--------|--------|
| PHOENIX-9 | Implement email registration flow | Registration | 8 | Done |
| PHOENIX-10 | Implement OAuth provider integration | Registration | 13 | Done |
| PHOENIX-11 | Implement JWT authentication | Auth System | 8 | Done |
| PHOENIX-12 | Implement session management | Auth System | 5 | In Progress |
| PHOENIX-16 | Create dashboard layout | Dashboard | 5 | In Progress |
| PHOENIX-21 | Implement real-time notifications | Notifications | 8 | To Do |

#### Tasks & Subtasks (22)

| Key | Title | Parent | Status |
|-----|-------|--------|--------|
| PHOENIX-24 | Create registration form component | PHOENIX-9 | Done |
| PHOENIX-25 | Set up email verification service | PHOENIX-9 | Done |
| PHOENIX-26 | Configure Google OAuth | PHOENIX-10 | Done |
| PHOENIX-28 | Create JWT token service | PHOENIX-11 | Done |
| PHOENIX-30 | Create session store | PHOENIX-12 | In Progress |
| PHOENIX-37 | Design responsive grid system | PHOENIX-16 | In Progress |

#### Bugs (8)

| Key | Title | Priority | Status |
|-----|-------|----------|--------|
| PHOENIX-44 | Registration fails with special characters in email | High | Done |
| PHOENIX-45 | Token refresh endpoint returns 500 error | Highest | In Progress |
| PHOENIX-46 | Session not persisting after browser restart | High | To Do |
| PHOENIX-47 | Dashboard not responsive on tablet devices | Medium | In Progress |
| PHOENIX-48 | Charts not rendering with large datasets | Medium | To Do |

### Relationships

The sample data includes realistic relationships:

- **Parent-Child**: Full hierarchy from Initiatives → Epics → Stories → Tasks → Subtasks
- **Blockers**: 
  - PHOENIX-3 (Registration) blocks PHOENIX-4 (Auth System)
  - PHOENIX-4 (Auth System) blocks PHOENIX-5 (RBAC)
  - PHOENIX-6 (Dashboard) blocks PHOENIX-7 (Analytics)
- **Related Issues**: OAuth tasks (PHOENIX-26, PHOENIX-27) are related to each other

### Starting Fresh

To clear the sample data and start with an empty project:

1. Navigate to **Settings** (gear icon)
2. Click **Reset Data**
3. Confirm the action

Or manually delete the contents of the `/data` folder and restart.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate between issues |
| `←` / `→` | Collapse / Expand in tree view |
| `Enter` | Open issue detail panel |
| `C` | Create new issue |
| `E` | Edit selected issue |
| `/` | Focus search bar |
| `Esc` | Close panel / Clear selection |
| `Ctrl/Cmd + A` | Select all visible issues |
| `Shift + Click` | Select range of issues |

---

## Data Storage

All data is stored locally in the `/data` folder as JSON files:

```
/data
  ├── projects.json    # Project definitions
  ├── issues.json      # All issues and their fields
  ├── sprints.json     # Sprint data
  ├── users.json       # Team member profiles
  └── structures.json  # Hierarchy configurations
```

You can:
- **Back up** by copying the `/data` folder
- **Edit directly** — JSON files are human-readable
- **Share** — Send the `/data` folder to others

---

## Cross-Platform Compatibility

This application runs on **any operating system** that supports Node.js 18 or higher (tested on 18, 20, and 22). The entire stack is pure JavaScript/TypeScript with no native compiled code or architecture-specific dependencies.

### Supported Platforms

| Platform | Status | Start Method |
|----------|--------|--------------|
| macOS (Intel) | ✅ Works | Double-click `START-HERE.command` or `npm start` |
| macOS (Apple Silicon M1/M2/M3/M4) | ✅ Works | Double-click `START-HERE.command` or `npm start` |
| Windows | ✅ Works | Double-click `START-HERE.bat` or `npm start` |
| Linux | ✅ Works | `npm start` in terminal |

### Why It's Cross-Compatible

| Component | Architecture Dependency |
|-----------|------------------------|
| React/Vite frontend | None — runs in browser as JavaScript |
| Express server | None — pure JavaScript on Node.js |
| MCP server | None — pure JavaScript on Node.js |
| npm dependencies | None have native bindings |

The `npm install` step downloads the same JavaScript packages regardless of your OS or CPU architecture. There's nothing to recompile — if you have Node.js, it just works.

---

## Known Testing Limitations

The following features could not be fully verified during automated testing:

| Test | Status | Reason |
|------|--------|--------|
| Kanban Drag-and-Drop | PARTIAL | Browser automation cannot simulate @dnd-kit pointer events |
| Tree View Drag-and-Drop | PARTIAL | Same @dnd-kit limitation as above |
| Error Boundary | SKIPPED | Requires intentionally breaking a component |

Drag-and-drop functionality was verified indirectly through status dropdown changes, which use the same underlying mechanism.

For full details, see [Incomplete Tests](docs/Step-6-4_UI-Testing-Plan.md#incomplete-tests) in the testing plan.

---

## Troubleshooting

### App won't start

1. Ensure Node.js 18 or higher is installed: `node --version`
2. Delete `node_modules` and run `npm install` again
3. Check if port 3000 is already in use

### Data not saving

1. Check that the `/data` folder exists and is writable
2. Look for error messages in the terminal
3. Try restarting the server

### MCP not connecting

1. Verify the MCP server path in your Claude/Cursor settings
2. Ensure the app is running before starting Claude
3. Check Claude Desktop logs for connection errors

### Issues not displaying

1. Verify `/data/issues.json` contains valid JSON
2. Check browser console for JavaScript errors
3. Try refreshing the page (Ctrl/Cmd + R)

---

## Learning Resources

### Understanding Jira Structure

- **Hierarchies**: Issues can have parent-child relationships to any depth
- **Types**: Initiative > Epic > Feature > Story > Task > Subtask (typical hierarchy)
- **Links**: Issues can block each other or be related without hierarchy

### JQL Quick Reference

| Query | Meaning |
|-------|---------|
| `type = Bug` | All bugs |
| `status = "In Progress"` | Currently being worked on |
| `assignee = "John"` | Assigned to John |
| `priority IN (High, Highest)` | High priority items |
| `sprint = "Sprint 4"` | In Sprint 4 |
| `labels ~ "frontend"` | Has frontend label |
| `parent = PHOENIX-5` | Children of PHOENIX-5 |

Combine with `AND`, `OR`, `NOT`:
```
type = Bug AND priority = High AND status != Done
```

---

## Privacy & Security

- **100% Local** — No data leaves your computer
- **No accounts** — No login or authentication required
- **No telemetry** — No usage tracking or analytics
- **No cloud** — Works completely offline after installation

Your data stays on your machine, making this safe for practicing with sensitive or hypothetical project information.

---

## For Developers: Continuing This Project

This project uses the **Dylan Davis Three-Document System** for AI-assisted development. When continuing work in a new chat session (with Claude, Cursor, or similar), provide these files at the start:

### Starting a New Session

Include these documents using `@` references:

```
@docs/SPECIFICATION.md
@docs/BLUEPRINT.md
@docs/TODO.md
```

Then specify which phase/step to work on:

```
Continue with Phase 1, Step 1.1: Initialize React + TypeScript + Vite Project
```

### Why This Works

| Document | Purpose |
|----------|---------|
| `SPECIFICATION.md` | Reminds AI what we're building (the "what") |
| `BLUEPRINT.md` | Contains exact prompts to execute (the "how") |
| `TODO.md` | Shows progress with checkboxes (the "where we left off") |

The Cursor rule (`.cursor/rules/dylan-davis-methodology.mdc`) automatically applies and tells the AI how to follow the methodology.

### After Completing Work

1. Check off completed items in `TODO.md`
2. Commit changes to git
3. If errors were fixed, add lessons learned to the Cursor rule or `TODO.md` notes section

### Full Methodology Reference

See `docs/Dylan-Davis-50plus-method.html` for the complete methodology guide.

---

## Contributing

This is a learning tool. If you find bugs or have suggestions:

1. Check the `/docs` folder for technical documentation
2. Review `docs/SPECIFICATION.md` for the full feature list
3. See `docs/BLUEPRINT.md` for implementation details

---

## License

MIT License — Free to use, modify, and share.

---

## Credits

Built using the [Dylan Davis Three-Document System](docs/Dylan-Davis-50plus-method.html) for AI-assisted development.
