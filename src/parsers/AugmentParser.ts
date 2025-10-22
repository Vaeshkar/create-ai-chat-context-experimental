/**
 * Augment Parser
 * Extracts conversation data from Augment VSCode Extension LevelDB files
 * October 2025
 */

import type { Message } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Parse Augment LevelDB format
 * Extracts messages from Augment VSCode Extension storage
 */
export class AugmentParser {
  /**
   * Parse raw Augment data into messages
   *
   * @param rawData - Raw data from Augment LevelDB
   * @param conversationId - Conversation ID
   * @returns Result with Message[] or error
   */
  parse(rawData: string, conversationId: string): Result<Message[]> {
    try {
      if (!rawData || rawData.trim().length === 0) {
        return Ok([]);
      }

      const messages = this.extractMessages(rawData, conversationId);
      return Ok(messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to parse Augment data: ${message}`, error));
    }
  }

  /**
   * Extract messages from raw Augment data
   * @param rawData - Raw data string
   * @param conversationId - Conversation ID
   * @returns Message[]
   */
  private extractMessages(rawData: string, conversationId: string): Message[] {
    const messages: Message[] = [];
    let messageIndex = 0;

    // Extract user requests (allow escaped quotes)
    const requestPattern = /"request_message"\s*:\s*"((?:[^"\\]|\\.)+?)"/g;
    let requestMatch;
    while ((requestMatch = requestPattern.exec(rawData)) !== null) {
      const rawContent = requestMatch[1];
      if (rawContent) {
        const content = this.cleanMessage(rawContent);
        if (content && content.length > 5) {
          messages.push({
            id: `augment-user-${messageIndex}`,
            conversationId,
            timestamp: new Date().toISOString(),
            role: 'user',
            content, // ✅ FULL content, not truncated
          });
          messageIndex++;
        }
      }
    }

    // Extract AI responses (allow escaped quotes)
    const responsePattern = /"response_text"\s*:\s*"((?:[^"\\]|\\.)+?)"/g;
    let responseMatch;
    while ((responseMatch = responsePattern.exec(rawData)) !== null) {
      const rawContent = responseMatch[1];
      if (rawContent) {
        const content = this.cleanMessage(rawContent);
        if (content && content.length > 5) {
          messages.push({
            id: `augment-assistant-${messageIndex}`,
            conversationId,
            timestamp: new Date().toISOString(),
            role: 'assistant',
            content, // ✅ FULL content, not truncated
          });
          messageIndex++;
        }
      }
    }

    // Sort by message index to maintain order
    return messages.sort((a, b) => {
      const aIndex = parseInt(a.id.split('-').pop() ?? '0');
      const bIndex = parseInt(b.id.split('-').pop() ?? '0');
      return aIndex - bIndex;
    });
  }

  /**
   * Clean message content
   * @param message - Raw message
   * @returns Cleaned message
   */
  private cleanMessage(message: string): string {
    // Unescape common escape sequences
    let cleaned = message
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');

    // Remove control characters (eslint-disable-next-line no-control-regex)
    // eslint-disable-next-line no-control-regex
    cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Trim whitespace
    return cleaned.trim();
  }

  /**
   * Detect if data is from Augment
   * @param rawData - Raw data
   * @returns true if data appears to be from Augment
   */
  isAugmentData(rawData: string): boolean {
    return (
      rawData.includes('request_message') ||
      rawData.includes('response_text') ||
      rawData.includes('conversationId')
    );
  }
}
