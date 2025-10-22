/**
 * State Extractor
 * Extracts working state, blockers, and next actions from conversation
 * October 2025
 */

import type { Message, ConversationSummary, WorkingState } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Extract working state using priority-based approach
 * PRIORITY 1: Use conversation summary (full content)
 * PRIORITY 2: Extract from individual messages (fallback)
 */
export class StateExtractor {
  /**
   * Extract working state from messages and summary
   *
   * @param messages - Array of messages
   * @param summary - Conversation summary (optional)
   * @returns Result with WorkingState or error
   */
  extract(messages: Message[], summary: ConversationSummary | null): Result<WorkingState> {
    try {
      // PRIORITY 1: Extract from conversation summary
      if (summary && summary.fullConversation) {
        return Ok(this.extractFromSummary(summary));
      }

      // PRIORITY 2: Extract from individual messages
      return Ok(this.extractFromMessages(messages));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to extract working state: ${message}`, error));
    }
  }

  /**
   * Extract working state from conversation summary
   * @param summary - Conversation summary
   * @returns WorkingState
   */
  private extractFromSummary(summary: ConversationSummary): WorkingState {
    const fullConv = summary.fullConversation;

    const currentTask = this.extractCurrentTask(fullConv);
    const blockers = this.extractBlockers(fullConv);
    const nextAction = this.extractNextAction(fullConv);

    return {
      currentTask,
      blockers,
      nextAction,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Extract working state from individual messages
   * @param messages - Array of messages
   * @returns WorkingState
   */
  private extractFromMessages(messages: Message[]): WorkingState {
    const fullContent = messages.map((m) => m.content).join('\n');

    const currentTask = this.extractCurrentTask(fullContent);
    const blockers = this.extractBlockers(fullContent);
    const nextAction = this.extractNextAction(fullContent);

    const lastMessage = messages[messages.length - 1];
    const lastUpdate = lastMessage?.timestamp ?? new Date().toISOString();

    return {
      currentTask,
      blockers,
      nextAction,
      lastUpdate,
    };
  }

  /**
   * Extract current task from content
   * @param content - Full content
   * @returns Current task
   */
  private extractCurrentTask(content: string): string {
    // Look for current task patterns
    const patterns = [
      /(?:currently|now)\s+(?:working on|implementing|building|creating)\s+([^.!?]+)/i,
      /(?:current task|working on)\s*:?\s*([^.!?]+)/i,
      /(?:task|focus)\s*:?\s*([^.!?]+)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Default: extract first meaningful sentence
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const firstSentence = sentences[0];
    return firstSentence?.trim() ?? 'Unknown task';
  }

  /**
   * Extract blockers from content
   * @param content - Full content
   * @returns Array of blockers
   */
  private extractBlockers(content: string): string[] {
    const blockers: string[] = [];

    // Look for blocker patterns
    const blockerPatterns = [
      /blocked\s+by\s+([^.!?]+)/gi,
      /(?:blocking|issue|problem|error|bug)\s*:?\s*([^.!?]+)/gi,
      /(?:can't|cannot|unable to|stuck on)\s+([^.!?]+)/gi,
      /(?:need to|waiting for|depends on)\s+([^.!?]+)/gi,
    ];

    blockerPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const blocker = match[1]?.trim();
        if (blocker && blocker.length > 5 && blocker.length < 200) {
          blockers.push(blocker);
        }
      }
    });

    return [...new Set(blockers)]; // Remove duplicates
  }

  /**
   * Extract next action from content
   * @param content - Full content
   * @returns Next action
   */
  private extractNextAction(content: string): string {
    // Look for next action patterns
    const patterns = [
      /(?:next|then|after that)\s+(?:we|I|should|will)\s+([^.!?]+)/i,
      /(?:next step|next action)\s*:?\s*([^.!?]+)/i,
      /(?:todo|to do)\s*:?\s*([^.!?]+)/i,
      /(?:plan to|going to)\s+([^.!?]+)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Default: suggest next logical step
    if (content.toLowerCase().includes('implement')) {
      return 'Test the implementation';
    }
    if (content.toLowerCase().includes('test')) {
      return 'Review test results';
    }
    if (content.toLowerCase().includes('review')) {
      return 'Deploy changes';
    }

    return 'Continue with next task';
  }
}
