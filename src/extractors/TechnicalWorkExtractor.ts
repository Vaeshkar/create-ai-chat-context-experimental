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
   * @param summary - Conversation summary
   * @returns TechnicalWork[]
   */
  private extractFromSummary(summary: ConversationSummary): TechnicalWork[] {
    const work: TechnicalWork[] = [];

    // Look for technical keywords and patterns
    const technicalPatterns = [
      /implement(?:ing|ed)?\s+([^.!?]+)/gi,
      /create(?:d)?\s+([^.!?]+)/gi,
      /build(?:ing)?\s+([^.!?]+)/gi,
      /fix(?:ing|ed)?\s+([^.!?]+)/gi,
      /refactor(?:ing|ed)?\s+([^.!?]+)/gi,
      /test(?:ing|ed)?\s+([^.!?]+)/gi,
      /debug(?:ging|ged)?\s+([^.!?]+)/gi,
      /optimize(?:d)?\s+([^.!?]+)/gi,
      /automate(?:d)?\s+([^.!?]+)/gi,
      /pipeline\s+([^.!?]+)/gi,
    ];

    const fullConv = summary.fullConversation;
    let workIndex = 1;

    technicalPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(fullConv)) !== null) {
        const workItem = match[1]?.trim();
        if (workItem && workItem.length > 5 && workItem.length < 500) {
          work.push({
            timestamp: new Date().toISOString(),
            work: workItem, // ✅ FULL content, not truncated
            type: this.detectWorkType(match[0]),
            source: 'conversation_summary',
            lineIndex: workIndex++,
          });
        }
      }
    });

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
   * Detect work type from pattern match
   * @param match - Pattern match string
   * @returns Work type
   */
  private detectWorkType(match: string): 'technical_conversation' | 'agent_automation' {
    const lowerMatch = match.toLowerCase();

    // Automation work
    if (
      lowerMatch.includes('script') ||
      lowerMatch.includes('automate') ||
      lowerMatch.includes('workflow') ||
      lowerMatch.includes('pipeline')
    ) {
      return 'agent_automation';
    }

    // Default to conversation
    return 'technical_conversation';
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
