/**
 * Conversation type definitions
 * Phase 2: TypeScript rewrite - October 2025
 */

/**
 * Message metadata for tracking extraction source and properties
 */
export interface MessageMetadata {
  extractedFrom: string;
  rawLength: number;
  messageType: 'user_request' | 'ai_response' | 'system';
  platform?: string;
}

/**
 * Individual message in a conversation
 */
export interface Message {
  id: string;
  conversationId: string;
  timestamp: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: MessageMetadata;
}

/**
 * Supported conversation sources
 */
export type ConversationSource = 'augment' | 'warp' | 'copilot' | 'chatgpt' | 'unknown';

/**
 * Complete conversation with metadata
 */
export interface Conversation {
  id: string;
  messages: Message[];
  timestamp: string;
  source: ConversationSource;
  workspaceId?: string;
}

/**
 * Checkpoint dump format (from watcher)
 */
export interface CheckpointDump {
  sessionId: string;
  checkpointNumber: number;
  source: ConversationSource;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
}
