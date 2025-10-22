/**
 * Flow Extractor
 * Extracts conversation flow and message sequence patterns
 * October 2025
 */

import type { Message, ConversationFlow } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Extract conversation flow and patterns
 */
export class FlowExtractor {
  /**
   * Extract conversation flow from messages
   *
   * @param messages - Array of messages
   * @returns Result with ConversationFlow or error
   */
  extract(messages: Message[]): Result<ConversationFlow> {
    try {
      if (!messages || messages.length === 0) {
        return Ok(this.emptyFlow());
      }

      const sequence = this.extractSequence(messages);
      const turns = this.countTurns(messages);
      const dominantRole = this.determineDominantRole(messages);

      return Ok({
        sequence,
        turns,
        dominantRole,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to extract conversation flow: ${message}`, error));
    }
  }

  /**
   * Extract message sequence
   * @param messages - Array of messages
   * @returns Sequence of message types
   */
  private extractSequence(messages: Message[]): string[] {
    return messages.map((msg) => {
      const role = msg.role;
      const length = msg.content.length;

      // Categorize by role and length
      if (role === 'user') {
        return length > 100 ? 'user_long' : 'user_short';
      }
      if (role === 'assistant') {
        return length > 100 ? 'assistant_long' : 'assistant_short';
      }
      return 'system';
    });
  }

  /**
   * Count conversation turns (user-AI exchanges)
   * @param messages - Array of messages
   * @returns Number of turns
   */
  private countTurns(messages: Message[]): number {
    let turns = 0;
    let lastRole: string | null = null;

    messages.forEach((msg) => {
      if (msg.role === 'user' && lastRole !== 'user') {
        turns++;
      }
      lastRole = msg.role;
    });

    return turns;
  }

  /**
   * Determine dominant role in conversation
   * @param messages - Array of messages
   * @returns Dominant role
   */
  private determineDominantRole(messages: Message[]): 'user' | 'assistant' | 'balanced' {
    const userCount = messages.filter((m) => m.role === 'user').length;
    const assistantCount = messages.filter((m) => m.role === 'assistant').length;

    if (userCount === 0 || assistantCount === 0) {
      return userCount > assistantCount ? 'user' : 'assistant';
    }

    const ratio = Math.abs(userCount - assistantCount) / Math.max(userCount, assistantCount);

    // If ratio > 0.3, one role dominates
    if (ratio > 0.3) {
      return userCount > assistantCount ? 'user' : 'assistant';
    }

    // Otherwise balanced
    return 'balanced';
  }

  /**
   * Create empty flow
   * @returns Empty ConversationFlow
   */
  private emptyFlow(): ConversationFlow {
    return {
      sequence: [],
      turns: 0,
      dominantRole: 'balanced',
    };
  }
}
