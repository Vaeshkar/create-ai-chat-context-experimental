/**
 * Claude Parser
 * Extracts conversation data from Claude JSON export format
 * October 2025
 */

import { randomUUID } from 'crypto';
import type { Message } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

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
      const exportedAt = this.parseTimestamp(exportData.meta.exported_at);

      // Parse messages
      const messages = this.extractMessages(exportData.chats, conversationId, exportedAt);

      return Ok(messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to parse Claude export: ${message}`, error));
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
        const content = this.extractContent(chat.message);

        if (content && content.length > 0) {
          const role = chat.type === 'prompt' ? 'user' : 'assistant';

          messages.push({
            id: `claude-${chat.type}-${randomUUID()}`,
            conversationId,
            timestamp: exportedAt,
            role,
            content,
            metadata: {
              extractedFrom: 'claude-export',
              rawLength: content.length,
              messageType: role === 'user' ? 'user_request' : 'ai_response',
              platform: 'claude',
            },
          });
        }
      } catch (error) {
        // Skip malformed messages
        continue;
      }
    }

    return messages;
  }

  /**
   * Extract text content from message blocks
   * Handles paragraphs, code blocks, lists, and tables
   */
  private extractContent(blocks: ClaudeMessageBlock[]): string {
    const parts: string[] = [];

    for (const block of blocks) {
      if (!block.data) {
        continue;
      }

      switch (block.type) {
        case 'p':
          // Paragraph
          parts.push(block.data);
          break;

        case 'pre':
          // Code block
          if (block.language) {
            parts.push(`\`\`\`${block.language}\n${block.data}\n\`\`\``);
          } else {
            parts.push(`\`\`\`\n${block.data}\n\`\`\``);
          }
          break;

        case 'ul':
        case 'ol':
          // Lists - data contains list items
          parts.push(block.data);
          break;

        case 'table':
          // Tables
          parts.push(block.data);
          break;

        default:
          // Unknown type - include as-is
          if (block.data) {
            parts.push(block.data);
          }
      }
    }

    return parts.join('\n\n').trim();
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

  /**
   * Parse timestamp from Claude export format
   * Converts "2024-03-19 16:03:09" to ISO 8601
   */
  private parseTimestamp(timestamp: string): string {
    try {
      // Try to parse as "YYYY-MM-DD HH:MM:SS"
      const date = new Date(timestamp.replace(' ', 'T'));

      if (isNaN(date.getTime())) {
        // Fallback to current time if parsing fails
        return new Date().toISOString();
      }

      return date.toISOString();
    } catch {
      // Fallback to current time
      return new Date().toISOString();
    }
  }
}
