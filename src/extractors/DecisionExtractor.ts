/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Decision Extractor
 * Extracts decisions from conversation with impact assessment
 * October 2025
 */

import type { Message, ConversationSummary, Decision } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Extract decisions using priority-based approach
 * PRIORITY 1: Use conversation summary (full content)
 * PRIORITY 2: Extract from individual messages (fallback)
 */
export class DecisionExtractor {
  /**
   * Extract decisions from messages and summary
   *
   * @param messages - Array of messages
   * @param summary - Conversation summary (optional)
   * @returns Result with Decision[] or error
   */
  extract(messages: Message[], summary: ConversationSummary | null): Result<Decision[]> {
    try {
      // PRIORITY 1: Extract from conversation summary
      if (summary && summary.fullConversation) {
        return Ok(this.extractFromSummary(summary));
      }

      // PRIORITY 2: Extract from individual messages
      return Ok(this.extractFromMessages(messages));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to extract decisions: ${message}`, error));
    }
  }

  /**
   * Extract decisions from conversation summary
   * @param summary - Conversation summary
   * @returns Decision[]
   */
  private extractFromSummary(summary: ConversationSummary): Decision[] {
    const decisions: Decision[] = [];

    // Look for decision keywords and patterns
    const decisionPatterns = [
      /decided\s+(?:to\s+)?([^.!?]+)/gi,
      /decided\s+(?:that\s+)?([^.!?]+)/gi,
      /will\s+([^.!?]+)/gi,
      /should\s+([^.!?]+)/gi,
      /must\s+([^.!?]+)/gi,
      /agreed\s+(?:to\s+)?([^.!?]+)/gi,
      /chose\s+(?:to\s+)?([^.!?]+)/gi,
    ];

    const fullConv = summary.fullConversation;

    decisionPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(fullConv)) !== null) {
        const decision = match[1]?.trim();
        if (decision && decision.length > 5 && decision.length < 500) {
          decisions.push({
            timestamp: new Date().toISOString(),
            decision, // ✅ FULL content, not truncated
            context: this.extractContext(fullConv, match.index),
            impact: this.assessImpact(decision),
          });
        }
      }
    });

    return decisions;
  }

  /**
   * Extract decisions from individual messages
   * @param messages - Array of messages
   * @returns Decision[]
   */
  private extractFromMessages(messages: Message[]): Decision[] {
    const decisions: Decision[] = [];

    // Look for decision keywords
    const decisionKeywords = ['decided', 'will', 'should', 'must', 'agreed', 'chose'];

    messages.forEach((msg) => {
      const lowerContent = msg.content.toLowerCase();
      if (decisionKeywords.some((keyword) => lowerContent.includes(keyword))) {
        decisions.push({
          timestamp: msg.timestamp,
          decision: msg.content, // ✅ FULL content, not truncated
          context: msg.content.substring(0, 100),
          impact: this.assessImpact(msg.content),
        });
      }
    });

    return decisions;
  }

  /**
   * Extract context around decision
   * @param text - Full text
   * @param index - Index of decision
   * @returns Context string
   */
  private extractContext(text: string, index: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + 150);
    return text.substring(start, end).trim();
  }

  /**
   * Assess impact of decision
   * @param decision - Decision text
   * @returns Impact level
   */
  private assessImpact(decision: string): 'high' | 'medium' | 'low' {
    const lowerDecision = decision.toLowerCase();

    // High impact keywords
    if (
      lowerDecision.includes('architecture') ||
      lowerDecision.includes('refactor') ||
      lowerDecision.includes('migrate') ||
      lowerDecision.includes('breaking') ||
      lowerDecision.includes('critical') ||
      lowerDecision.includes('production')
    ) {
      return 'high';
    }

    // Medium impact keywords
    if (
      lowerDecision.includes('implement') ||
      lowerDecision.includes('build') ||
      lowerDecision.includes('create') ||
      lowerDecision.includes('update') ||
      lowerDecision.includes('improve')
    ) {
      return 'medium';
    }

    // Default to low
    return 'low';
  }
}
