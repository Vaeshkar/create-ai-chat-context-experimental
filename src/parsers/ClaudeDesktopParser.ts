/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Claude Desktop Parser
 * Extracts conversation data from Claude Desktop SQLite database
 * Phase 5.5b: October 2025
 *
 * Parses SQLite database from ~/Library/Application Support/Claude/
 * Extracts conversations, messages, and attachments
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { Message } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err, ExtractionError } from '../types/index.js';
import { MessageBuilder } from '../utils/MessageBuilder.js';
import { handleError } from '../utils/ErrorUtils.js';

/**
 * Claude Desktop conversation structure from SQLite
 */
interface ClaudeDesktopConversation {
  id: string;
  uuid?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Claude Desktop message structure from SQLite
 */
interface ClaudeDesktopMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  updated_at?: string;
  metadata?: string; // JSON string
}

/**
 * Parse Claude Desktop SQLite database
 * Converts SQLite messages to standard Message format
 */
export class ClaudeDesktopParser {
  /**
   * Parse Claude Desktop database
   *
   * @param dbPath - Path to Claude Desktop database file
   * @returns Result with Message[] or error
   */
  parse(dbPath: string): Result<Message[]> {
    let db: Database.Database | null = null;

    try {
      // Open database
      db = new Database(dbPath, { readonly: true });

      // Get all conversations
      const conversations = this.getConversations(db);
      if (!conversations.ok) {
        return conversations;
      }

      // Extract messages from all conversations
      const allMessages: Message[] = [];

      for (const conversation of conversations.value) {
        const messagesResult = this.getConversationMessages(db, conversation.id);

        if (messagesResult.ok) {
          allMessages.push(...messagesResult.value);
        }
      }

      return Ok(allMessages);
    } catch (error) {
      return Err(handleError(error, 'Failed to parse Claude Desktop database'));
    } finally {
      if (db) {
        try {
          db.close();
        } catch {
          // Ignore close errors
        }
      }
    }
  }

  /**
   * Get all conversations from database
   *
   * @param db - SQLite database connection
   * @returns Result with Conversation[] or error
   */
  private getConversations(db: Database.Database): Result<ClaudeDesktopConversation[]> {
    try {
      // Try different possible table names
      const tableNames = ['conversations', 'chats', 'chat_conversations'];

      for (const tableName of tableNames) {
        try {
          const stmt = db.prepare(`SELECT * FROM ${tableName} LIMIT 1`);
          stmt.get();

          // Table exists, use it
          const rows = db
            .prepare(`SELECT * FROM ${tableName}`)
            .all() as ClaudeDesktopConversation[];
          return Ok(rows);
        } catch {
          // Table doesn't exist, try next
          continue;
        }
      }

      // No conversations table found
      return Ok([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to get conversations: ${message}`, error));
    }
  }

  /**
   * Get messages for a specific conversation
   *
   * @param db - SQLite database connection
   * @param conversationId - Conversation ID
   * @returns Result with Message[] or error
   */
  private getConversationMessages(
    db: Database.Database,
    conversationId: string
  ): Result<Message[]> {
    try {
      // Try different possible table names
      const tableNames = ['messages', 'chat_messages', 'conversation_messages'];

      let messages: ClaudeDesktopMessage[] = [];
      let found = false;

      for (const tableName of tableNames) {
        try {
          const stmt = db.prepare(`SELECT * FROM ${tableName} WHERE conversation_id = ? LIMIT 1`);
          stmt.get(conversationId);

          // Table exists and has data, use it
          messages = db
            .prepare(`SELECT * FROM ${tableName} WHERE conversation_id = ? ORDER BY created_at ASC`)
            .all(conversationId) as ClaudeDesktopMessage[];
          found = true;
          break;
        } catch {
          // Table doesn't exist or query failed, try next
          continue;
        }
      }

      if (!found) {
        return Ok([]);
      }

      // Convert to Message format
      const result: Message[] = [];

      for (const msg of messages) {
        try {
          const content = this.extractContent(msg.content);

          if (content && content.length > 0) {
            const id = msg.id || `claude-desktop-${conversationId}-${randomUUID()}`;

            const message = MessageBuilder.createWithPlatform({
              id,
              conversationId,
              timestamp: msg.created_at,
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content,
              platform: 'claude-desktop',
              extractedFrom: 'claude-desktop-sqlite',
              messageType: msg.role === 'assistant' ? 'ai_response' : 'user_request',
              rawLength: msg.content.length,
            });

            result.push(message);
          }
        } catch {
          // Skip malformed messages
          continue;
        }
      }

      return Ok(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to get conversation messages: ${message}`, error));
    }
  }

  /**
   * Extract content from Claude Desktop message
   * Handles string and structured content
   *
   * @param content - Message content (string or JSON)
   * @returns Extracted text content
   */
  private extractContent(content: string | unknown): string {
    if (typeof content === 'string') {
      return content.trim();
    }

    if (typeof content === 'object' && content !== null) {
      // Handle structured content
      const obj = content as Record<string, unknown>;
      if (typeof obj['text'] === 'string') {
        return (obj['text'] as string).trim();
      }
      if (typeof obj['message'] === 'string') {
        return (obj['message'] as string).trim();
      }
      if (typeof obj['content'] === 'string') {
        return (obj['content'] as string).trim();
      }
      // Fallback: stringify the object
      return JSON.stringify(content);
    }

    return '';
  }
}
