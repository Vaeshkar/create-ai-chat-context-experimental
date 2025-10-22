# Phase 5.5d: Multi-Claude Integration Guide

**Date:** October 22, 2025  
**Status:** Technical integration documentation  
**Audience:** Developers integrating multi-Claude support

---

## 🏗️ Architecture Overview

### Component Hierarchy

```
WatcherCommand (main entry point)
    ↓
ClaudeCliWatcher (polls ~/.claude/projects/)
    ↓ ClaudeCliParser (parses JSONL)
    ↓ Message[]

ClaudeDesktopWatcher (polls ~/Library/Application Support/Claude/)
    ↓ ClaudeDesktopParser (parses SQLite)
    ↓ Message[]

ImportClaudeCommand (manual import)
    ↓ ClaudeParser (parses JSON export)
    ↓ Message[]

    ↓ ↓ ↓

MultiClaudeOrchestrator
    ├── consolidate() - Merge all sources
    ├── deduplicate() - Remove duplicates
    ├── addSource() - Track source
    └── groupByConversation() - Group messages

    ↓

ConversationOrchestrator (existing)
    ├── analyze() - Extract insights
    ├── summarize() - Generate summary
    └── generateMemory() - Create memory files

    ↓

Memory Files (.aicf/ + .ai/)
```

---

## 📦 Component Details

### 1. ClaudeCliWatcher

**Location:** `src/watchers/ClaudeCliWatcher.ts`

**Purpose:** Detect and read Claude CLI sessions

**Methods:**
```typescript
isAvailable(): boolean
getProjectSessions(projectPath: string): Result<Message[]>
getLatestSession(projectPath: string): Result<Message[]>
getAvailableProjects(): Result<string[]>
getSessionCount(projectPath: string): Result<number>
```

**Storage:** `~/.claude/projects/`

**Format:** JSONL (JSON Lines)

### 2. ClaudeDesktopWatcher

**Location:** `src/watchers/ClaudeDesktopWatcher.ts`

**Purpose:** Detect and read Claude Desktop database

**Methods:**
```typescript
isAvailable(): boolean
getAllMessages(): Result<Message[]>
getNewMessages(): Result<Message[]>
getDatabasePath(): string | null
getStoragePath(): string
```

**Storage:** `~/Library/Application Support/Claude/`

**Format:** SQLite database

### 3. ClaudeParser

**Location:** `src/parsers/ClaudeParser.ts`

**Purpose:** Parse Claude Web JSON exports

**Methods:**
```typescript
parse(data: unknown): Result<Message[]>
```

**Format:** JSON export from claude.ai/code

### 4. MultiClaudeOrchestrator

**Location:** `src/orchestrators/MultiClaudeOrchestrator.ts`

**Purpose:** Consolidate messages from all sources

**Methods:**
```typescript
consolidate(
  webMessages: Message[],
  desktopMessages: Message[],
  cliMessages: Message[]
): Result<ConsolidationResult>

groupByConversation(messages: SourcedMessage[]): Map<string, SourcedMessage[]>
filterBySource(messages: SourcedMessage[], source: ClaudeSource): SourcedMessage[]
filterByConversation(messages: SourcedMessage[], conversationId: string): SourcedMessage[]
sortByTimestamp(messages: SourcedMessage[]): SourcedMessage[]
getStatistics(result: ConsolidationResult): Statistics
```

---

## 🔄 Data Flow

### Step 1: Collection

```typescript
// Collect from all sources
const cliWatcher = new ClaudeCliWatcher();
const desktopWatcher = new ClaudeDesktopWatcher();

const cliMessages = cliWatcher.getProjectSessions(projectPath);
const desktopMessages = desktopWatcher.getAllMessages();
const webMessages = await importWebExport(); // Manual import
```

### Step 2: Consolidation

```typescript
// Consolidate all messages
const orchestrator = new MultiClaudeOrchestrator();
const result = orchestrator.consolidate(
  webMessages.value,
  desktopMessages.value,
  cliMessages.value
);

if (result.ok) {
  const consolidatedMessages = result.value.messages;
  // Messages now have source tracking and deduplication applied
}
```

### Step 3: Analysis

```typescript
// Analyze consolidated messages
const analyzer = new ConversationOrchestrator();
const analysis = analyzer.analyze({
  id: 'consolidated-conv',
  messages: consolidatedMessages,
  timestamp: new Date().toISOString(),
  source: 'multi-claude'
});
```

### Step 4: Memory Generation

```typescript
// Generate memory files
const memoryGenerator = new MemoryGenerator();
const memory = memoryGenerator.generate(analysis.value);

// Write to disk
await memoryGenerator.write(memory);
```

---

## 🔐 Type Definitions

### SourcedMessage

```typescript
interface SourcedMessage extends Message {
  metadata: Message['metadata'] & {
    source: 'claude-web' | 'claude-desktop' | 'claude-cli';
    sourceTimestamp: string;
    contentHash: string;
  };
}
```

### ConsolidationResult

```typescript
interface ConsolidationResult {
  messages: SourcedMessage[];
  deduplicatedCount: number;
  sourceBreakdown: {
    web: number;
    desktop: number;
    cli: number;
  };
  conflictCount: number;
}
```

### ClaudeSource

```typescript
type ClaudeSource = 'claude-web' | 'claude-desktop' | 'claude-cli';
```

---

## 🧪 Testing

### Unit Tests

```bash
# Test individual components
npm test -- src/watchers/ClaudeCliWatcher.test.ts
npm test -- src/watchers/ClaudeDesktopWatcher.test.ts
npm test -- src/orchestrators/MultiClaudeOrchestrator.test.ts
```

### Integration Tests

```bash
# Test full pipeline
npm test -- src/commands/WatcherCommand.test.ts
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage
```

---

## 🚀 Integration Steps

### Step 1: Add to Watcher

Update `src/commands/WatcherCommand.ts`:

```typescript
import { ClaudeCliWatcher } from '../watchers/ClaudeCliWatcher.js';
import { ClaudeDesktopWatcher } from '../watchers/ClaudeDesktopWatcher.js';
import { MultiClaudeOrchestrator } from '../orchestrators/MultiClaudeOrchestrator.js';

// In watch loop:
const cliWatcher = new ClaudeCliWatcher();
const desktopWatcher = new ClaudeDesktopWatcher();
const orchestrator = new MultiClaudeOrchestrator();

if (cliWatcher.isAvailable() || desktopWatcher.isAvailable()) {
  const cliResult = cliWatcher.getProjectSessions(projectPath);
  const desktopResult = desktopWatcher.getAllMessages();
  
  const consolidationResult = orchestrator.consolidate(
    [], // Web messages (manual import)
    desktopResult.ok ? desktopResult.value : [],
    cliResult.ok ? cliResult.value : []
  );
  
  if (consolidationResult.ok) {
    // Process consolidated messages
  }
}
```

### Step 2: Add CLI Commands

Create new commands:

```bash
npm run consolidate:stats      # Show statistics
npm run consolidate:by-source  # Filter by source
npm run consolidate:by-conv    # Filter by conversation
```

### Step 3: Update Configuration

Add to config:

```typescript
interface WatcherConfig {
  sources: {
    claudeWeb: boolean;
    claudeDesktop: boolean;
    claudeCli: boolean;
  };
  deduplication: {
    enabled: boolean;
    algorithm: 'content-hash' | 'timestamp-content';
  };
  polling: {
    desktop: number; // milliseconds
    cli: number;     // milliseconds
  };
}
```

### Step 4: Update Documentation

- Update README with multi-Claude support
- Add examples to docs/
- Update API documentation

---

## 🔍 Debugging

### Enable Verbose Logging

```bash
npm run watcher:start -- --verbose
```

### Check Source Detection

```typescript
const cliWatcher = new ClaudeCliWatcher();
const desktopWatcher = new ClaudeDesktopWatcher();

console.log('CLI available:', cliWatcher.isAvailable());
console.log('Desktop available:', desktopWatcher.isAvailable());
console.log('CLI path:', cliWatcher.getStoragePath());
console.log('Desktop path:', desktopWatcher.getStoragePath());
```

### Inspect Consolidated Messages

```typescript
const orchestrator = new MultiClaudeOrchestrator();
const result = orchestrator.consolidate(web, desktop, cli);

if (result.ok) {
  const stats = orchestrator.getStatistics(result.value);
  console.log('Statistics:', stats);
  
  // Group by conversation
  const grouped = orchestrator.groupByConversation(result.value.messages);
  console.log('Conversations:', grouped.size);
  
  // Filter by source
  const webOnly = orchestrator.filterBySource(result.value.messages, 'claude-web');
  console.log('Web messages:', webOnly.length);
}
```

---

## 📊 Performance Considerations

### Polling Intervals

- **Desktop:** 5 seconds (default)
- **CLI:** 5 seconds (default)
- **Web:** Manual (no polling)

### Optimization Tips

1. **Increase polling interval** if CPU usage is high
2. **Disable sources** you don't use
3. **Batch consolidation** instead of per-message
4. **Cache deduplication hashes** for large datasets

### Memory Usage

- Each message: ~500 bytes
- 1000 messages: ~500 KB
- 10000 messages: ~5 MB

---

## 🔗 Dependencies

### Required

- `better-sqlite3@12.4.1` - SQLite parsing
- `crypto` (Node.js built-in) - SHA256 hashing

### Optional

- `aicf-core@2.0.0` - Memory file generation

---

## 📝 API Reference

### MultiClaudeOrchestrator

```typescript
class MultiClaudeOrchestrator {
  consolidate(
    webMessages?: Message[],
    desktopMessages?: Message[],
    cliMessages?: Message[]
  ): Result<ConsolidationResult>
  
  groupByConversation(messages: SourcedMessage[]): Map<string, SourcedMessage[]>
  filterBySource(messages: SourcedMessage[], source: ClaudeSource): SourcedMessage[]
  filterByConversation(messages: SourcedMessage[], conversationId: string): SourcedMessage[]
  sortByTimestamp(messages: SourcedMessage[]): SourcedMessage[]
  getStatistics(result: ConsolidationResult): Statistics
}
```

---

## 🎯 Next Steps

1. **Integrate into WatcherCommand**
2. **Add CLI commands for stats**
3. **Update configuration system**
4. **Add integration tests**
5. **Update documentation**
6. **Release Phase 5.5 complete**

---

**Ready to integrate! 🚀**

