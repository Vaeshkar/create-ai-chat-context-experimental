/**
 * ReasoningExtractor - Extract hypotheticals, alternatives, and rejected patterns
 *
 * Extracts decision-making patterns from conversations:
 * - Hypotheticals: "Should we X or Y?"
 * - Alternatives: Options considered (accepted/rejected/deferred)
 * - Rejected patterns: "We tried X but it failed"
 * - Lessons learned: "Next time, do Y instead"
 */

import type {
  Hypothetical,
  Alternative,
  RejectedAlternative,
  HypotheticalStatus,
  AlternativeStatus,
} from 'lill-core';
import { createHash } from 'crypto';

export interface ReasoningExtractionResult {
  hypotheticals: Hypothetical[];
  rejectedAlternatives: RejectedAlternative[];
}

/**
 * Raw conversation structure from .lill/raw/*.json files
 */
export interface RawConversation {
  metadata: {
    conversationId: string;
    date: string;
    platform: string;
    [key: string]: unknown;
  };
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  decisions?: Array<{
    decision: string;
    reason?: string;
    context?: string;
    timestamp?: string;
    alternatives_considered?: string[];
  }>;
  insights?: Array<{
    insight: string;
    category?: string;
    confidence?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Extract reasoning patterns from a conversation
 */
export class ReasoningExtractor {
  /**
   * Extract hypotheticals and rejected alternatives from conversation
   */
  extract(conversation: RawConversation): ReasoningExtractionResult {
    const hypotheticals: Hypothetical[] = [];
    const rejectedAlternatives: RejectedAlternative[] = [];

    // Extract from messages
    for (let i = 0; i < conversation.messages.length; i++) {
      const message = conversation.messages[i];
      if (!message) continue;
      const nextMessage = conversation.messages[i + 1];

      // Extract hypotheticals (questions with options)
      const extractedHypotheticals = this.extractHypotheticals(
        message.content,
        nextMessage?.content,
        conversation.metadata.conversationId,
        message.timestamp
      );
      hypotheticals.push(...extractedHypotheticals);

      // Extract rejected alternatives
      const extractedRejected = this.extractRejectedAlternatives(
        message.content,
        conversation.metadata.conversationId,
        message.timestamp
      );
      rejectedAlternatives.push(...extractedRejected);
    }

    // Extract from decisions (if available)
    if (conversation.decisions) {
      for (const decision of conversation.decisions) {
        const decisionHypotheticals = this.extractFromDecision(
          decision,
          conversation.metadata.conversationId
        );
        hypotheticals.push(...decisionHypotheticals);
      }
    }

    return { hypotheticals, rejectedAlternatives };
  }

  /**
   * Extract hypotheticals from message content
   */
  private extractHypotheticals(
    content: string,
    nextContent: string | undefined,
    conversationId: string,
    timestamp: string
  ): Hypothetical[] {
    const hypotheticals: Hypothetical[] = [];

    // Pattern 1: "Should we X or Y?"
    const shouldWePattern = /should we ([^?]+)\?/gi;
    let match;
    while ((match = shouldWePattern.exec(content)) !== null) {
      if (!match[1]) continue;
      const question = `Should we ${match[1]}?`;
      const alternatives = this.extractAlternativesFromQuestion(match[1], nextContent);

      if (alternatives.length > 0) {
        hypotheticals.push({
          id: this.generateId(question, conversationId),
          question,
          alternatives,
          status: this.determineStatus(alternatives),
          evidence: content.substring(0, 200),
          created_at: new Date(timestamp),
          updated_at: new Date(timestamp),
        });
      }
    }

    // Pattern 2: "Option A vs Option B" or "Option 1, Option 2"
    const optionPattern = /option\s+([a-z0-9]+)[,\s]+(?:or\s+)?option\s+([a-z0-9]+)/gi;
    while ((match = optionPattern.exec(content)) !== null) {
      if (!match[1] || !match[2]) continue;
      const question = `Which option: ${match[1]} or ${match[2]}?`;
      const alternatives = this.extractOptionsFromContent(content, nextContent);

      if (alternatives.length > 0) {
        hypotheticals.push({
          id: this.generateId(question, conversationId),
          question,
          alternatives,
          status: this.determineStatus(alternatives),
          evidence: content.substring(0, 200),
          created_at: new Date(timestamp),
          updated_at: new Date(timestamp),
        });
      }
    }

    // Pattern 3: "X or Y?" (simple binary choice)
    const binaryPattern = /([^.!?]+)\s+or\s+([^.!?]+)\?/gi;
    while ((match = binaryPattern.exec(content)) !== null) {
      if (!match[1] || !match[2]) continue;
      const optionA = match[1].trim();
      const optionB = match[2].trim();

      // Skip if too long (likely not a real choice)
      if (optionA.length > 100 || optionB.length > 100) continue;

      const question = `${optionA} or ${optionB}?`;
      const alternatives: Alternative[] = [
        { option: optionA, status: 'deferred', reason: 'Under consideration' },
        { option: optionB, status: 'deferred', reason: 'Under consideration' },
      ];

      // Check if next message has a decision
      if (nextContent) {
        this.updateAlternativeStatus(alternatives, nextContent);
      }

      hypotheticals.push({
        id: this.generateId(question, conversationId),
        question,
        alternatives,
        status: this.determineStatus(alternatives),
        evidence: content.substring(0, 200),
        created_at: new Date(timestamp),
        updated_at: new Date(timestamp),
      });
    }

    return hypotheticals;
  }

  /**
   * Extract alternatives from question text
   */
  private extractAlternativesFromQuestion(
    questionText: string,
    nextContent: string | undefined
  ): Alternative[] {
    const alternatives: Alternative[] = [];

    // Look for "X or Y" pattern
    const orPattern = /(.+?)\s+or\s+(.+)/i;
    const match = orPattern.exec(questionText);

    if (match && match[1] && match[2]) {
      alternatives.push({
        option: match[1].trim(),
        status: 'deferred',
        reason: 'Under consideration',
      });
      alternatives.push({
        option: match[2].trim(),
        status: 'deferred',
        reason: 'Under consideration',
      });

      // Update status based on next message
      if (nextContent) {
        this.updateAlternativeStatus(alternatives, nextContent);
      }
    }

    return alternatives;
  }

  /**
   * Extract options from content (Option 1, Option 2, etc.)
   */
  private extractOptionsFromContent(
    content: string,
    nextContent: string | undefined
  ): Alternative[] {
    const alternatives: Alternative[] = [];
    const optionPattern = /option\s+([a-z0-9]+)[:\s]+([^.\n]+)/gi;
    let match;

    while ((match = optionPattern.exec(content)) !== null) {
      if (!match[1] || !match[2]) continue;
      alternatives.push({
        option: `Option ${match[1]}: ${match[2].trim()}`,
        status: 'deferred',
        reason: 'Under consideration',
      });
    }

    // Update status based on next message
    if (nextContent && alternatives.length > 0) {
      this.updateAlternativeStatus(alternatives, nextContent);
    }

    return alternatives;
  }

  /**
   * Update alternative status based on response
   */
  private updateAlternativeStatus(alternatives: Alternative[], response: string): void {
    const responseLower = response.toLowerCase();

    for (const alt of alternatives) {
      const optionLower = alt.option.toLowerCase();

      // Check for acceptance
      if (
        responseLower.includes(`let's do ${optionLower}`) ||
        responseLower.includes(`let's use ${optionLower}`) ||
        responseLower.includes(`go with ${optionLower}`) ||
        responseLower.includes(`choose ${optionLower}`) ||
        responseLower.includes(`selected: ${optionLower}`)
      ) {
        alt.status = 'accepted';
        alt.reason = 'Selected in response';
        alt.confidence = 0.9;
      }

      // Check for rejection
      if (
        responseLower.includes(`not ${optionLower}`) ||
        responseLower.includes(`reject ${optionLower}`) ||
        responseLower.includes(`${optionLower} won't work`) ||
        responseLower.includes(`${optionLower} failed`)
      ) {
        alt.status = 'rejected';
        alt.reason = 'Rejected in response';
        alt.confidence = 0.9;
      }
    }
  }

  /**
   * Extract rejected alternatives from content
   */
  private extractRejectedAlternatives(
    content: string,
    conversationId: string,
    timestamp: string
  ): RejectedAlternative[] {
    const rejected: RejectedAlternative[] = [];

    // Pattern 1: "We tried X but it failed because Y"
    const triedButPattern = /we tried ([^,]+),?\s+but\s+(?:it\s+)?([^.!?]+)/gi;
    let match;
    while ((match = triedButPattern.exec(content)) !== null) {
      if (!match[1] || !match[2]) continue;
      rejected.push({
        id: this.generateId(`rejected-${match[1]}`, conversationId),
        option: match[1].trim(),
        reason: match[2].trim(),
        evidence: content.substring(0, 200),
        created_at: new Date(timestamp),
      });
    }

    // Pattern 2: "X doesn't work because Y"
    const doesntWorkPattern =
      /([^.!?]+)\s+(?:doesn't|does not|won't|will not)\s+work\s+because\s+([^.!?]+)/gi;
    while ((match = doesntWorkPattern.exec(content)) !== null) {
      if (!match[1] || !match[2]) continue;
      rejected.push({
        id: this.generateId(`rejected-${match[1]}`, conversationId),
        option: match[1].trim(),
        reason: `Doesn't work: ${match[2].trim()}`,
        evidence: content.substring(0, 200),
        created_at: new Date(timestamp),
      });
    }

    // Pattern 3: "Rejected: X (reason: Y)"
    const rejectedPattern = /rejected:\s*([^(]+)\s*\(reason:\s*([^)]+)\)/gi;
    while ((match = rejectedPattern.exec(content)) !== null) {
      if (!match[1] || !match[2]) continue;
      rejected.push({
        id: this.generateId(`rejected-${match[1]}`, conversationId),
        option: match[1].trim(),
        reason: match[2].trim(),
        evidence: content.substring(0, 200),
        created_at: new Date(timestamp),
      });
    }

    return rejected;
  }

  /**
   * Extract hypotheticals from decision objects
   */
  private extractFromDecision(
    decision: RawConversation['decisions'][number],
    conversationId: string
  ): Hypothetical[] {
    const hypotheticals: Hypothetical[] = [];

    if (decision.alternatives_considered && Array.isArray(decision.alternatives_considered)) {
      const alternatives: Alternative[] = decision.alternatives_considered.map((alt: string) => ({
        option: alt,
        status: 'deferred' as AlternativeStatus,
        reason: 'Listed as alternative',
      }));

      hypotheticals.push({
        id: this.generateId(decision.decision, conversationId),
        question: `Should we ${decision.decision}?`,
        alternatives,
        status: 'validated',
        evidence: decision.reason || decision.context || '',
        created_at: new Date(decision.timestamp || Date.now()),
        updated_at: new Date(decision.timestamp || Date.now()),
      });
    }

    return hypotheticals;
  }

  /**
   * Determine hypothetical status based on alternatives
   */
  private determineStatus(alternatives: Alternative[]): HypotheticalStatus {
    const hasAccepted = alternatives.some((a) => a.status === 'accepted');
    const hasRejected = alternatives.some((a) => a.status === 'rejected');
    const allDeferred = alternatives.every((a) => a.status === 'deferred');

    if (hasAccepted) return 'validated';
    if (hasRejected && !hasAccepted) return 'rejected';
    if (allDeferred) return 'deferred';
    return 'considered';
  }

  /**
   * Generate unique ID for hypothetical/rejected
   */
  private generateId(text: string, conversationId: string): string {
    const hash = createHash('md5').update(`${text}-${conversationId}`).digest('hex');
    return `reasoning-${hash.substring(0, 16)}`;
  }
}
