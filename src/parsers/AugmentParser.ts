/**
 * Augment Parser
 * Extracts conversation data from Augment VSCode Extension LevelDB files
 * October 2025
 */

import type { Message } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { cleanContent } from '../utils/ParserUtils.js';
import { MessageBuilder } from '../utils/MessageBuilder.js';
import { handleError } from '../utils/ErrorUtils.js';

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
      return Err(handleError(error, 'Failed to parse Augment data'));
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
        const content = cleanContent(rawContent);
        if (content && content.length > 5) {
          const message = MessageBuilder.create({
            prefix: 'augment-user',
            index: messageIndex,
            conversationId,
            role: 'user',
            content,
          });
          messages.push(message);
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
        const content = cleanContent(rawContent);
        if (content && content.length > 5) {
          const message = MessageBuilder.create({
            prefix: 'augment-assistant',
            index: messageIndex,
            conversationId,
            role: 'assistant',
            content,
          });
          messages.push(message);
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
