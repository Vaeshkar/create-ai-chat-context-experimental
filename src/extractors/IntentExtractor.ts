/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Intent Extractor
 * Extracts user intents from conversation summary
 * October 2025
 */

import type { Message, ConversationSummary, UserIntent } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Extract user intents using priority-based approach
 * PRIORITY 1: Use conversation summary (full content)
 * PRIORITY 2: Extract from individual messages (fallback)
 */
export class IntentExtractor {
  /**
   * Extract user intents from messages and summary
   *
   * @param messages - Array of messages
   * @param summary - Conversation summary (optional)
   * @returns Result with UserIntent[] or error
   */
  extract(messages: Message[], summary: ConversationSummary | null): Result<UserIntent[]> {
    try {
      // PRIORITY 1: Extract from conversation summary
      if (summary && summary.userQueries) {
        return Ok(this.extractFromSummary(summary));
      }

      // PRIORITY 2: Extract from individual messages
      return Ok(this.extractFromMessages(messages));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to extract user intents: ${message}`, error));
    }
  }

  /**
   * Extract intents from conversation summary
   * @param summary - Conversation summary
   * @returns UserIntent[]
   */
  private extractFromSummary(summary: ConversationSummary): UserIntent[] {
    const intents: UserIntent[] = [];

    // Split user queries by [User N] markers
    const userQueryMatches = summary.userQueries.match(
      /\[User \d+\] (.+?)(?=\n\n\[User \d+\]|\n\n$|$)/gs
    );

    if (userQueryMatches && userQueryMatches.length > 0) {
      userQueryMatches.forEach((query, index) => {
        const cleanQuery = query.replace(/\[User \d+\] /, '').trim();
        if (cleanQuery.length > 0) {
          intents.push({
            timestamp: new Date().toISOString(),
            intent: cleanQuery, // ✅ FULL content, not truncated
            inferredFrom: 'conversation_summary',
            confidence: 'high',
            messageIndex: index + 1,
          });
        }
      });
    }

    return intents;
  }

  /**
   * Extract intents from individual messages
   * @param messages - Array of messages
   * @returns UserIntent[]
   */
  private extractFromMessages(messages: Message[]): UserIntent[] {
    const intents: UserIntent[] = [];
    const userMessages = messages.filter((m) => m.role === 'user');

    userMessages.forEach((msg, index) => {
      intents.push({
        timestamp: msg.timestamp,
        intent: msg.content, // ✅ FULL content, not truncated
        inferredFrom: 'individual_message',
        confidence: 'medium',
        messageIndex: index + 1,
      });
    });

    return intents;
  }
}
