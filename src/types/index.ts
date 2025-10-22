/**
 * Public type exports
 * Phase 2: TypeScript rewrite - October 2025
 */

// Result type for error handling
export type { Result } from './result.js';
export { Ok, Err, isOk, isErr } from './result.js';

// Conversation types
export type { Message, MessageMetadata, Conversation, CheckpointDump } from './conversation.js';
export type { ConversationSource } from './conversation.js';

// Summary types
export type { ConversationSummary, ConversationMetrics } from './summary.js';

// Extraction types
export type {
  UserIntent,
  AIAction,
  TechnicalWork,
  Decision,
  ConversationFlow,
  WorkingState,
  AnalysisResult,
} from './extraction.js';

// Error types
export {
  AppError,
  FileOperationError,
  ConversationParsingError,
  ExtractionError,
  PlatformDetectionError,
  ValidationError,
} from './errors.js';
