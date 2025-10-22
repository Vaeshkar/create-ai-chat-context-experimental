# Phase 5.5: Multi-Claude Detection & Consolidation Strategy

**Date:** October 22, 2025  
**Status:** Planning  
**Goal:** Support Claude Web, Desktop, and CLI simultaneously on same project

---

## 🎯 The Real-World Scenario

You work on the same project using **three Claude instances simultaneously**:

```
Project: create-ai-chat-context-experimental
├── Claude Web (claude.ai/code)
│   ├── Research & Planning
│   ├── GitHub context
│   └── Cloud-stored (Anthropic servers)
│
├── Claude Desktop (shell-mcp + gh-mcp)
│   ├── File operations
│   ├── Local filesystem context
│   └── Local storage
│
└── Claude CLI (VSCode window)
    ├── Development & coding
    ├── Terminal context
    └── CLI config storage
```

**Challenge:** Each instance has different context. They need **unified memory** so all three know what's been done.

---

## 📍 Storage Locations (Reality Check)

### Claude Web (claude.ai)
- **Storage:** Anthropic's cloud servers (AWS/GCP)
- **Access:** Only via browser or official API
- **Local Cache:** Browser IndexedDB/LocalStorage (partial)
- **Export:** Manual copy/paste or browser DevTools
- **Automatic Access:** ❌ NOT POSSIBLE (cloud-only, no local storage)

### Claude Desktop
- **Storage:** `~/Library/Application Support/Claude/` (macOS)
- **Access:** Direct filesystem access
- **Format:** Likely SQLite or JSON
- **Automatic Access:** ✅ POSSIBLE (local filesystem)

### Claude CLI
- **Storage:** `~/.claude/` or similar config directory
- **Access:** Direct filesystem access
- **Format:** Config files + conversation logs
- **Automatic Access:** ✅ POSSIBLE (local filesystem)

---

## 🏗️ Architecture: Three-Tier Detection System

### Tier 1: Detection Phase
```typescript
interface ClaudeDetection {
  web: {
    available: boolean;
    method: 'manual' | 'browser-extension' | 'none';
    note: 'Cloud-stored, requires manual export or browser extension';
  };
  desktop: {
    available: boolean;
    path: string;
    method: 'filesystem' | 'none';
  };
  cli: {
    available: boolean;
    path: string;
    method: 'filesystem' | 'none';
  };
}
```

### Tier 2: Extraction Phase
```
Claude Desktop (Automatic)
    ↓ ClaudeDesktopWatcher (5s polling)
    ↓ Extracts conversations from local storage
    ↓
Claude CLI (Automatic)
    ↓ ClaudeCliWatcher (5s polling)
    ↓ Extracts conversations from config
    ↓
Claude Web (Manual)
    ↓ ImportClaudeCommand (user-triggered)
    ↓ User exports from claude.ai/code
    ↓
Unified Message Stream
```

### Tier 3: Consolidation Phase
```
All Claude instances
    ↓
ConversationOrchestrator
    ├── Deduplication (by content hash)
    ├── Merging (same project context)
    ├── Linking (track which instance)
    └── Conflict resolution
    ↓
Unified .aicf/ + .ai/ files
```

---

## 🔄 Implementation Phases

### Phase 5.5a: Claude Detection System
**Goal:** Detect which Claude instances are available

```typescript
class ClaudeDetector {
  async detectAll(): Promise<ClaudeDetection> {
    return {
      web: await this.detectWeb(),
      desktop: await this.detectDesktop(),
      cli: await this.detectCli(),
    };
  }
  
  private async detectDesktop(): Promise<DesktopDetection> {
    // Check ~/Library/Application Support/Claude/
    // Return path if found
  }
  
  private async detectCli(): Promise<CliDetection> {
    // Check ~/.claude/ or similar
    // Return path if found
  }
  
  private async detectWeb(): Promise<WebDetection> {
    // Check browser storage (if extension available)
    // Return 'manual' if not
  }
}
```

### Phase 5.5b: Desktop & CLI Watchers
**Goal:** Automatic extraction from Desktop and CLI

```typescript
class ClaudeDesktopWatcher {
  async poll(): Promise<Message[]> {
    // Read from ~/Library/Application Support/Claude/
    // Parse conversations
    // Return new messages
  }
}

class ClaudeCliWatcher {
  async poll(): Promise<Message[]> {
    // Read from ~/.claude/
    // Parse conversations
    // Return new messages
  }
}
```

### Phase 5.5c: Web Import Enhancement
**Goal:** Keep manual import but make it first-class

```typescript
// Already exists: ImportClaudeCommand
// Just document it as primary method for Web
// Support batch imports
// Track source: 'claude-web'
```

### Phase 5.5d: Unified Consolidation
**Goal:** Merge all three sources into unified memory

```typescript
class MultiClaudeOrchestrator {
  async consolidate(
    webMessages: Message[],
    desktopMessages: Message[],
    cliMessages: Message[]
  ): Promise<ConsolidatedResult> {
    // Deduplicate by content hash
    // Merge by project context
    // Track source for each message
    // Generate unified memory files
  }
}
```

---

## 🎯 Key Decisions

### 1. Deduplication Strategy
**Problem:** When you "teleport" content from Web → Desktop, we might capture it twice

**Solution Options:**
- **A) Content Hash:** Hash message content, skip if hash exists
- **B) Conversation ID:** Track conversation IDs across instances
- **C) Timestamp + Content:** Combine timestamp + content hash

**Recommendation:** Option A (Content Hash) - simplest, most reliable

### 2. Source Tracking
**Problem:** Need to know which Claude instance each message came from

**Solution:** Add to Message metadata
```typescript
interface Message {
  // ... existing fields
  metadata?: {
    source: 'claude-web' | 'claude-desktop' | 'claude-cli';
    sourceTimestamp: string;
    // ... other fields
  };
}
```

### 3. Conflict Resolution
**Problem:** Same conversation edited in multiple instances

**Solution:** Keep all versions, track lineage
```typescript
interface ConversationVersion {
  conversationId: string;
  source: 'claude-web' | 'claude-desktop' | 'claude-cli';
  timestamp: string;
  content: string;
  hash: string;
}
```

### 4. Polling Strategy
**Question:** Should all three poll at same interval?

**Recommendation:**
- Desktop: 5s (local, fast)
- CLI: 5s (local, fast)
- Web: Manual only (cloud-based, no local storage)

---

## 📋 Implementation Checklist

### Phase 5.5a: Detection
- [ ] Create `ClaudeDetector` class
- [ ] Detect Desktop installation
- [ ] Detect CLI installation
- [ ] Detect Web (manual or extension)
- [ ] Add tests for detection

### Phase 5.5b: Desktop Watcher
- [ ] Create `ClaudeDesktopWatcher` class
- [ ] Parse Desktop storage format
- [ ] Extract conversations
- [ ] Add to watcher config
- [ ] Add tests

### Phase 5.5c: CLI Watcher
- [ ] Create `ClaudeCliWatcher` class
- [ ] Parse CLI config format
- [ ] Extract conversations
- [ ] Add to watcher config
- [ ] Add tests

### Phase 5.5d: Consolidation
- [ ] Create `MultiClaudeOrchestrator` class
- [ ] Implement deduplication (content hash)
- [ ] Implement source tracking
- [ ] Implement conflict resolution
- [ ] Add tests

### Phase 5.5e: Integration
- [ ] Update watcher to use multi-claude
- [ ] Update config to support all three
- [ ] Update CLI to show detection results
- [ ] Add documentation

---

## 🚀 Next Steps

**Before we start coding, we need to know:**

1. **Desktop Storage Format**
   - What's the exact path on your system?
   - What format? (SQLite, JSON, other?)
   - Can you share a sample?

2. **CLI Storage Format**
   - What's the exact path?
   - What format?
   - Can you share a sample?

3. **Priority**
   - Start with Desktop (most accessible)?
   - Or CLI (most integrated)?
   - Or both simultaneously?

4. **Deduplication**
   - Content hash approach OK?
   - Any other requirements?

---

## 📊 Expected Outcome

After Phase 5.5, you'll have:

```
✅ Automatic detection of all Claude instances
✅ Automatic polling of Desktop (5s)
✅ Automatic polling of CLI (5s)
✅ Manual import for Web (user-triggered)
✅ Unified memory across all three
✅ Deduplication to avoid duplicates
✅ Source tracking to know which instance each message came from
✅ Conflict resolution for same conversation in multiple instances
```

**Result:** All three Claude instances feed into one unified memory system. You can work in any instance and all three will know what's been done.

---

**Ready to start Phase 5.5?**

