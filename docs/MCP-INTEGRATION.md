# 🔌 AETHER MCP Integration

**Model Context Protocol (MCP) integration for AETHER**

Make Augment, Claude Desktop, Cursor, and other MCP-compatible tools automatically use your project's AETHER memory!

---

## 🎯 What is MCP?

**Model Context Protocol (MCP)** is a standard created by Anthropic for AI tools to access external data sources.

**Benefits:**

- ✅ **Automatic context loading** - No manual steps needed
- ✅ **Works with multiple tools** - Augment, Claude Desktop, Cursor, etc.
- ✅ **Local execution** - All data stays on your machine
- ✅ **Real-time updates** - Always uses latest QuadIndex snapshot

---

## 🚀 Quick Start

### **Step 1: Start Watcher** (if not already running)

```bash
aether watch-terminal
```

This captures conversations and builds QuadIndex.

### **Step 2: Configure Augment**

1. Open Augment settings (gear icon in VSCode)
2. Scroll to "MCP" section
3. Click "Import from JSON"
4. Paste this configuration:

```json
{
  "mcpServers": {
    "aether": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/Programming/aether/packages/aether/dist/esm/aether/src/mcp/server.js"
      ],
      "env": {
        "AETHER_PROJECT_DIR": "${workspaceFolder}",
        "AETHER_VERBOSE": "false",
        "AETHER_INCLUDE_RELATIONSHIPS": "true",
        "AETHER_INCLUDE_REASONING": "true"
      }
    }
  }
}
```

**Important:** Replace `/Users/YOUR_USERNAME/Programming/aether` with your actual AETHER installation path!

**Environment Variables:**

- `AETHER_PROJECT_DIR` - Project directory (default: current working directory)
- `AETHER_VERBOSE` - Enable verbose logging (default: `false`)
- `AETHER_INCLUDE_RELATIONSHIPS` - Always include relationship graph (default: `true`)
- `AETHER_INCLUDE_REASONING` - Always include reasoning with alternatives (default: `true`)

5. Click "Save"
6. Restart Augment (if needed)

### **Step 3: Use Augment Normally**

Ask questions—Augment automatically queries AETHER!

**Example:**

```
You: "How should I handle errors?"

Augment: *queries AETHER MCP*
Augment: "Based on your project principles (P42), use Result type for error handling.
          Also log errors with context (P87) and return structured responses (P103)."
```

**No manual steps! No rules! Just works!** ✨

---

## 🛠️ Configuration

### **Augment (VSCode Extension)**

**Method 1: Import from JSON** (recommended)

1. Open Augment settings
2. Click "Import from JSON"
3. Paste configuration (see above)

**Method 2: Manual Configuration**

1. Open Augment settings
2. Add MCP server:
   - **Name:** `aether`
   - **Command:** `npx`
   - **Args:** `["tsx", "/path/to/aether/packages/aether/src/mcp/server.ts"]`
   - **Env:** `{"AETHER_PROJECT_DIR": "${workspaceFolder}"}`

### **Claude Desktop**

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aether": {
      "command": "npx",
      "args": ["tsx", "/Users/leeuwen/Programming/aether/packages/aether/src/mcp/server.ts"],
      "env": {
        "AETHER_PROJECT_DIR": "/path/to/your/project",
        "AETHER_INCLUDE_RELATIONSHIPS": "true",
        "AETHER_INCLUDE_REASONING": "true"
      }
    }
  }
}
```

### **Cursor**

Add to Cursor settings (similar to Augment).

---

## 🔧 Manual Testing

Test the MCP server manually:

```bash
# Start MCP server
aether mcp --verbose

# In another terminal, send MCP request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"query_principles","arguments":{"query":"error handling","limit":3}}}' | aether mcp
```

---

## 📊 Available Tools

### **1. query_principles**

Search for principles using QuadIndex.

**Arguments:**

- `query` (string, required) - Search query text
- `limit` (number, optional) - Maximum results (default: 10)
- `status` (string, optional) - Filter by status (validated, proposed, rejected, deprecated)
- `minConfidence` (number, optional) - Minimum confidence (0-1)
- `includeRelationships` (boolean, optional) - Include relationship graph (default: from `AETHER_INCLUDE_RELATIONSHIPS` env var, or `true`)
- `relationshipDepth` (number, optional) - Traversal depth (default: 2)
- `includeReasoning` (boolean, optional) - Include reasoning (alternatives, lessons) (default: from `AETHER_INCLUDE_REASONING` env var, or `true`)
- `reasoningIterations` (number, optional) - Reasoning iterations (default: 3)

**Note:** The defaults for `includeRelationships` and `includeReasoning` are controlled by environment variables. Set `AETHER_INCLUDE_RELATIONSHIPS=false` or `AETHER_INCLUDE_REASONING=false` to disable automatic inclusion.

**Example:**

```json
{
  "query": "error handling",
  "limit": 5,
  "status": "validated",
  "minConfidence": 0.8,
  "includeRelationships": true
}
```

### **2. get_project_stats**

Get project statistics from QuadIndex.

**Arguments:** None

**Returns:**

- Total principles
- Principles by status (validated, proposed, rejected, deprecated)
- Total relationships
- Relationships by type
- Reasoning statistics (hypotheticals, rejected alternatives)

### **3. traverse_graph**

Traverse relationship graph from a specific principle.

**Arguments:**

- `principleId` (string, required) - Principle ID to start from
- `depth` (number, optional) - Maximum depth (default: 2)
- `relationshipTypes` (array, optional) - Types to follow

### **4. get_recent_principles**

Get recently added or updated principles.

**Arguments:**

- `days` (number, optional) - Days to look back (default: 7)
- `limit` (number, optional) - Maximum results (default: 10)

---

## 📦 Available Resources

### **aether://project-context**

Project statistics and metadata from QuadIndex.

**Returns:** Same as `get_project_stats` tool.

---

## 🎯 Example Prompts

**Basic query:**

```
You: "What are the project principles?"
Augment: *calls query_principles*
```

**Relationship query:**

```
You: "What depends on TypeScript strict mode?"
Augment: *calls query_principles with includeRelationships: true*
```

**Reasoning query:**

```
You: "Should we use microservices?"
Augment: *calls query_principles with includeReasoning: true*
```

**Stats query:**

```
You: "How many principles do we have?"
Augment: *calls get_project_stats*
```

---

## 🐛 Troubleshooting

### **MCP server not starting**

**Check:**

1. Watcher is running: `aether watch-terminal`
2. Snapshots exist: `ls .lill/snapshots/rolling/`
3. Path is correct in MCP config

**Fix:**

```bash
# Restart watcher
aether watch-terminal

# Wait 5 minutes for snapshot
# Then restart Augment
```

### **Augment not calling MCP server**

**Check:**

1. MCP config is saved in Augment settings
2. Augment is restarted after config change
3. Project has `.lill/` directory

**Fix:**

```bash
# Verify MCP config
cat ~/Library/Application\ Support/Augment/mcp_config.json

# Restart Augment
# Cmd+Shift+P → "Reload Window"
```

### **Empty results**

**Check:**

1. Watcher has collected data: `aether quad-stats`
2. Snapshots are recent: `ls -lh .lill/snapshots/rolling/`

**Fix:**

```bash
# Check stats
aether quad-stats

# If empty, wait for watcher to collect data
# Or manually trigger snapshot
aether snapshot take
```

---

## 🔥 What This Replaces

**Before MCP (manual workflow):**

```
You: "How should I handle errors?"
You: *manually runs* aether quad-query "error handling" -j
You: *copies output*
You: *pastes to Augment*
Augment: "Oh, based on your principles, use Result type"
```

**After MCP (automatic workflow):**

```
You: "How should I handle errors?"
Augment: *automatically queries AETHER MCP*
Augment: "Based on your project principles (P42), use Result type..."
```

**ONE STEP instead of FOUR!** 🚀

---

## 📚 Learn More

- **MCP Specification:** https://modelcontextprotocol.io/
- **Augment MCP Docs:** https://docs.augmentcode.com/mcp
- **AETHER Docs:** `packages/aether/README.md`

---

**Questions? Issues? Open an issue on GitHub!** 🦆
