# Claude Storage Formats - Complete Reference

**Date:** October 22, 2025  
**Status:** Documented  
**Source:** Direct inspection of storage locations

---

## 📍 Storage Locations & Formats

### 1. Claude Code (CLI) - JSONL Format

**Location:**
```
~/.claude/projects/{sanitized-project-path}/{session-id}.jsonl
```

**Example Path:**
```
~/.claude/projects/-home-user-create-ai-chat-context-experimental/afd5bf86-45b7-4554-bdc5-176d1161e230.jsonl
```

**Format:** JSONL (JSON Lines) - one JSON object per line

**Contains:**
- ✅ Messages (user + assistant)
- ✅ Timestamps
- ✅ UUIDs
- ✅ Session IDs
- ✅ Token usage
- ✅ Thinking blocks
- ✅ Git branch
- ✅ Working directory
- ✅ Version info

**Additional Files:**
```
~/.claude/settings.json          # User settings & hooks
~/.claude/todos/                 # Task lists per session
~/.claude/shell-snapshots/       # Shell state snapshots
```

**Example Message Structure:**
```json
{
  "type": "message",
  "role": "user|assistant",
  "content": "...",
  "timestamp": "2025-10-22T10:00:00Z",
  "uuid": "...",
  "sessionId": "afd5bf86-45b7-4554-bdc5-176d1161e230",
  "tokenUsage": { "input": 100, "output": 50 },
  "thinking": "...",
  "metadata": {
    "gitBranch": "main",
    "workingDirectory": "/Users/leeuwen/Programming/create-ai-chat-context-experimental",
    "version": "..."
  }
}
```

---

### 2. Claude Desktop App - SQLite Format

**Location (macOS):**
```
~/Library/Application Support/Claude/
```

**Location (Linux):**
```
~/.config/Claude/
```

**Location (Windows):**
```
%APPDATA%\Claude\
```

**Format:** SQLite database (typically `conversations.db` or similar)

**Contains:**
- ✅ Full conversation history
- ✅ Attachments
- ✅ Images
- ✅ File uploads
- ✅ Metadata
- ✅ Timestamps

**Characteristics:**
- ✅ Offline access available
- ✅ Can be backed up/transferred
- ✅ Persistent across sessions
- ✅ Synced across devices (if using Claude account)

---

### 3. Claude Web (claude.ai) - Cloud Storage

**Location:**
```
Anthropic's cloud servers (AWS/GCP infrastructure)
```

**Access:**
- Via API calls to Anthropic's backend
- Not stored on local machine (except browser cache)
- Requires authentication

**Browser Local Storage (Caching Only):**
```
Browser DevTools → Application → Storage
├── IndexedDB: claude.ai
├── LocalStorage: claude.ai
└── Session Storage: temporary UI state
```

**Note:** Browser storage is just caching for performance. Source of truth is Anthropic's servers.

---

## 📊 Comparison Table

| Aspect | Claude Web | Claude Desktop | Claude Code (CLI) |
|--------|-----------|----------------|-------------------|
| **Storage** | Cloud | Local | Local |
| **Location** | Anthropic servers | ~/Library/Application Support/Claude/ | ~/.claude/projects/ |
| **Format** | Database (cloud) | SQLite | JSONL |
| **Offline Access** | ❌ No | ✅ Yes | ✅ Yes |
| **Automatic Sync** | ✅ Yes (cloud) | ✅ Yes (device sync) | ❌ No |
| **Attachments** | ✅ Yes | ✅ Yes | ❌ No |
| **Local Backup** | ❌ No | ✅ Yes | ✅ Yes |
| **Accessibility** | Browser only | Desktop app | Terminal/CLI |

---

## 🔄 Implementation Strategy

### Phase 5.5a: Claude Code (CLI) Parser

**Task:** Parse JSONL files from `~/.claude/projects/`

```typescript
class ClaudeCliParser {
  parse(jsonlContent: string): Result<Message[]> {
    // Split by newlines
    // Parse each line as JSON
    // Extract messages
    // Return Message[]
  }
}
```

**Key Points:**
- Read JSONL file line by line
- Each line is a complete JSON object
- Extract role, content, timestamp
- Preserve metadata (git branch, working directory)

---

### Phase 5.5b: Claude Desktop Parser

**Task:** Parse SQLite database from `~/Library/Application Support/Claude/`

```typescript
class ClaudeDesktopParser {
  parse(dbPath: string): Result<Message[]> {
    // Open SQLite database
    // Query conversations table
    // Extract messages
    // Return Message[]
  }
}
```

**Key Points:**
- Need to determine exact table structure
- Query conversation history
- Extract attachments/images if needed
- Handle binary data

---

### Phase 5.5c: Claude Web (Manual Import)

**Task:** Keep existing `ImportClaudeCommand` for Web

**Note:** Web is cloud-only, no automatic polling possible. Manual import via export is the only option.

---

## 🎯 Next Steps

### 1. Inspect Claude Code Storage
```bash
# Check structure
ls -la ~/.claude/projects/

# Look at a session file
cat ~/.claude/projects/-home-user-create-ai-chat-context-experimental/afd5bf86-45b7-4554-bdc5-176d1161e230.jsonl | head -5

# Count lines
wc -l ~/.claude/projects/-home-user-create-ai-chat-context-experimental/afd5bf86-45b7-4554-bdc5-176d1161e230.jsonl
```

### 2. Inspect Claude Desktop Storage
```bash
# Check if Desktop app is installed
ls -la ~/Library/Application\ Support/Claude/

# Look for database files
find ~/Library/Application\ Support/Claude/ -name "*.db" -o -name "*.sqlite"

# Check file types
file ~/Library/Application\ Support/Claude/*
```

### 3. Determine Priority
- **Start with Claude Code (CLI):** JSONL is simpler to parse
- **Then Claude Desktop:** SQLite requires database library
- **Keep Web as manual:** No local storage to parse

---

## 📋 Implementation Checklist

### Phase 5.5a: Claude Code (CLI) Watcher
- [ ] Create `ClaudeCliParser` class
- [ ] Parse JSONL format
- [ ] Extract messages with metadata
- [ ] Create `ClaudeCliWatcher` class
- [ ] Poll `~/.claude/projects/` directory
- [ ] Detect new sessions
- [ ] Add to watcher config
- [ ] Add tests

### Phase 5.5b: Claude Desktop Watcher
- [ ] Determine SQLite table structure
- [ ] Create `ClaudeDesktopParser` class
- [ ] Parse SQLite database
- [ ] Extract messages with attachments
- [ ] Create `ClaudeDesktopWatcher` class
- [ ] Poll `~/Library/Application Support/Claude/`
- [ ] Add to watcher config
- [ ] Add tests

### Phase 5.5c: Multi-Claude Consolidation
- [ ] Create `MultiClaudeOrchestrator`
- [ ] Implement deduplication (content hash)
- [ ] Implement source tracking
- [ ] Merge conversations
- [ ] Generate unified memory files
- [ ] Add tests

### Phase 5.5d: Integration
- [ ] Update watcher to use multi-claude
- [ ] Update CLI to show detection results
- [ ] Update config to support all three
- [ ] Add documentation

---

## 🚀 Ready to Start?

**Recommendation:** Start with Phase 5.5a (Claude Code/CLI) because:
1. JSONL format is simpler than SQLite
2. You're actively using it right now
3. Easier to test and validate
4. Can then move to Desktop (SQLite)

Should we start implementing the Claude Code parser?

