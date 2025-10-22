/**
 * Generic Parser
 * Fallback parser for unknown/generic conversation formats
 * October 2025
 */

import type { Message } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Parse generic/unknown conversation formats
 * Attempts to extract messages from various text formats
 */
export class GenericParser {
  /**
   * Parse generic data into messages
   *
   * @param rawData - Raw data in unknown format
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
      return Err(new ExtractionError(`Failed to parse generic data: ${message}`, error));
    }
  }

  /**
   * Extract messages from generic data
   * @param rawData - Raw data string
   * @param conversationId - Conversation ID
   * @returns Message[]
   */
  private extractMessages(rawData: string, conversationId: string): Message[] {
    const messages: Message[] = [];
    const messageIndex = 0;

    // Try JSON format first
    const jsonMessages = this.tryParseJSON(rawData, conversationId);
    if (jsonMessages.length > 0) {
      return jsonMessages;
    }

    // Try line-based format (role: content)
    const lineMessages = this.tryParseLineFormat(rawData, conversationId);
    if (lineMessages.length > 0) {
      return lineMessages;
    }

    // Try markdown-style format (## User / ## Assistant)
    const markdownMessages = this.tryParseMarkdownFormat(rawData, conversationId);
    if (markdownMessages.length > 0) {
      return markdownMessages;
    }

    // Fallback: treat entire content as single message
    if (rawData.trim().length > 10) {
      messages.push({
        id: `generic-message-${messageIndex}`,
        conversationId,
        timestamp: new Date().toISOString(),
        role: 'user',
        content: rawData.trim(), // ✅ FULL content, not truncated
      });
    }

    return messages;
  }

  /**
   * Try to parse JSON format
   * @param rawData - Raw data
   * @param conversationId - Conversation ID
   * @returns Message[] or empty array
   */
  private tryParseJSON(rawData: string, conversationId: string): Message[] {
    try {
      const data = JSON.parse(rawData);

      // Check if it's an array of messages
      if (Array.isArray(data)) {
        return data
          .filter((item) => item && typeof item === 'object')
          .map((item, index) => ({
            id: `generic-json-${index}`,
            conversationId,
            timestamp: item.timestamp ?? new Date().toISOString(),
            role: (item.role ?? item.type ?? 'user') as 'user' | 'assistant',
            content: (item.content ?? item.message ?? item.text ?? '').toString(),
          }))
          .filter((msg) => msg.content.length > 0);
      }

      // Check if it's a single message object
      if (data.content || data.message || data.text) {
        return [
          {
            id: 'generic-json-0',
            conversationId,
            timestamp: data.timestamp ?? new Date().toISOString(),
            role: (data.role ?? data.type ?? 'user') as 'user' | 'assistant',
            content: (data.content ?? data.message ?? data.text ?? '').toString(),
          },
        ];
      }
    } catch {
      // Not valid JSON, continue to next format
    }

    return [];
  }

  /**
   * Try to parse line-based format (role: content)
   * @param rawData - Raw data
   * @param conversationId - Conversation ID
   * @returns Message[] or empty array
   */
  private tryParseLineFormat(rawData: string, conversationId: string): Message[] {
    const messages: Message[] = [];
    const lines = rawData.split('\n');
    let messageIndex = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Look for "role: content" format
      const match = trimmed.match(/^(user|assistant|ai|human|me|you)\s*:\s*(.+)$/i);
      if (match && match[1] && match[2]) {
        const role = match[1].toLowerCase();
        const content = match[2].trim();

        if (content.length > 5) {
          messages.push({
            id: `generic-line-${messageIndex}`,
            conversationId,
            timestamp: new Date().toISOString(),
            role: role === 'assistant' || role === 'ai' ? 'assistant' : 'user',
            content, // ✅ FULL content, not truncated
          });
          messageIndex++;
        }
      }
    }

    return messages;
  }

  /**
   * Try to parse markdown-style format (## User / ## Assistant)
   * @param rawData - Raw data
   * @param conversationId - Conversation ID
   * @returns Message[] or empty array
   */
  private tryParseMarkdownFormat(rawData: string, conversationId: string): Message[] {
    const messages: Message[] = [];
    const sections = rawData.split(/^##\s+/m);
    let messageIndex = 0;

    for (const section of sections) {
      if (!section.trim()) continue;

      // Extract role from first line
      const lines = section.split('\n');
      const roleHeader = lines[0]?.trim().toLowerCase() ?? '';
      const content = lines.slice(1).join('\n').trim();

      if (content.length > 5) {
        const isAssistant = roleHeader.includes('assistant') || roleHeader.includes('ai');
        const isUser = roleHeader.includes('user') || roleHeader.includes('human');

        if (isAssistant || isUser) {
          messages.push({
            id: `generic-markdown-${messageIndex}`,
            conversationId,
            timestamp: new Date().toISOString(),
            role: isAssistant ? 'assistant' : 'user',
            content, // ✅ FULL content, not truncated
          });
          messageIndex++;
        }
      }
    }

    return messages;
  }

  /**
   * Detect if data is in generic format
   * @param rawData - Raw data
   * @returns true if data appears to be in a parseable format
   */
  isGenericData(rawData: string): boolean {
    if (!rawData || rawData.trim().length === 0) {
      return false;
    }

    // Check for JSON
    if (rawData.trim().startsWith('{') || rawData.trim().startsWith('[')) {
      return true;
    }

    // Check for line-based format
    if (/^(user|assistant|ai|human|me|you)\s*:/im.test(rawData)) {
      return true;
    }

    // Check for markdown format
    if (/^##\s+(user|assistant|ai|human)/im.test(rawData)) {
      return true;
    }

    // Generic text is always parseable
    return true;
  }
}
