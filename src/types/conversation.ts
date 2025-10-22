/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

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
  // Optional Claude CLI metadata
  tokenUsage?: {
    input: number;
    output: number;
  };
  thinking?: string;
  gitBranch?: string;
  workingDirectory?: string;
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
