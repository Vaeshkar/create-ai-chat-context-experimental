/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Public API exports for create-ai-chat-context
 * Phase 2: TypeScript rewrite - October 2025
 *
 * This is the main entry point for the package.
 * Users can import types and utilities from this package.
 */

// ============================================================================
// Type Exports - Core Types
// ============================================================================

// Result type for error handling
export type { Result } from './types/result.js';
export { Ok, Err, isOk, isErr } from './types/result.js';

// Conversation types
export type {
  Message,
  MessageMetadata,
  Conversation,
  ConversationSource,
} from './types/conversation.js';

// Summary types
export type { ConversationSummary, ConversationMetrics } from './types/summary.js';

// Extraction types
export type {
  UserIntent,
  AIAction,
  TechnicalWork,
  Decision,
  ConversationFlow,
  WorkingState,
  AnalysisResult,
} from './types/extraction.js';

// Error types
export {
  AppError,
  FileOperationError,
  ConversationParsingError,
  ExtractionError,
  PlatformDetectionError,
  ValidationError,
} from './types/errors.js';

// ============================================================================
// Core Manager Exports
// ============================================================================

// Permission Manager - for managing platform consent
export { PermissionManager } from './core/PermissionManager.js';
export type {
  PlatformName,
  ConsentStatus,
  PlatformPermission,
  PermissionsData,
  AuditEntry,
} from './core/PermissionManager.js';

// Watcher Config Manager - for managing watcher configuration
export { WatcherConfigManager } from './core/WatcherConfigManager.js';
export type {
  WatcherConfigData,
  PlatformConfig,
  WatcherSettings,
} from './core/WatcherConfigManager.js';

// ============================================================================
// Service Exports
// ============================================================================

// BackgroundService removed - using Cache-First Architecture (Phase 6)
// See: src/writers/AugmentCacheWriter.ts, src/agents/CacheConsolidationAgent.ts

// Multi-Claude Consolidation Service
export { MultiClaudeConsolidationService } from './services/MultiClaudeConsolidationService.js';

// ============================================================================
// Parser Exports
// ============================================================================

// Generic parser for conversation data
export { GenericParser } from './parsers/GenericParser.js';

// Platform-specific parsers
export { AugmentParser } from './parsers/AugmentParser.js';
export { ClaudeParser } from './parsers/ClaudeParser.js';
export { ClaudeCliParser } from './parsers/ClaudeCliParser.js';
export { WarpParser } from './parsers/WarpParser.js';

// Conversation summary parser
export { ConversationSummaryParser } from './parsers/ConversationSummaryParser.js';

// ============================================================================
// Extractor Exports
// ============================================================================

// Extractors for analyzing conversations
export { ActionExtractor } from './extractors/ActionExtractor.js';
export { DecisionExtractor } from './extractors/DecisionExtractor.js';
export { FlowExtractor } from './extractors/FlowExtractor.js';
export { IntentExtractor } from './extractors/IntentExtractor.js';
export { StateExtractor } from './extractors/StateExtractor.js';
export { TechnicalWorkExtractor } from './extractors/TechnicalWorkExtractor.js';

// ============================================================================
// Orchestrator Exports
// ============================================================================

// Conversation orchestrator for coordinating extraction
export { ConversationOrchestrator } from './orchestrators/ConversationOrchestrator.js';

// Multi-Claude orchestrator for handling multiple Claude instances
export { MultiClaudeOrchestrator } from './orchestrators/MultiClaudeOrchestrator.js';

// ============================================================================
// Utility Exports
// ============================================================================

// Configuration utilities
export * from './utils/Config.js';

// File I/O utilities
export { FileIOManager } from './utils/FileIOManager.js';
export { FileValidator } from './utils/FileValidator.js';
export * from './utils/FileSystemUtils.js';

// Logging utilities
export * from './utils/Logger.js';
export { WatcherLogger } from './utils/WatcherLogger.js';

// Token utilities
export * from './utils/TokenUtils.js';
export type { TokenAnalysis, WrapUpDecision } from './utils/TokenMonitor.js';

// Other utilities
export * from './utils/Archive.js';
export * from './utils/ErrorUtils.js';
export { MessageBuilder } from './utils/MessageBuilder.js';
export * from './utils/ParserUtils.js';
export * from './utils/StatsUtils.js';
export * from './utils/Templates.js';
export * from './utils/TimestampUtils.js';
export * from './utils/ValidationUtils.js';
export { WatcherManager } from './utils/WatcherManager.js';
export { DaemonManager } from './utils/DaemonManager.js';
export type { DaemonStatus, DaemonInfo } from './utils/DaemonManager.js';

// ============================================================================
// Writer Exports
// ============================================================================

// Memory file writer for generating AICF and markdown files
export { MemoryFileWriter } from './writers/MemoryFileWriter.js';

// ============================================================================
// Reader Exports
// ============================================================================

// Augment LevelDB reader for reading Augment conversations
export { AugmentLevelDBReader } from './readers/AugmentLevelDBReader.js';

// ============================================================================
// Watcher Exports
// ============================================================================

// Unified AETHER watcher (orchestrates all sub-watchers)
export { AetherWatcher } from './watchers/AetherWatcher.js';
export type { AetherWatcherConfig, WatcherStatus } from './watchers/AetherWatcher.js';

// Platform-specific watchers
export { ClaudeCliWatcher } from './watchers/ClaudeCliWatcher.js';
export { ClaudeDesktopWatcher } from './watchers/ClaudeDesktopWatcher.js';

// ============================================================================
// Agent Exports
// ============================================================================

// Agent utilities for multi-Claude coordination
export { AgentRouter } from './agents/AgentRouter.js';
export { AgentUtils } from './agents/AgentUtils.js';

// Cache consolidation agent (Phase 6)
export { CacheConsolidationAgent } from './agents/CacheConsolidationAgent.js';

// Memory dropoff agent (Phase 7)
export { MemoryDropoffAgent } from './agents/MemoryDropoffAgent.js';
export type { DropoffStats, SessionAge } from './agents/MemoryDropoffAgent.js';

// Session consolidation agent (Phase 6.5)
export { SessionConsolidationAgent } from './agents/SessionConsolidationAgent.js';
export type {
  ConversationEssentials,
  Session,
  ConsolidationStats,
} from './agents/SessionConsolidationAgent.js';

// ============================================================================
// Package Version
// ============================================================================

/**
 * Package version
 * @internal
 */
export const VERSION = '3.1.0';
