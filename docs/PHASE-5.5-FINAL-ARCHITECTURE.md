# Phase 5.5: Final Architecture - Multi-Claude with Teleportation

**Date:** October 22, 2025  
**Status:** Ready to Implement  
**Goal:** Complete multi-Claude support with automatic capture via teleportation

---

## 🎯 The Complete Picture

### Three Claude Instances, One Unified Memory

```
┌─────────────────────────────────────────────────────────────┐
│ Project: create-ai-chat-context-experimental                │
└─────────────────────────────────────────────────────────────┘

RESEARCH PHASE
├── Claude Web (claude.ai/code)
│   ├── Research architecture
│   ├── Plan implementation
│   ├── Design decisions
│   └── Cloud-stored on Anthropic servers
│
└── [User teleports content to local]

DEVELOPMENT PHASE
├── Claude CLI (VSCode window)
│   ├── Code development
│   ├── Terminal integration
│   ├── Local storage: ~/.claude/projects/
│   └── Format: JSONL (one JSON per line)
│
├── Claude Desktop (shell-mcp + gh-mcp)
│   ├── File operations
│   ├── Shell commands
│   ├── Local storage: ~/Library/Application Support/Claude/
│   └── Format: SQLite database
│
└── [Both automatically captured]

MEMORY CONSOLIDATION
├── ClaudeCliWatcher (5s polling)
│   └── Reads ~/.claude/projects/{project}/{session}.jsonl
│
├── ClaudeDesktopWatcher (5s polling)
│   └── Reads ~/Library/Application Support/Claude/conversations.db
│
├── MultiClaudeOrchestrator
│   ├── Deduplicates by content hash
│   ├── Merges conversations
│   ├── Tracks source (CLI/Desktop/Web)
│   └── Handles conflicts
│
└── Unified Memory Files
    ├── .aicf/conversations.aicf
    ├── .aicf/decisions.aicf
    ├── .ai/conversation-log.md
    └── .ai/next-steps.md
```

---

## 📊 Storage Formats

### Claude Code (CLI) - JSONL
```
~/.claude/projects/-home-user-create-ai-chat-context-experimental/afd5bf86-45b7-4554-bdc5-176d1161e230.jsonl

Format: One JSON object per line
Contains:
  - type: "message"
  - role: "user" | "assistant"
  - content: string
  - timestamp: ISO string
  - uuid: unique ID
  - tokenUsage: { input, output }
  - thinking: string (for extended thinking)
  - metadata: { gitBranch, workingDirectory, version }
```

### Claude Desktop - SQLite
```
~/Library/Application Support/Claude/conversations.db

Format: SQLite database
Contains:
  - Full conversation history
  - Attachments and images
  - File uploads
  - Metadata and timestamps
```

### Claude Web - Cloud
```
Anthropic's servers (AWS/GCP)

Access: Via teleportation to CLI/Desktop
Capture: Automatic once teleported locally
```

---

## 🔄 The Teleportation Workflow

### Step 1: Research in Claude Web
```
User: "Let me research the architecture..."
Claude Web: [Stores on Anthropic servers]
```

### Step 2: Teleport to Local
```
User: "I'll copy this to my CLI"
[Copy conversation or reference it]
```

### Step 3: Paste in Claude CLI/Desktop
```
User: "Here's what we discussed..."
[Paste content into new session]
Claude CLI/Desktop: [Stores locally]
```

### Step 4: Automatic Capture
```
ClaudeCliWatcher: [Polls every 5 seconds]
ClaudeDesktopWatcher: [Polls every 5 seconds]
[Detects new content]
```

### Step 5: Unified Memory
```
MultiClaudeOrchestrator: [Deduplicates & merges]
.aicf/ + .ai/ files: [Updated with all content]
```

---

## 🏗️ Implementation Phases

### Phase 5.5a: Claude Code (CLI) Parser
**Status:** Ready to implement

**Components:**
- `ClaudeCliParser` - Parse JSONL format
- `ClaudeCliWatcher` - Poll for new sessions
- Tests - 8 comprehensive test cases

**Input:** `~/.claude/projects/{project}/{session}.jsonl`  
**Output:** `Message[]` with full metadata

---

### Phase 5.5b: Claude Desktop Parser
**Status:** Planned

**Components:**
- `ClaudeDesktopParser` - Parse SQLite format
- `ClaudeDesktopWatcher` - Poll for new conversations
- Tests - Comprehensive test cases

**Input:** `~/Library/Application Support/Claude/conversations.db`  
**Output:** `Message[]` with full metadata

---

### Phase 5.5c: Multi-Claude Consolidation
**Status:** Planned

**Components:**
- `MultiClaudeOrchestrator` - Merge all sources
- Deduplication logic (content hash)
- Source tracking (which instance)
- Conflict resolution

**Input:** Messages from CLI, Desktop, Web (via teleportation)  
**Output:** Unified `.aicf/` and `.ai/` files

---

## ✅ Key Advantages

### No Special Permissions Needed
- ❌ No cloud API access
- ❌ No browser extension
- ❌ No authentication tokens
- ✅ Just read local files

### 100% Coverage
- ✅ Claude Web (via teleportation)
- ✅ Claude Desktop (automatic)
- ✅ Claude CLI (automatic)

### User Control
- ✅ User decides when to teleport
- ✅ User owns all local data
- ✅ Can revoke access anytime
- ✅ Full transparency

### Simple Architecture
- ✅ No complex cloud integration
- ✅ No browser automation
- ✅ No special handling
- ✅ Just parse local files

---

## 📋 Implementation Checklist

### Phase 5.5a: Claude Code Parser
- [ ] Create `ClaudeCliParser.ts`
- [ ] Create `ClaudeCliWatcher.ts`
- [ ] Create `ClaudeCliParser.test.ts` (8 tests)
- [ ] Test with real session file
- [ ] Integrate into watcher config
- [ ] Update CLI to show detection

### Phase 5.5b: Claude Desktop Parser
- [ ] Determine SQLite schema
- [ ] Create `ClaudeDesktopParser.ts`
- [ ] Create `ClaudeDesktopWatcher.ts`
- [ ] Create tests
- [ ] Test with real database
- [ ] Integrate into watcher config

### Phase 5.5c: Consolidation
- [ ] Create `MultiClaudeOrchestrator.ts`
- [ ] Implement deduplication
- [ ] Implement source tracking
- [ ] Implement conflict resolution
- [ ] Create tests
- [ ] Generate unified memory files

### Phase 5.5d: Documentation
- [ ] Document teleportation workflow
- [ ] Create user guide
- [ ] Update README
- [ ] Add examples
- [ ] Update permission strategy

---

## 🚀 Next Steps

**Ready to start Phase 5.5a?**

I will:
1. Create `ClaudeCliParser.ts` - Parse JSONL format
2. Create `ClaudeCliWatcher.ts` - Watch for new sessions
3. Create comprehensive tests
4. Test with your actual session file
5. Integrate into watcher

**Expected outcome:**
- ✅ Automatic capture of Claude CLI conversations
- ✅ Includes teleported Claude Web content
- ✅ Full metadata preserved (tokens, thinking, git branch, etc.)
- ✅ Ready for Phase 5.5b (Desktop)

---

## 💡 The Philosophy

**"No LLM left behind"**

Each platform contributes its context to the unified memory:
- **Claude Web:** Via teleportation (user-initiated)
- **Claude Desktop:** Via automatic polling (5s)
- **Claude CLI:** Via automatic polling (5s)

Result: Complete, unified memory of all work across all three instances.

---

**Ready to implement Phase 5.5a?** 🚀

