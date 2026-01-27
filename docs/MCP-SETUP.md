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

These prompts work **identically** whether you're using this local tool or the official Atlassian MCP Server with real Jira Cloud. Practice here, then use the same prompts in production!

### JQL Queries (Full Compatibility)

These JQL patterns work exactly the same on local and real Jira:

```
Find all high-priority bugs in the current sprint
```
*Uses: `searchJiraIssuesUsingJql` with `type = Bug AND priority IN (High, Highest) AND sprint = "Sprint 4"`*

```
Show me all issues assigned to Sarah that aren't done
```
*Uses: `searchJiraIssuesUsingJql` with `assignee = "Sarah" AND status != Done`*

```
List stories with more than 5 story points
```
*Uses: `searchJiraIssuesUsingJql` with `type = Story AND storyPoints > 5`*

```
Find issues with the "security" label
```
*Uses: `searchJiraIssuesUsingJql` with `labels ~ "security"`*

```
What's in review for the dashboard team?
```
*Uses: `searchJiraIssuesUsingJql` with `status = "In Review" AND labels ~ "dashboard"`*

### Creating Issues (Full Compatibility)

```
Create a Bug called "Login button unresponsive on Safari" with High priority
```
*Uses: `createJiraIssue` with projectKey, issueType, summary, priority*

```
Add a new Task under PHOENIX-6: "Implement password reset email template"
```
*Uses: `createJiraIssue` with parentKey parameter*

```
Create an Epic for the mobile app redesign project
```
*Uses: `createJiraIssue` with issueType = "Epic"*

### Updating Issues (Full Compatibility)

```
Move PHOENIX-30 to In Progress
```
*Uses: `transitionJiraIssue` - works identically on both local and real Jira*

```
Change PHOENIX-42's priority to Highest and add the "urgent" label
```
*Uses: `editJiraIssue` with fields: { priority: "Highest", labels: ["urgent"] }*

```
Assign PHOENIX-15 to Mike Chen
```
*Uses: `lookupJiraAccountId` to find Mike, then `editJiraIssue` to assign*

```
Mark the authentication bug as resolved
```
*Uses: `transitionJiraIssue` to move to Done*

### Comments (Full Compatibility)

```
Add a comment to PHOENIX-30: "Blocked waiting for design review"
```
*Uses: `addCommentToJiraIssue`*

```
Note on PHOENIX-45 that the fix will be in the next release
```
*Uses: `addCommentToJiraIssue`*

### Metadata Queries (Full Compatibility)

```
What issue types are available in this project?
```
*Uses: `getJiraProjectIssueTypesMetadata`*

```
What status transitions are available for PHOENIX-30?
```
*Uses: `getTransitionsForJiraIssue`*

```
Find all team members
```
*Uses: `lookupJiraAccountId` with broad query*

### Structure Operations (Local Only)

These prompts work on the local tool but will need adaptation for real Jira:

```
Show me the full hierarchy under initiative PHOENIX-1
```
*Uses: `getJiraIssueHierarchy` - LOCAL ONLY*

```
What are all the children of PHOENIX-6?
```
*Uses: `getJiraIssueHierarchy` with depth=1 - LOCAL ONLY*

```
Make PHOENIX-46 block PHOENIX-47
```
*Uses: `linkJiraIssues` - LOCAL ONLY*

```
Move PHOENIX-42 to be a child of PHOENIX-5
```
*Uses: `moveJiraIssueInHierarchy` - LOCAL ONLY*

### Prompt Patterns That Transfer to Real Jira

| Practice Prompt (Local) | Same Prompt Works On Real Jira |
|------------------------|-------------------------------|
| "Find all bugs assigned to me" | ✅ Yes |
| "Create a story under epic X" | ✅ Yes |
| "Move issue to In Progress" | ✅ Yes |
| "Add comment to issue" | ✅ Yes |
| "Show issue hierarchy" | ⚠️ No - use standard getJiraIssue |
| "Link issues as blocking" | ⚠️ No - use Jira REST API |

---

## JQL Reference (Supported Syntax)

The local tool supports common JQL patterns:

### Operators

| Operator | Example | Description |
|----------|---------|-------------|
| `=` | `status = "In Progress"` | Exact match |
| `!=` | `assignee != null` | Not equal |
| `~` | `labels ~ "frontend"` | Contains |
| `IN` | `priority IN (High, Highest)` | Multiple values |
| `AND` | `type = Bug AND priority = High` | Both conditions |

### Fields

| Field | Example |
|-------|---------|
| `type` | `type = Bug` |
| `status` | `status = Done` |
| `priority` | `priority = High` |
| `assignee` | `assignee = "Sarah Chen"` |
| `reporter` | `reporter = "Mike Johnson"` |
| `sprint` | `sprint = "Sprint 4"` |
| `labels` | `labels ~ "security"` |
| `project` | `project = PHOENIX` |
| `storyPoints` | `storyPoints > 5` |

### Example JQL Queries

```sql
-- All high-priority bugs not done
type = Bug AND priority IN (High, Highest) AND status != Done

-- Issues in current sprint assigned to Sarah
sprint = "Sprint 4" AND assignee = "Sarah Chen"

-- Stories with frontend label
type = Story AND labels ~ "frontend"

-- Unassigned tasks
type = Task AND assignee = null
```

---

## Atlassian API Compatibility

This MCP server is designed to be **drop-in compatible** with the official Atlassian Rovo MCP Server. The test suite (`npm test`) verifies this compatibility.

### Tool Compatibility Matrix

| Tool | Local Server | Atlassian MCP | Compatibility |
|------|-------------|---------------|---------------|
| `searchJiraIssuesUsingJql` | ✅ | ✅ | **Full** - Same input/output |
| `getJiraIssue` | ✅ | ✅ | **Full** - Same format |
| `createJiraIssue` | ✅ | ✅ | **Full** - Same required fields |
| `editJiraIssue` | ✅ | ✅ | **Full** - Same field updates |
| `transitionJiraIssue` | ✅ | ✅ | **Full** - Same transitions |
| `getVisibleJiraProjects` | ✅ | ✅ | **Full** - Same structure |
| `getJiraProjectIssueTypesMetadata` | ✅ | ✅ | **Full** - Same format |
| `getJiraIssueTypeMetaWithFields` | ✅ | ✅ | **Full** - Same fields |
| `getTransitionsForJiraIssue` | ✅ | ✅ | **Full** - Same format |
| `lookupJiraAccountId` | ✅ | ✅ | **Full** - Same user format |
| `addCommentToJiraIssue` | ✅ | ✅ | **Full** - Same response |

### Response Format Compatibility

All responses follow Atlassian REST API conventions:

```json
// Issue response format (matches Atlassian)
{
  "id": "10001",
  "key": "PHOENIX-1",
  "fields": {
    "summary": "Issue title",
    "description": "Description text",
    "issuetype": { "name": "Bug" },
    "status": { "name": "In Progress" },
    "priority": { "name": "High" },
    "assignee": { "accountId": "user-1" },
    "reporter": { "accountId": "user-2" },
    "labels": ["frontend", "urgent"],
    "created": "2026-01-15T10:00:00.000Z",
    "updated": "2026-01-20T14:30:00.000Z"
  }
}
```

### Intentional Deviations: Structure Extension Tools

The following tools are **NOT part of the official Atlassian API**. They are custom extensions for learning Jira Structure concepts:

| Extension Tool | Purpose | Real Jira Alternative |
|---------------|---------|----------------------|
| `getJiraIssueHierarchy` | Get parent/child tree | Use `parent` field from `getJiraIssue` + recursive calls |
| `moveJiraIssueInHierarchy` | Change issue parent | Use `editJiraIssue` with `parent` field |
| `linkJiraIssues` | Create blocks/relates links | Use Jira REST API `/rest/api/3/issueLink` directly |

**Why these extensions exist:**
- Standard Jira API doesn't expose hierarchies as easily
- These tools simulate [Jira Structure plugin](https://marketplace.atlassian.com/apps/34717/structure) functionality
- Learning these concepts helps understand enterprise Jira patterns

**When using real Jira:**
- These 3 extension tools will NOT be available
- The skills transfer through understanding parent/child and link concepts
- You'll use the `parent` field in standard issue responses instead

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
