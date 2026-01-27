# MCP Server Setup Guide

This guide explains how to connect the Jira Structure Learning Tool's MCP server to Claude Desktop (or Cursor IDE), enabling you to interact with your local Jira data through natural language.

---

## What is MCP?

**Model Context Protocol (MCP)** is a standard for AI tool integration that allows Claude to interact with external systems. This tool includes an MCP server that:

- Implements the **same interface as the official Atlassian Rovo MCP Server**
- Lets you practice Jira workflows with Claude locally
- Ensures skills learned here transfer directly to real Jira Cloud

---

## Prerequisites

1. **Node.js 18+** installed ([download here](https://nodejs.org/))
2. **Jira Structure Learning Tool** installed and working (test with `npm start`)
3. **Claude Desktop** (for Claude integration) or **Cursor IDE** (for code editing)

> **Note**: If you downloaded the `jira-structure.zip` package, the MCP server is already pre-built and ready to use. If you cloned from git, run `npm run build:server` first.

---

## Claude Desktop Configuration

### Step 1: Locate Your Config File

Claude Desktop stores its configuration in a JSON file:

| Platform | Config File Location |
|----------|---------------------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

> **Tip**: On macOS, press `Cmd + Shift + G` in Finder and paste the path. On Windows, type the path in File Explorer's address bar.

### Step 2: Get Your Installation Path

You'll need the absolute path to your jira-structure installation. Find it by:

**macOS/Linux:**
```bash
cd /path/to/jira-structure
pwd
```

**Windows:**
```cmd
cd C:\path\to\jira-structure
cd
```

Example paths:
- macOS: `/Users/sam/Projects/jira-structure`
- Windows: `C:\Users\Sam\Projects\jira-structure`

### Step 3: Edit the Config File

Open `claude_desktop_config.json` in a text editor and add the MCP server configuration.

**macOS/Linux Configuration:**

```json
{
  "mcpServers": {
    "jira-structure-local": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/path/to/jira-structure/dist-server/mcp/server.js"],
      "env": {
        "DATA_DIR": "/Users/YOUR_USERNAME/path/to/jira-structure/data"
      }
    }
  }
}
```

**Windows Configuration:**

```json
{
  "mcpServers": {
    "jira-structure-local": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USERNAME\\path\\to\\jira-structure\\dist-server\\mcp\\server.js"],
      "env": {
        "DATA_DIR": "C:\\Users\\YOUR_USERNAME\\path\\to\\jira-structure\\data"
      }
    }
  }
}
```

> **Important**: 
> - Replace `YOUR_USERNAME` and `path/to/jira-structure` with your actual paths
> - Windows paths use double backslashes (`\\`) in JSON
> - The `DATA_DIR` environment variable tells the MCP server where to find your issue data

### Step 4: Restart Claude Desktop

1. Completely quit Claude Desktop (not just close the window)
2. Reopen Claude Desktop
3. Look for the Jira Structure tools in Claude's tool list

### Verification

To verify the connection, ask Claude:

> "List all projects in my Jira instance"

Claude should respond with information about the Phoenix Platform project.

---

## Cursor IDE Configuration

If you prefer Cursor over Claude Desktop:

1. Open Cursor settings (`Cmd/Ctrl + ,`)
2. Search for "MCP" in the settings
3. Add a new MCP server with:
   - **Name**: `jira-structure-local`
   - **Command**: `node`
   - **Args**: `["/path/to/jira-structure/dist-server/mcp/server.js"]`
4. Restart Cursor

---

## Available MCP Tools

Once connected, Claude can use these tools:

### Core Jira Tools (Atlassian-Compatible)

| Tool | Description |
|------|-------------|
| `searchJiraIssuesUsingJql` | Search issues with JQL queries |
| `getJiraIssue` | Get a single issue by key |
| `createJiraIssue` | Create a new issue |
| `editJiraIssue` | Update issue fields |
| `transitionJiraIssue` | Change issue status |
| `getVisibleJiraProjects` | List all projects |
| `getJiraProjectIssueTypesMetadata` | List issue types |
| `getJiraIssueTypeMetaWithFields` | Get field metadata |
| `getTransitionsForJiraIssue` | List available status transitions |
| `lookupJiraAccountId` | Search for users |
| `addCommentToJiraIssue` | Add comments to issues |

### Structure Extension Tools

These tools are specific to this learning tool (not in official Atlassian API):

| Tool | Description |
|------|-------------|
| `getJiraIssueHierarchy` | Get parent/child tree for an issue |
| `moveJiraIssueInHierarchy` | Change an issue's parent |
| `linkJiraIssues` | Create/remove issue links (blocks, relates) |

---

## Example Claude Prompts

Try these prompts to practice Jira workflows:

### Querying Issues

```
Show me all bugs with High or Highest priority
```

```
Find all stories in Sprint 4 that aren't Done yet
```

```
What issues are blocking PHOENIX-4?
```

### Creating Issues

```
Create a new Bug titled "Dashboard loads slowly on mobile" 
with High priority under epic PHOENIX-6
```

```
Create a Task called "Write unit tests for auth service" 
and assign it to Sarah
```

### Updating Issues

```
Move PHOENIX-30 to In Progress
```

```
Add the labels "urgent" and "security" to PHOENIX-45
```

```
Change the parent of PHOENIX-42 to PHOENIX-5
```

### Structure Operations

```
Show me the full hierarchy under initiative PHOENIX-1
```

```
What are all the children of PHOENIX-6?
```

```
Make PHOENIX-46 block PHOENIX-47
```

---

## Transitioning to Real Jira

This MCP server intentionally mirrors the **official Atlassian Rovo MCP Server** interface. When you're ready to work with real Jira Cloud:

### Step 1: Remove Local Server

Edit your `claude_desktop_config.json` and remove the `jira-structure-local` entry.

### Step 2: Install Official Atlassian MCP Server

Follow the setup instructions at:
https://github.com/atlassian/atlassian-mcp-server

### Step 3: Your Skills Transfer!

The prompts you've practiced will work identically with real Jira:

| Local Practice | Real Jira |
|---------------|-----------|
| "Find all bugs in Sprint 4" | Same prompt works |
| "Create a story under PHOENIX-5" | Same prompt works |
| "Move PHOENIX-42 to Done" | Same prompt works |

The tool names, parameters, and response formats are designed to match, so your Claude "muscle memory" transfers directly.

### What's Different with Real Jira?

| Feature | Local Tool | Real Atlassian MCP |
|---------|------------|-------------------|
| Authentication | None needed | Requires Atlassian API token |
| Projects | Sample data only | All your real projects |
| Users | Mock team members | Real team directory |
| Permissions | Full access | Respects Jira permissions |
| Structure Tools | Available | Not available (official API only) |

---

## Troubleshooting

### "MCP server not found" or "Connection failed"

1. **Verify the path**: Make sure the path in your config points to an existing file:
   ```bash
   ls /path/to/jira-structure/dist-server/mcp/server.js
   ```

2. **Rebuild if needed** (only if you cloned from git or the file is missing):
   ```bash
   npm run build:server
   ```

3. **Check Node.js**: Ensure `node` is in your PATH:
   ```bash
   node --version
   ```

### "Cannot read data files"

1. **Check DATA_DIR**: Verify the `DATA_DIR` path in your config points to the correct `data` folder

2. **Verify data exists**:
   ```bash
   ls /path/to/jira-structure/data/
   ```
   Should show: `issues.json`, `projects.json`, `sprints.json`, etc.

### Claude doesn't see the tools

1. **Fully restart Claude Desktop** (quit from menu/taskbar, not just close window)
2. **Check config syntax**: JSON must be valid (use a JSON validator)
3. **Check Claude's MCP logs**: Look in Claude Desktop settings for diagnostic info

### Changes not reflecting in web UI

The MCP server and web UI share the same data files. If you make changes via MCP:
- Refresh the web browser to see updates
- No restart needed for the Express server

### Error: "Issue not found"

- Issue keys are case-sensitive: use `PHOENIX-1`, not `phoenix-1`
- Check the issue exists: ask Claude to "list all issues" first

---

## Development: Running MCP Server Directly

For development or testing, you can run the MCP server directly:

**Development mode (with hot reload):**
```bash
npm run mcp:dev
```

**Production mode:**
```bash
npm run mcp
```

The server uses **stdio transport**, meaning it communicates through standard input/output. This is required for Claude Desktop integration.

---

## Need Help?

- **Full project documentation**: See `docs/SPECIFICATION.md`
- **Technical architecture**: See `docs/BLUEPRINT.md`
- **Atlassian MCP reference**: https://github.com/atlassian/atlassian-mcp-server
