/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Public type exports
 * Phase 2: TypeScript rewrite - October 2025
 */

// Result type for error handling
export type { Result } from './result.js';
export { Ok, Err, isOk, isErr } from './result.js';

// Conversation types
export type { Message, MessageMetadata, Conversation } from './conversation.js';
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
