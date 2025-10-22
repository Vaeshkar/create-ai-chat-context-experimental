# WARP.md

This file provides guidance to Warp Terminal AI when working with this repository.

## 🧠 Memory System - READ FIRST

**CRITICAL:** Before responding, read these files to understand project context:

### AI-Optimized Memory (Fast Context Loading)
Read in this order for quick context:
1. `.aicf/index.aicf` - Project overview and quick stats
2. `.aicf/work-state.aicf` - Recent sessions and current work
3. `.aicf/conversations.aicf` - Conversation history
4. `.aicf/decisions.aicf` - Key decisions with impact scores
5. `.aicf/technical-context.aicf` - Architecture and tech stack
6. `.aicf/design-system.aicf` - UI/UX rules and design decisions

### Human-Readable Documentation (Detailed Context)
Read as needed for detailed information:
- `.ai/project-overview.md` - High-level project description
- `.ai/conversation-log.md` - Detailed conversation history
- `.ai/technical-decisions.md` - Technical decisions and rationale
- `.ai/next-steps.md` - Planned work and priorities
- `.ai/known-issues.md` - Current bugs and limitations

### Phase Documentation
- `PHASE-1-COMPLETE.md` - Phase 1 summary (JavaScript implementation)
- `PHASE-2-ARCHITECTURE.md` - Phase 2 blueprint (TypeScript rewrite)
- `BETTER-FIX-COMPLETE.md` - Data pipeline fix summary
- `SESSION-SUMMARY.md` - Latest session summary

## 📋 Project Overview

**create-ai-chat-context-experimental** is an experimental memory consolidation system that captures AI conversations and consolidates them into dual-format memory files.

### Current Status
- **Phase 1 (JavaScript):** ✅ Complete
- **Phase 2 (TypeScript):** ✅ Complete (158 tests)
- **Phase 3 (CLI Integration):** ✅ Complete (112 tests)
- **Phase 4 (Multi-Platform):** 🚀 In Progress
  - Augment (VSCode): ✅ Complete
  - Warp (Terminal): 🚀 In Progress
  - Claude: 🚀 Planned
  - Copilot: 🚀 Planned

### Total Test Coverage
- **273 tests passing** ✅
- **0 linting errors** ✅
- **0 TypeScript errors** ✅

## 🛠️ Common Commands

### Development
```bash
# Install dependencies
npm ci

# Run tests
npm test

# Run specific test file
npm test -- src/parsers/WarpParser.test.ts

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

### Warp Integration (Current Work)
```bash
# Extract Warp conversations
node scripts/extract-warp-conversation.js list

# Extract specific conversation
node scripts/extract-warp-conversation.js extract <conversation-id>

# Watch for new conversations
npm run watcher
```

## 📁 Project Structure

```
├── src/
│   ├── parsers/              # Platform-specific parsers
│   │   ├── AugmentParser.ts   # ✅ Augment VSCode
│   │   ├── WarpParser.ts      # 🚀 Warp Terminal
│   │   └── GenericParser.ts   # Fallback parser
│   ├── extractors/            # Platform-specific extractors
│   ├── commands/              # CLI commands
│   ├── orchestrators/         # Conversation orchestration
│   └── types/                 # TypeScript type definitions
├── .aicf/                     # AI-optimized memory (AICF format)
├── .ai/                       # Human-readable memory (Markdown)
├── .cache/llm/                # Platform-specific caches
│   ├── augment/               # Augment cache
│   └── warp/                  # Warp cache
├── docs/                      # Documentation
└── tests/                     # Test files
```

## 🎯 Current Work: Warp Integration

### What's Done
- ✅ WarpParser.ts - Parses Warp SQLite format
- ✅ 9 comprehensive tests (all passing)
- ✅ Handles JSON queries and action results
- ✅ Extracts user queries, commands, file operations

### What's Next
- [ ] WarpExtractor.ts - Extract Warp-specific insights
- [ ] Integrate into WatcherCommand
- [ ] Test with real Warp data (14 conversations, 2190+ queries)
- [ ] Extract shared components (DRY principle)

### Warp Data Structure
- **Location:** `~/Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite`
- **Tables:** `agent_conversations`, `ai_queries`
- **Conversations Found:** 14
- **Largest Conversation:** 2190 queries

## 🏗️ Architecture Patterns

### Parser Pattern
Each platform needs:
1. **Parser** - Convert platform format to standard Message[]
2. **Extractor** - Extract platform-specific insights
3. **Watcher** - Monitor for new conversations

### Message Format
```typescript
interface Message {
  id: string;
  conversationId: string;
  timestamp: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    extractedFrom: string;
    rawLength: number;
    messageType: 'user_request' | 'ai_response' | 'system';
    platform?: string;
  };
}
```

## 📊 Key Files Reference

### Core System
- `src/orchestrators/ConversationOrchestrator.ts` - Routes to correct parser
- `src/commands/WatcherCommand.ts` - Main watcher loop
- `src/agents/intelligent-conversation-parser.js` - Platform-specific analysis

### Parsers
- `src/parsers/AugmentParser.ts` - Augment format
- `src/parsers/WarpParser.ts` - Warp format
- `src/parsers/GenericParser.ts` - Fallback

### Tests
- `src/parsers/*.test.ts` - Parser tests
- `src/commands/*.test.ts` - Command tests
- `src/integration.test.ts` - Integration tests

## 🚀 When Starting a New Session

1. **Read memory files first** (see Memory System section above)
2. **Check `.ai/next-steps.md`** for current priorities
3. **Review `.ai/known-issues.md`** for blockers
4. **Run tests** to verify system state: `npm test`
5. **Ask for clarification** if context is unclear

## 💡 Development Guidelines

- **TypeScript Strict Mode:** All code must pass strict type checking
- **ESM Only:** Use ES modules, no CommonJS
- **Test-Driven:** Write tests before implementation
- **DRY Principle:** Extract shared components, avoid duplication
- **Result Type Pattern:** Use Result<T> for error handling, no throwing
- **Platform Abstraction:** Keep platform-specific code isolated

## 📞 Questions?

If you need clarification on:
- Project architecture → Read `.ai/technical-decisions.md`
- Current priorities → Read `.ai/next-steps.md`
- Known issues → Read `.ai/known-issues.md`
- Previous conversations → Read `.ai/conversation-log.md`
- AICF format → Read `.aicf/index.aicf`

