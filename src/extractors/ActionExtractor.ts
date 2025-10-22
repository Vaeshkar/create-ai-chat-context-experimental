/**
 * Action Extractor
 * Extracts AI actions from conversation summary
 * October 2025
 */

import type { Message, ConversationSummary, AIAction } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Extract AI actions using priority-based approach
 * PRIORITY 1: Use conversation summary (full content)
 * PRIORITY 2: Extract from individual messages (fallback)
 */
export class ActionExtractor {
  /**
   * Extract AI actions from messages and summary
   *
   * @param messages - Array of messages
   * @param summary - Conversation summary (optional)
   * @returns Result with AIAction[] or error
   */
  extract(messages: Message[], summary: ConversationSummary | null): Result<AIAction[]> {
    try {
      // PRIORITY 1: Extract from conversation summary
      if (summary && summary.aiResponses) {
        return Ok(this.extractFromSummary(summary));
      }

      // PRIORITY 2: Extract from individual messages
      return Ok(this.extractFromMessages(messages));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to extract AI actions: ${message}`, error));
    }
  }

  /**
   * Extract actions from conversation summary
   * @param summary - Conversation summary
   * @returns AIAction[]
   */
  private extractFromSummary(summary: ConversationSummary): AIAction[] {
    const actions: AIAction[] = [];

    // Split AI responses by [AI N] markers
    const aiResponseMatches = summary.aiResponses.match(
      /\[AI \d+\] (.+?)(?=\n\n\[AI \d+\]|\n\n$|$)/gs
    );

    if (aiResponseMatches && aiResponseMatches.length > 0) {
      aiResponseMatches.forEach((response, index) => {
        const cleanResponse = response.replace(/\[AI \d+\] /, '').trim();
        if (cleanResponse.length > 0) {
          actions.push({
            timestamp: new Date().toISOString(),
            details: cleanResponse, // ✅ FULL content, not truncated
            type: this.detectActionType(cleanResponse),
            source: 'conversation_summary',
            messageIndex: index + 1,
          });
        }
      });
    }

    return actions;
  }

  /**
   * Extract actions from individual messages
   * @param messages - Array of messages
   * @returns AIAction[]
   */
  private extractFromMessages(messages: Message[]): AIAction[] {
    const actions: AIAction[] = [];
    const aiMessages = messages.filter((m) => m.role === 'assistant');

    aiMessages.forEach((msg, index) => {
      actions.push({
        timestamp: msg.timestamp,
        details: msg.content, // ✅ FULL content, not truncated
        type: this.detectActionType(msg.content),
        source: 'augment_leveldb',
        messageIndex: index + 1,
      });
    });

    return actions;
  }

  /**
   * Detect action type from content
   * @param content - Action content
   * @returns Action type
   */
  private detectActionType(content: string): 'augment_ai_response' | 'augment_agent_action' {
    const lowerContent = content.toLowerCase();

    // Check for agent actions (code blocks are the primary indicator)
    if (lowerContent.includes('```')) {
      return 'augment_agent_action';
    }

    // Default to response
    return 'augment_ai_response';
  }
}
