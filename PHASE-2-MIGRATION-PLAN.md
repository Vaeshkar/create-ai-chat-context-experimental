# Phase 2 TypeScript Rewrite - Migration Plan

## Overview
Migrate 45 active .js files to TypeScript, completing Phase 2 architecture. Deleted 16 deprecated files.

## Current State
- **45 active .js files** (Phase 1 implementation)
- **74 .ts files** (Phase 2 architecture - partially complete)
- **Build system**: TypeScript with ESM/CJS dual output

## Migration Strategy

### Priority Order (Dependency-First)

#### 1. **Utilities & Core Infrastructure** (6 files)
These have no dependencies on other .js files - migrate first:
- `config.js` → `src/utils/Config.ts`
- `log.js` → `src/utils/Logger.ts`
- `tokens.js` → `src/utils/TokenUtils.ts`
- `token-monitor.js` → `src/utils/TokenMonitor.ts`
- `templates.js` → `src/utils/Templates.ts`
- `archive.js` → `src/utils/Archive.ts`

#### 2. **Agents** (8 files)
Mostly independent, can be migrated early:
- `src/agents/agent-utils.js` → `src/agents/AgentUtils.ts`
- `src/agents/agent-router.js` → `src/agents/AgentRouter.ts`
- `src/agents/conversation-analyzer.js` → `src/agents/ConversationAnalyzer.ts`
- `src/agents/file-writer.js` → `src/agents/FileWriter.ts`
- `src/agents/intelligent-conversation-parser.js` → `src/agents/IntelligentConversationParser.ts`
- `src/agents/markdown-updater.js` → `src/agents/MarkdownUpdater.ts`
- `src/agents/memory-dropoff.js` → `src/agents/MemoryDropoff.ts`
- `src/agents/memory-lifecycle-manager.js` → `src/agents/MemoryLifecycleManager.ts`

#### 3. **Parsers & Extractors** (3 files)
- `aicf-parser.js` → `src/writers/AICFParser.ts`
- `context-extractor.js` → `src/extractors/ContextExtractor.ts`
- `conversation-processor.js` → `src/orchestrators/ConversationProcessor.ts`

#### 4. **AICF & Context** (5 files)
- `aicf-all-files.js` → `src/writers/AICFAllFiles.ts`
- `aicf-compiler.js` → `src/writers/AICFCompiler.ts`
- `aicf-context.js` → `src/writers/AICFContext.ts`
- `ai-native-format.js` → `src/writers/AINativeFormat.ts`
- `claude-project.js` → `src/utils/ClaudeProject.ts`

#### 5. **Platform Integrations** (3 files)
- `copilot.js` → `src/utils/CopilotIntegration.ts`
- `cursor.js` → `src/utils/CursorIntegration.ts`
- `convert.js` → `src/utils/Converter.ts`

#### 6. **Checkpoint & Orchestration** (3 files)
- `checkpoint-process.js` → `src/commands/CheckpointProcess.ts`
- `checkpoint-orchestrator.js` → `src/orchestrators/CheckpointOrchestrator.ts`
- `auto-checkpoint-integrations.js` → `src/services/AutoCheckpointIntegrations.ts`

#### 7. **CLI Commands** (18 files)
Migrate last as they depend on everything else:
- `index.js` → `src/cli.ts` (already exists, update)
- `init.js` → `src/commands/InitCommand.ts` (already exists, update)
- `check.js` → `src/commands/CheckCommand.ts`
- `validate.js` → `src/commands/ValidateCommand.ts`
- `search.js` → `src/commands/SearchCommand.ts`
- `stats.js` → `src/commands/StatsCommand.ts`
- `summary.js` → `src/commands/SummaryCommand.ts`
- `export.js` → `src/commands/ExportCommand.ts`
- `migrate.js` → `src/commands/MigrateCommand.ts`
- `aicf-migrate.js` → `src/commands/AICFMigrateCommand.ts`
- `update.js` → `src/commands/UpdateCommand.ts`
- `detect.js` → `src/commands/DetectCommand.ts`
- `finish.js` → `src/commands/FinishCommand.ts`
- `chat-finish.js` → `src/commands/ChatFinishCommand.ts`
- `install-hooks.js` → `src/commands/InstallHooksCommand.ts`
- `auto-updater.js` → `src/services/AutoUpdater.ts`
- `convert.js` → `src/commands/ConvertCommand.ts`

#### 8. **Session Parsers** (1 file)
- `src/session-parsers/augment-parser.js` → `src/parsers/AugmentSessionParser.ts`

## Implementation Steps

1. **Utilities First** - No dependencies, quick wins
2. **Agents** - Independent, good test coverage
3. **Core Logic** - Parsers, extractors, orchestrators
4. **CLI Commands** - Depend on everything, migrate last
5. **Build & Test** - Verify everything works
6. **Delete .js files** - Once all migrated and tested

## Testing Strategy
- Keep existing tests, update for TypeScript
- Run `pnpm test` after each category
- Run `pnpm build` to verify compilation
- Run `pnpm lint` to check code quality

## Success Criteria
- ✅ All 45 .js files converted to .ts
- ✅ All tests passing
- ✅ Build succeeds (ESM + CJS)
- ✅ No TypeScript errors
- ✅ CLI works correctly
- ✅ Delete all .js files from src/

