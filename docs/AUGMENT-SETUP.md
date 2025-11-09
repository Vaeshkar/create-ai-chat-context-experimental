# 🚀 AETHER + Augment Setup Guide

**Complete guide to configure AETHER MCP server with Augment.**

---

## 📋 Prerequisites

1. ✅ **AETHER installed** - `npm install -g aether` or built from source
2. ✅ **Augment VSCode extension** - Installed and activated
3. ✅ **Node.js 18+** - Required for MCP server

---

## 🎯 Step-by-Step Setup

### **Step 1: Initialize AETHER in Your Project**

```bash
cd /path/to/your/project
aether init
```

This creates:
- `.lill/` - Memory storage directory
- `.lill/.permissions.aicf` - Platform permissions
- `.lill/.watcher-config.json` - Watcher configuration

### **Step 2: Start the Watcher**

```bash
aether watch-terminal
```

This:
- Captures conversations from Augment's LevelDB
- Extracts principles using LILL-Meta
- Builds QuadIndex (4-store RAG system)
- Creates snapshots every 5 minutes

**Leave this running in a separate terminal window!**

### **Step 3: Wait for Initial Data Collection**

The watcher needs time to:
1. Scan Augment's conversation database
2. Extract principles from conversations
3. Build the initial QuadIndex snapshot

**Recommended:** Wait 5-10 minutes for the first snapshot to be created.

Check progress:
```bash
# In another terminal
aether quad-stats
```

You should see:
```
📊 QuadIndex Statistics

Principles: 50+ (grows over time)
Relationships: 1000+ (grows over time)
Hypotheticals: 20+ (grows over time)
```

### **Step 4: Configure Augment MCP**

**Option A: Augment Settings UI** (Recommended)

1. Open VSCode
2. Click Augment icon in sidebar
3. Click gear icon (⚙️) for settings
4. Scroll to "MCP Servers" section
5. Click "Add Server" or "Import from JSON"
6. Paste this configuration:

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
        "AETHER_VERBOSE": "false"
      }
    }
  }
}
```

7. **Replace `/Users/YOUR_USERNAME/Programming/aether`** with your actual AETHER installation path
8. Click "Save"
9. Restart Augment (if prompted)

**Option B: Manual Configuration File**

Create `.augment/mcp-config.json` in your project root:

```json
{
  "mcpServers": {
    "aether": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/Programming/aether/packages/aether/dist/esm/aether/src/mcp/server.js"
      ],
      "env": {
        "AETHER_PROJECT_DIR": "/Users/YOUR_USERNAME/Programming/your-project",
        "AETHER_VERBOSE": "false"
      }
    }
  }
}
```

**Important:** Replace both paths with your actual paths!

### **Step 5: Verify MCP Server is Working**

**Test 1: Check Augment recognizes the MCP server**

1. Open Augment chat
2. Type: `/mcp list`
3. You should see: `aether` in the list

**Test 2: Query AETHER manually**

1. Type: `/mcp call aether get_project_stats`
2. You should see your project statistics (principles, relationships, etc.)

**Test 3: Ask a question**

1. Type: "What are my project principles about error handling?"
2. Augment should automatically query AETHER and cite principles like P42, P87, etc.

---

## ✅ Success Criteria

**You know it's working when:**

1. ✅ Watcher is running (`aether status` shows "Running")
2. ✅ QuadIndex has data (`aether quad-stats` shows principles)
3. ✅ Augment lists AETHER in MCP servers (`/mcp list`)
4. ✅ Augment automatically cites principles in responses (P42, P87, etc.)

---

## 🐛 Troubleshooting

### **Problem: Augment doesn't list AETHER MCP server**

**Solution:**
1. Check MCP config path is correct
2. Verify AETHER is built: `ls packages/aether/dist/esm/aether/src/mcp/server.js`
3. Restart Augment completely (close VSCode, reopen)

### **Problem: MCP server starts but returns no data**

**Solution:**
1. Check watcher is running: `aether status`
2. Check QuadIndex has data: `aether quad-stats`
3. Wait 5-10 minutes for initial snapshot
4. Check `.lill/snapshots/rolling/` has files

### **Problem: "Cannot find module" error**

**Solution:**
1. Rebuild AETHER: `cd packages/aether && npm run build`
2. Verify path in MCP config matches actual file location
3. Use absolute paths (not relative)

### **Problem: Augment queries AETHER but gets empty results**

**Solution:**
1. Check project directory is correct: `AETHER_PROJECT_DIR` in MCP config
2. Verify `.lill/` directory exists in that project
3. Check snapshots exist: `ls .lill/snapshots/rolling/`

---

## 🎯 What Happens Next?

**Once configured:**

1. **Automatic Context Loading** - Augment queries AETHER on every request
2. **No Manual Steps** - No need to run `aether quad-query` manually
3. **Continuous Learning** - Watcher captures new conversations, updates QuadIndex
4. **Growing Memory** - More conversations = more principles = better context

**Example workflow:**

```
You: "How should I structure my tests?"

Augment: *automatically queries AETHER MCP*
Augment: *gets P42, P87, P103 about testing*
Augment: "Based on your project principles:
         - P42: Tests should follow AAA pattern (Arrange, Act, Assert)
         - P87: Each test file should mirror source file structure
         - P103: Integration tests go in tests/integration/"
```

**No manual steps! Just works!** ✨

---

## 📊 Monitoring

### **Check Watcher Status**

```bash
aether status
```

### **Check QuadIndex Statistics**

```bash
aether quad-stats
```

### **Query Principles Manually**

```bash
aether quad-query "error handling" -l 5
```

### **View Recent Principles**

```bash
aether quad-query "recent updates" -l 10
```

---

## 🔥 Advanced Configuration

### **Enable Verbose Logging**

Set `AETHER_VERBOSE: "true"` in MCP config to see detailed logs.

### **Multiple Projects**

Create separate MCP configs for each project:

```json
{
  "mcpServers": {
    "aether-project-a": {
      "command": "node",
      "args": ["/path/to/aether/dist/esm/aether/src/mcp/server.js"],
      "env": {
        "AETHER_PROJECT_DIR": "/path/to/project-a"
      }
    },
    "aether-project-b": {
      "command": "node",
      "args": ["/path/to/aether/dist/esm/aether/src/mcp/server.js"],
      "env": {
        "AETHER_PROJECT_DIR": "/path/to/project-b"
      }
    }
  }
}
```

---

## 🎉 You're Done!

**AETHER is now your AI's second brain!**

Every conversation is captured, every principle is indexed, and Augment automatically uses your project context on every request.

**Welcome to the future of AI-assisted development!** 🚀

