/**
 * Conversation summary type definitions
 * Phase 2: TypeScript rewrite - October 2025
 */

/**
 * Metrics about a conversation
 */
export interface ConversationMetrics {
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  totalChars: number;
  avgMessageLength: number;
}

/**
 * Comprehensive conversation summary
 * NO TRUNCATION - preserves full content
 */
export interface ConversationSummary {
  userQueries: string; // All user messages concatenated
  aiResponses: string; // All AI messages concatenated
  fullConversation: string; // Full conversation with timestamps
  metrics: ConversationMetrics;
}
