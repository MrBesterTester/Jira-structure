# Jira Structure Learning Tool

A locally-hosted Jira simulator with Structure plugin functionality, designed for learning project management hierarchies and practicing AI-assisted workflows with Claude.

---

## What Is This?

This application simulates Atlassian Jira with the Structure plugin, allowing you to:

- **Learn Jira Structure** — Understand hierarchies (Initiative → Epic → Story → Task) without needing a Jira subscription
- **Practice with AI** — Use Claude Cowork to query, create, and manipulate issues using natural language
- **Experiment safely** — All data is local; nothing is sent to the cloud

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

- **Node.js 18+** — [Download here](https://nodejs.org/)
- **Claude Desktop** or **Cursor IDE** — For AI integration (optional but recommended)

### Installation

1. **Download or clone** this repository
2. **Open a terminal** in the project folder
3. **Run the start script**:

   **Mac/Linux:**
   ```bash
   ./start.sh
   ```

   **Windows:**
   ```bash
   start.bat
   ```

   **Or manually:**
   ```bash
   npm install
   npm start
   ```

4. **Open your browser** to `http://localhost:3000`

That's it! The app comes pre-loaded with a sample project to explore.

---

## Using with Claude Cowork

This tool includes an MCP (Model Context Protocol) server that allows Claude to interact with your Jira data directly.

### Setup for Claude Desktop

1. Open Claude Desktop settings
2. Navigate to **MCP Servers**
3. Add a new server with this configuration:

   ```json
   {
     "jira-structure": {
       "command": "node",
       "args": ["path/to/jira-structure/src/mcp/server.js"]
     }
   }
   ```

4. Restart Claude Desktop

### Setup for Cursor IDE

1. Open Cursor settings (Cmd/Ctrl + ,)
2. Search for "MCP"
3. Add the Jira Structure MCP server path
4. Restart Cursor

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

The app includes a realistic sample project called **"Phoenix Platform"** with:

- **2 Initiatives** — High-level product goals
- **6 Epics** — Major feature areas
- **15+ Stories** — User-facing functionality
- **20+ Tasks** — Implementation work
- **8 Bugs** — Various priorities and statuses
- **5 Sprints** — Including completed, active, and planned

This gives you real scenarios to practice with, including:
- Multi-level hierarchies
- Blocking relationships
- Cross-epic dependencies
- Various workflow states

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

## Troubleshooting

### App won't start

1. Ensure Node.js 18+ is installed: `node --version`
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
