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
   * IMPROVED: Only extract meaningful decisions, not garbage phrases
   * @param summary - Conversation summary
   * @returns Decision[]
   */
  private extractFromSummary(summary: ConversationSummary): Decision[] {
    const decisions: Decision[] = [];

    // More specific patterns that capture actual decisions
    const decisionPatterns = [
      // "decided to X" or "decided that X"
      /(?:we|I|they)\s+decided\s+(?:to|that)\s+([^.!?]+)/gi,
      // "agreed to X"
      /(?:we|I|they)\s+agreed\s+(?:to|that)\s+([^.!?]+)/gi,
      // "chose to X"
      /(?:we|I|they)\s+chose\s+(?:to|that)\s+([^.!?]+)/gi,
      // "will implement/build/create/use X" (action-oriented)
      /(?:we|I|they)\s+will\s+(?:implement|build|create|use|add|remove|fix|update|migrate|refactor)\s+([^.!?]+)/gi,
      // "should implement/build/create/use X" (recommendation)
      /(?:we|I|they)\s+should\s+(?:implement|build|create|use|add|remove|fix|update|migrate|refactor)\s+([^.!?]+)/gi,
      // "must implement/build/create/use X" (requirement)
      /(?:we|I|they)\s+must\s+(?:implement|build|create|use|add|remove|fix|update|migrate|refactor)\s+([^.!?]+)/gi,
    ];

    const fullConv = summary.fullConversation;

    decisionPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(fullConv)) !== null) {
        const decision = match[1]?.trim();

        // Skip if no decision text
        if (!decision) {
          continue;
        }

        // Filter out garbage decisions
        if (!this.isValidDecision(decision)) {
          continue;
        }

        decisions.push({
          timestamp: new Date().toISOString(),
          decision,
          context: this.extractContext(fullConv), // Full context, no truncation
          impact: this.assessImpact(decision),
        });
      }
    });

    // Deduplicate and sort by impact
    const uniqueDecisions = this.deduplicateDecisions(decisions);
    const sortedDecisions = this.sortByImpact(uniqueDecisions);

    // Return top 10 decisions only
    return sortedDecisions.slice(0, 10);
  }

  /**
   * Check if a decision is valid (not garbage)
   * NO LENGTH LIMIT - we want full context
   * @param decision - Decision text
   * @returns true if valid, false if garbage
   */
  private isValidDecision(decision: string): boolean {
    if (!decision || decision.length < 10) {
      return false;
    }

    // Filter out garbage patterns
    const garbagePatterns = [
      /^be\s+/i, // "be gone", "be deleted", "be forgotten"
      /^get\s+/i, // "get crowded", "get confused"
      /^find\s+/i, // "find all the other data"
      /^help\s+/i, // "help us: 1"
      /^follow\s+/i, // "follow the same pattern"
      /^it\s+/i, // "it work", "it matter"
      /^this\s+/i, // "this fade away"
      /^eventually\s+/i, // "eventually be deleted"
      /^shut\s+down/i, // "shut down"
      /^explode/i, // "explode"
      /^last\s+forever/i, // "last forever"
      /^change\s+the\s+world/i, // "change the world"
      /^make\s+you\s+famous/i, // "make you famous"
      /turn\s+to\s+dust/i, // "turn to dust when I die"
      /\?\s*$/i, // Questions are not decisions
    ];

    for (const pattern of garbagePatterns) {
      if (pattern.test(decision)) {
        return false;
      }
    }

    // Must contain action verbs or technical terms
    const actionVerbs = [
      'implement',
      'build',
      'create',
      'use',
      'add',
      'remove',
      'fix',
      'update',
      'migrate',
      'refactor',
      'consolidate',
      'extract',
      'parse',
      'write',
      'read',
      'process',
      'handle',
      'manage',
      'configure',
      'setup',
      'install',
      'deploy',
      'test',
      'validate',
    ];

    const lowerDecision = decision.toLowerCase();
    const hasActionVerb = actionVerbs.some((verb) => lowerDecision.includes(verb));

    return hasActionVerb;
  }

  /**
   * Deduplicate decisions by content similarity
   * @param decisions - Array of decisions
   * @returns Deduplicated decisions
   */
  private deduplicateDecisions(decisions: Decision[]): Decision[] {
    const unique: Decision[] = [];
    const seen = new Set<string>();

    for (const decision of decisions) {
      // Normalize decision text for comparison
      const normalized = decision.decision.toLowerCase().trim().substring(0, 50);

      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(decision);
      }
    }

    return unique;
  }

  /**
   * Sort decisions by impact (high > medium > low)
   * @param decisions - Array of decisions
   * @returns Sorted decisions
   */
  private sortByImpact(decisions: Decision[]): Decision[] {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return decisions.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
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
        // Extract decision sentence (summary) but keep FULL context
        const decisionText = this.extractDecisionSentence(msg.content);

        decisions.push({
          timestamp: msg.timestamp,
          decision: decisionText,
          context: msg.content, // ✅ FULL context, NO truncation
          impact: this.assessImpact(decisionText),
        });
      }
    });

    return decisions;
  }

  /**
   * Extract the actual decision sentence from message content
   * Instead of using the entire message, extract just the sentence with the decision
   */
  private extractDecisionSentence(content: string): string {
    // Split into sentences
    const sentences = content
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Find the sentence with decision keywords
    const decisionKeywords = ['decided', 'will', 'should', 'must', 'agreed', 'chose'];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (decisionKeywords.some((keyword) => lowerSentence.includes(keyword))) {
        // Return FULL sentence, NO truncation
        return sentence;
      }
    }

    // Fallback: return first sentence, NO truncation
    const firstSentence = sentences[0] || content;
    return firstSentence;
  }

  /**
   * Extract context around decision
   * NO TRUNCATION - returns full surrounding context
   * @param text - Full text
   * @returns Context string (full text)
   */
  private extractContext(text: string): string {
    // Return full text as context - let LILL-Meta decide what's relevant
    return text.trim();
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
