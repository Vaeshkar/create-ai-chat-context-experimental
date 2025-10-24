# 📖 CLI Commands Reference

**Complete guide to all `aice` commands.**

---

## 🚀 Getting Started

### Check Version

```bash
aice --version
# Output: 3.0.0
```

### Get Help

```bash
aice --help
# Shows all available commands
```

---

## 🔧 Core Commands

### 1. Initialize Project

**Purpose:** Set up automatic or manual conversation capture

```bash
# Interactive setup (recommended)
aice init

# Automatic mode (reads LLM data automatically)
aice init --automatic

# Manual mode (you ask LLM to update memory files)
aice init --manual

# Force overwrite existing setup
aice init --automatic --force
```

**What It Does:**
- Creates `.aicf/` directory for AI-optimized memory files
- Creates `.ai/` directory for human-readable documentation
- Creates `.watcher-config.json` with platform settings
- Creates `.aicf/.permissions.aicf` with consent audit trail
- Starts background watcher (automatic mode only)

**Output:**
```
✅ Project initialized in automatic mode
📁 Memory files created in .aicf/ and .ai/
🔐 Permissions recorded in .aicf/.permissions.aicf
⏰ Watcher started (checks every 5 minutes)
```

---

### 2. Migrate Existing Project

**Purpose:** Upgrade from v2.0.1 to experimental version

```bash
aice migrate
```

**What It Does:**
- Detects existing setup from v2.0.1
- Migrates configuration to new format
- Preserves existing memory files
- Updates permissions
- Restarts watcher

**Output:**
```
✅ Migration complete
📁 Existing memory files preserved
🔐 Permissions updated
⏰ Watcher restarted
```

---

### 3. Watch for New Conversations

**Purpose:** Monitor LLM platforms for new conversations

```bash
# Watch all enabled platforms (default)
aice watch

# Watch specific platforms
aice watch --augment
aice watch --warp
aice watch --claude-desktop
aice watch --claude-cli
aice watch --copilot
aice watch --chatgpt

# Watch multiple platforms
aice watch --augment --warp --claude-desktop

# Custom check interval (milliseconds)
aice watch --interval 60000    # Check every 60 seconds
aice watch --interval 300000   # Check every 5 minutes (default)

# Verbose output (show details)
aice watch --verbose

# Run in background (daemon mode)
aice watch --daemon

# Run in foreground (default)
aice watch --foreground
```

**What It Does:**
- Scans enabled LLM platforms for new conversations
- Extracts conversation data
- Processes and consolidates information
- Updates `.aicf/` and `.ai/` memory files
- Commits changes to git
- Runs every 5 minutes (configurable)

**Output:**
```
⏰ Checking platforms...
✅ Augment: 3 new conversations
✅ Warp: 1 new conversation
✅ Claude Desktop: 2 new conversations
📝 Processing conversations...
💾 Writing memory files...
📦 Committing to git...
✅ Done (5 conversations processed)
```

---

### 4. Manage Permissions

**Purpose:** View, grant, or revoke platform access

```bash
# List all permissions
aice permissions list

# Revoke access to a platform
aice permissions revoke augment
aice permissions revoke warp
aice permissions revoke claude-desktop
aice permissions revoke claude-cli
aice permissions revoke copilot
aice permissions revoke chatgpt

# Grant access to a platform
aice permissions grant augment
aice permissions grant warp
aice permissions grant claude-desktop
aice permissions grant claude-cli
aice permissions grant copilot
aice permissions grant chatgpt
```

**What It Does:**
- Lists all platforms and their permission status
- Revokes access to specific platforms
- Grants access to specific platforms
- Updates `.aicf/.permissions.aicf` with audit trail
- Logs all permission changes

**Output:**
```
📋 Platform Permissions

✅ augment         active     (explicit)
❌ warp            revoked    (explicit)
   Revoked at: 2025-10-24T11:39:12.081Z
✅ claude-desktop  active     (explicit)
✅ claude-cli      active     (explicit)
✅ copilot         active     (explicit)
✅ chatgpt         active     (explicit)
```

---

### 5. Process Checkpoint File

**Purpose:** Manually process a checkpoint file (manual mode)

```bash
aice checkpoint <file>
```

**Example:**
```bash
aice checkpoint ./checkpoint.json
```

**What It Does:**
- Reads checkpoint file
- Extracts conversation data
- Processes and consolidates information
- Updates `.aicf/` and `.ai/` memory files
- Commits changes to git

**Output:**
```
📖 Processing checkpoint...
✅ Extracted 5 conversations
📝 Processing conversations...
💾 Writing memory files...
📦 Committing to git...
✅ Done
```

---

### 6. Import Claude Exports

**Purpose:** Import exported Claude conversations

```bash
aice import-claude <file>
```

**Example:**
```bash
aice import-claude ./claude-export.json
```

**What It Does:**
- Reads Claude export file
- Parses conversation format
- Extracts conversation data
- Updates memory files
- Commits to git

**Output:**
```
📖 Importing Claude conversations...
✅ Parsed 10 conversations
📝 Processing conversations...
💾 Writing memory files...
📦 Committing to git...
✅ Done
```

---

### 7. View Statistics

**Purpose:** See knowledge base statistics

```bash
aice stats
```

**What It Does:**
- Counts total conversations
- Counts total decisions
- Counts total actions
- Shows memory file sizes
- Shows git commit count

**Output:**
```
📊 Knowledge Base Statistics

Conversations: 42
Decisions: 156
Actions: 89
Technical Work Items: 234

Memory Files:
  .aicf/conversations.aicf: 245 KB
  .aicf/decisions.aicf: 89 KB
  .ai/conversation-log.md: 512 KB

Git Commits: 127
```

---

### 8. Check Token Usage

**Purpose:** See token usage across models

```bash
# Top 4 models (default)
aice tokens

# All 16 models
aice tokens --all
```

**What It Does:**
- Analyzes all conversations
- Counts tokens per model
- Shows usage statistics
- Identifies most-used models

**Output:**
```
🔢 Token Usage (Top 4 Models)

1. Claude 3.5 Sonnet:  1,234,567 tokens
2. Claude 3 Opus:        987,654 tokens
3. GPT-4 Turbo:          654,321 tokens
4. Claude 3 Haiku:       456,789 tokens

Total: 3,333,331 tokens
```

---

## 🔐 Permission Management

### View Permissions

```bash
aice permissions list
```

Shows all platforms with their permission status:
- ✅ **active** - Tool can access this platform
- ❌ **revoked** - Tool cannot access this platform
- ⏳ **pending** - Awaiting user decision

### Revoke Access

```bash
aice permissions revoke warp
```

**Effect:**
- Warp platform will no longer be monitored
- Existing data is preserved
- Can be re-enabled anytime

### Grant Access

```bash
aice permissions grant warp
```

**Effect:**
- Warp platform will be monitored again
- Next `aice watch` will include this platform
- Audit trail updated

---

## 🎯 Common Workflows

### Workflow 1: Initial Setup

```bash
# 1. Initialize project
aice init

# 2. Select platforms
# (Choose which LLM platforms you use)

# 3. Watcher starts automatically
# (Checks every 5 minutes)

# 4. Check status
aice permissions list
```

### Workflow 2: Manual Monitoring

```bash
# 1. Run watcher manually
aice watch

# 2. Or watch specific platforms
aice watch --augment --claude-desktop

# 3. Check statistics
aice stats
```

### Workflow 3: Revoke Platform Access

```bash
# 1. List permissions
aice permissions list

# 2. Revoke platform
aice permissions revoke warp

# 3. Verify revocation
aice permissions list
```

### Workflow 4: Re-enable Platform

```bash
# 1. Grant permission
aice permissions grant warp

# 2. Run watcher
aice watch --warp

# 3. Verify data captured
aice stats
```

---

## 🚨 Troubleshooting

### Command Not Found

```bash
# Make sure aice is installed
npm install -g create-ai-chat-context

# Or use npx
npx aice --version
```

### Permission Denied

```bash
# Check permissions
aice permissions list

# Grant permission if needed
aice permissions grant <platform>
```

### No Conversations Found

```bash
# Check if platforms are enabled
aice permissions list

# Run watcher manually
aice watch --verbose

# Check if LLM data exists in expected locations
```

### Watcher Not Running

```bash
# Check if watcher is running
ps aux | grep aice

# Restart watcher
aice watch --daemon
```

---

## 📚 Related Documentation

- **[README.md](README.md)** - Quick start guide
- **[PRIVACY.md](PRIVACY.md)** - Privacy policy
- **[SECURITY.md](SECURITY.md)** - Security architecture
- **[docs/PERMISSION-AND-CONSENT-STRATEGY.md](docs/PERMISSION-AND-CONSENT-STRATEGY.md)** - Detailed consent flow

---

**Ready to capture your conversations? Start with: `aice init` 🚀**

