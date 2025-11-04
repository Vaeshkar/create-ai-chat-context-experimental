/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Technical Work Extractor
 * Extracts technical work items from conversation
 * October 2025
 */

import type { Message, ConversationSummary, TechnicalWork } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Extract technical work using priority-based approach
 * PRIORITY 1: Use conversation summary (full content)
 * PRIORITY 2: Extract from individual messages (fallback)
 */
export class TechnicalWorkExtractor {
  /**
   * Extract technical work from messages and summary
   *
   * @param messages - Array of messages
   * @param summary - Conversation summary (optional)
   * @returns Result with TechnicalWork[] or error
   */
  extract(messages: Message[], summary: ConversationSummary | null): Result<TechnicalWork[]> {
    try {
      // PRIORITY 1: Extract from conversation summary
      if (summary && summary.fullConversation) {
        return Ok(this.extractFromSummary(summary));
      }

      // PRIORITY 2: Extract from individual messages
      return Ok(this.extractFromMessages(messages));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to extract technical work: ${message}`, error));
    }
  }

  /**
   * Extract technical work from conversation summary
   * NO TRUNCATION - captures full assistant responses that contain technical work
   * @param summary - Conversation summary
   * @returns TechnicalWork[]
   */
  private extractFromSummary(summary: ConversationSummary): TechnicalWork[] {
    const work: TechnicalWork[] = [];

    // Keywords that indicate technical work (but we capture FULL response, not just the fragment)
    const technicalKeywords = [
      'implement',
      'create',
      'build',
      'fix',
      'refactor',
      'test',
      'update',
      'add',
      'remove',
      'delete',
      'modify',
      'change',
      'install',
      'configure',
      'setup',
      'deploy',
      'migrate',
      'debug',
      'optimize',
      'improve',
      'enhance',
      'extend',
      'automate',
      'pipeline',
    ];

    // Split by assistant responses (look for common patterns)
    const assistantResponses = summary.aiResponses.split(/\n\n+/);

    let workIndex = 1;
    for (const response of assistantResponses) {
      const trimmed = response.trim();

      // Skip empty or very short responses
      if (trimmed.length < 20) continue;

      // Check if response contains technical keywords
      const lowerResponse = trimmed.toLowerCase();
      const hasTechnicalWork = technicalKeywords.some((keyword) => lowerResponse.includes(keyword));

      if (hasTechnicalWork) {
        work.push({
          timestamp: new Date().toISOString(),
          work: trimmed, // ✅ FULL response, NO truncation, NO length limit
          type: this.detectWorkTypeFromContent(trimmed),
          source: 'conversation_summary',
          lineIndex: workIndex++,
        });
      }
    }

    return work;
  }

  /**
   * Extract technical work from individual messages
   * @param messages - Array of messages
   * @returns TechnicalWork[]
   */
  private extractFromMessages(messages: Message[]): TechnicalWork[] {
    const work: TechnicalWork[] = [];
    let workIndex = 1;

    messages.forEach((msg) => {
      // Look for technical keywords
      const technicalKeywords = [
        'implement',
        'create',
        'build',
        'fix',
        'refactor',
        'test',
        'debug',
        'optimize',
        'parse',
        'extract',
        'convert',
        'migrate',
      ];

      const lowerContent = msg.content.toLowerCase();
      if (technicalKeywords.some((keyword) => lowerContent.includes(keyword))) {
        work.push({
          timestamp: msg.timestamp,
          work: msg.content, // ✅ FULL content, not truncated
          type: this.detectWorkTypeFromContent(msg.content),
          source: 'augment',
          lineIndex: workIndex++,
        });
      }
    });

    return work;
  }

  /**
   * Detect work type from content
   * @param content - Message content
   * @returns Work type
   */
  private detectWorkTypeFromContent(
    content: string
  ): 'technical_conversation' | 'agent_automation' {
    const lowerContent = content.toLowerCase();

    if (
      lowerContent.includes('script') ||
      lowerContent.includes('automate') ||
      lowerContent.includes('workflow') ||
      lowerContent.includes('pipeline') ||
      lowerContent.includes('```')
    ) {
      return 'agent_automation';
    }

    return 'technical_conversation';
  }
}
