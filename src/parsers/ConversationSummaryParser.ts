/**
 * Conversation Summary Parser
 * Core foundation for Phase 2 - NO TRUNCATION
 * October 2025
 */

import type { Message, ConversationSummary, ConversationMetrics } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Parse and aggregate conversation messages into comprehensive summary
 * Preserves FULL content - NO TRUNCATION
 */
export class ConversationSummaryParser {
  /**
   * Extract comprehensive conversation summary from ALL messages
   * NO TRUNCATION - preserves full content
   *
   * @param messages - Array of messages to summarize
   * @returns Result with ConversationSummary or error
   */
  extractSummary(messages: Message[]): Result<ConversationSummary> {
    try {
      if (!messages || messages.length === 0) {
        return Ok(this.emptyConversationSummary());
      }

      const userMessages = messages.filter((m) => m.role === 'user');
      const aiMessages = messages.filter((m) => m.role === 'assistant');

      // Aggregate user queries with full content
      const userQueries = userMessages.map((m, i) => `[User ${i + 1}] ${m.content}`).join('\n\n');

      // Aggregate AI responses with full content
      const aiResponses = aiMessages.map((m, i) => `[AI ${i + 1}] ${m.content}`).join('\n\n');

      // Create full conversation with timestamps and roles
      const fullConversation = messages
        .map((m, i) => {
          const role = m.role.toUpperCase();
          const timestamp = m.timestamp;
          return `[${i + 1}] ${role} (${timestamp}):\n${m.content}`;
        })
        .join('\n\n---\n\n');

      // Calculate metrics
      const metrics = this.calculateMetrics(messages);

      const summary: ConversationSummary = {
        userQueries,
        aiResponses,
        fullConversation,
        metrics,
      };

      return Ok(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to extract conversation summary: ${message}`, error));
    }
  }

  /**
   * Calculate metrics about the conversation
   * @param messages - Messages to analyze
   * @returns ConversationMetrics
   */
  private calculateMetrics(messages: Message[]): ConversationMetrics {
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    const avgMessageLength = messages.length > 0 ? Math.round(totalChars / messages.length) : 0;

    return {
      totalMessages: messages.length,
      userMessages: messages.filter((m) => m.role === 'user').length,
      aiMessages: messages.filter((m) => m.role === 'assistant').length,
      totalChars,
      avgMessageLength,
    };
  }

  /**
   * Create empty conversation summary
   * @returns Empty ConversationSummary
   */
  private emptyConversationSummary(): ConversationSummary {
    return {
      userQueries: '',
      aiResponses: '',
      fullConversation: '',
      metrics: {
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        totalChars: 0,
        avgMessageLength: 0,
      },
    };
  }
}
