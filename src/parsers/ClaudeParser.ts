/**
 * Claude Parser
 * Extracts conversation data from Claude JSON export format
 * October 2025
 */

import type { Message } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err, ExtractionError } from '../types/index.js';
import { extractContentFromBlocks } from '../utils/ParserUtils.js';
import { MessageBuilder } from '../utils/MessageBuilder.js';
import { parseTimestamp } from '../utils/TimestampUtils.js';
import { handleError } from '../utils/ErrorUtils.js';

/**
 * Claude export JSON structure
 */
interface ClaudeExportMeta {
  exported_at: string;
  title: string;
}

interface ClaudeMessageBlock {
  type: string;
  data?: string;
  language?: string;
}

interface ClaudeExportMessage {
  index: number;
  type: 'prompt' | 'response';
  message: ClaudeMessageBlock[];
}

interface ClaudeExportData {
  meta: ClaudeExportMeta;
  chats: ClaudeExportMessage[];
}

/**
 * Parse Claude JSON export format
 * Converts claude-export JSON to standard Message format
 */
export class ClaudeParser {
  /**
   * Parse Claude export JSON data
   *
   * @param data - Claude export JSON data
   * @returns Result with Message[] or error
   */
  parse(data: unknown): Result<Message[]> {
    try {
      // Validate input
      if (!data || typeof data !== 'object') {
        return Err(new ExtractionError('Invalid Claude export data: not an object'));
      }

      const exportData = data as ClaudeExportData;

      // Validate structure
      if (!exportData.meta || !exportData.chats) {
        return Err(new ExtractionError('Invalid Claude export format: missing meta or chats'));
      }

      if (!Array.isArray(exportData.chats)) {
        return Err(new ExtractionError('Invalid Claude export format: chats is not an array'));
      }

      // Extract conversation ID from title
      const conversationId = this.generateConversationId(exportData.meta.title);
      const exportedAt = parseTimestamp(exportData.meta.exported_at);

      // Parse messages
      const messages = this.extractMessages(exportData.chats, conversationId, exportedAt);

      return Ok(messages);
    } catch (error) {
      return Err(handleError(error, 'Failed to parse Claude export'));
    }
  }

  /**
   * Extract messages from Claude chat array
   */
  private extractMessages(
    chats: ClaudeExportMessage[],
    conversationId: string,
    exportedAt: string
  ): Message[] {
    const messages: Message[] = [];

    for (const chat of chats) {
      try {
        // Validate chat structure
        if (!chat.message || !Array.isArray(chat.message)) {
          continue;
        }

        // Extract content from message blocks
        const content = extractContentFromBlocks(chat.message);

        if (content && content.length > 0) {
          const role = chat.type === 'prompt' ? 'user' : 'assistant';

          const message = MessageBuilder.createWithPlatform({
            conversationId,
            timestamp: exportedAt,
            role,
            content,
            platform: 'claude',
            extractedFrom: 'claude-export',
            messageType: role === 'user' ? 'user_request' : 'ai_response',
            rawLength: content.length,
          });

          messages.push(message);
        }
      } catch {
        // Skip malformed messages
        continue;
      }
    }

    return messages;
  }

  /**
   * Generate conversation ID from title
   * Creates a slug-like ID from the title
   */
  private generateConversationId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}
