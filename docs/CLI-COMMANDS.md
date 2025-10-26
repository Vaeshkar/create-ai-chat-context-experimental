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

## 🔧 Core Commands (4 Total)

### 1. Initialize Project

**Purpose:** Set up automatic conversation capture in your project

```bash
# Interactive setup (recommended)
aice init

# Automatic mode (reads LLM data automatically)
aice init --automatic

# Force overwrite existing setup
aice init --automatic --force

# Verbose output
aice init --automatic --verbose
```

**What It Does:**

- Creates `.aicf/` directory structure (recent, sessions, medium, old, archive)
- Creates `.ai/` directory with 5 protected files
- Creates `.watcher-config.json` with platform settings
- Creates `.aicf/.permissions.aicf` with consent audit trail
- Asks which LLM platforms you use (only Augment works currently)

**Output:**

```
✅ Project initialized in automatic mode
📁 Created .aicf/ with Phase 6-8 structure
📁 Created .ai/ with 5 protected files
🔐 Permissions recorded in .aicf/.permissions.aicf
💡 Run 'aice watch' to start capturing conversations
```

---

### 2. Migrate Existing Project

**Purpose:** Upgrade from v2.0.1 to v3.x automatic mode

```bash
aice migrate

# Verbose output
aice migrate --verbose
```

**What It Does:**

- Detects old v2.0.1 files in `.aicf/`
- Moves them to `legacy_memory/` folder (preserves data)
- Creates new Phase 6-8 structure (recent, sessions, medium, old, archive)
- Updates permissions to automatic mode
- Asks which LLM platforms you use (only Augment works currently)

**Output:**

```
✅ Migration complete
📁 Old files moved to legacy_memory/ (preserved)
📁 Created new Phase 6-8 structure
🔐 Permissions updated
💡 Run 'aice watch' to start capturing conversations
```

---

### 3. Watch for New Conversations

**Purpose:** Monitor LLM platforms for new conversations (automatic mode)

```bash
# Watch all enabled platforms (default)
aice watch

# Watch specific platforms
aice watch --augment
aice watch --warp --claude-desktop --claude-cli

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
- Extracts conversation data from LLM libraries
- Runs full consolidation pipeline:
  1. **Cache-First** → Writes to `.cache/llm/`
  2. **CacheConsolidationAgent** → Consolidates to `.aicf/recent/`
  3. **SessionConsolidationAgent** → Groups by date to `.aicf/sessions/`
  4. **MemoryDropoffAgent** → Compresses by age to `.aicf/medium/old/archive/`
- Runs every 5 minutes (configurable)

**Output:**

```
⏰ Checking platforms...
✅ Augment: 3 new conversations
📝 Processing conversations...
💾 Cache → Recent → Sessions → Dropoff
✅ Done (3 conversations processed)
```

**Currently Working:**

- ✅ Augment (fully working)
- 🔒 Warp, Claude Desktop, Claude CLI, Copilot, ChatGPT (coming soon)

---

### 4. Manage Permissions

**Purpose:** View, grant, or revoke platform access

```bash
# List all permissions
aice permissions list

# Grant access to a platform
aice permissions grant augment
aice permissions grant warp

# Revoke access to a platform
aice permissions revoke augment
aice permissions revoke warp
```

**What It Does:**

- Lists all platforms and their permission status
- Grants access to specific platforms
- Revokes access to specific platforms
- Updates `.aicf/.permissions.aicf` with audit trail
- Logs all permission changes with timestamps

**Output:**

```
📋 Platform Permissions

✅ augment         active     (explicit)
   Granted at: 2025-10-25T10:00:00.000Z
❌ warp            revoked    (explicit)
   Revoked at: 2025-10-25T11:00:00.000Z
```

---

## 🔮 Future Enhancement (1 Total)

### 5. Import Claude Exports

**Purpose:** Import exported Claude conversations (future enhancement)

```bash
aice import-claude <file>

# With custom output directory
aice import-claude ./claude-export.json --output .cache/llm/claude

# Verbose output
aice import-claude ./claude-export.json --verbose
```

**What It Does:**

- Reads Claude export file (JSON format)
- Parses conversation format
- Writes to `.cache/llm/claude/` (cache-first approach ✅)
- ⚠️ **Does NOT trigger consolidation** (future enhancement needed)

**Future Enhancement Needed:**

After writing to cache, should trigger:

1. `CacheConsolidationAgent.consolidate()` → `.aicf/recent/`
2. `SessionConsolidationAgent.consolidate()` → `.aicf/sessions/`
3. `MemoryDropoffAgent.dropoff()` → `.aicf/medium/old/archive/`

**Current Workaround:**

After running `aice import-claude`, run `aice watch` to trigger consolidation.

**Output:**

```
📖 Importing Claude conversations...
✅ Parsed 10 conversations
💾 Written to .cache/llm/claude/
💡 Run 'aice watch' to consolidate into memory files
```

---

## 🎯 Common Workflows

### Workflow 1: Initial Setup (New Project)

```bash
# 1. Initialize project
aice init

# 2. Select platforms (only Augment works currently)
# (Interactive prompt will ask)

# 3. Start watcher
aice watch

# 4. Check permissions
aice permissions list
```

### Workflow 2: Migrate from v2.0.1

```bash
# 1. Migrate existing project
aice migrate

# 2. Old files moved to legacy_memory/
# 3. New Phase 6-8 structure created

# 4. Start watcher
aice watch

# 5. Verify permissions
aice permissions list
```

### Workflow 3: Revoke Platform Access

```bash
# 1. List permissions
aice permissions list

# 2. Revoke platform
aice permissions revoke augment

# 3. Verify revocation
aice permissions list
```

### Workflow 4: Re-enable Platform

```bash
# 1. Grant permission
aice permissions grant augment

# 2. Run watcher
aice watch --augment

# 3. Verify permissions
aice permissions list
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
