/**
 * Conversation Orchestrator
 * Combines all extractors and parsers into unified analysis
 * Phase 2.4: Integration - October 2025
 */

import type { Message, Conversation, ConversationSummary } from '../types/index.js';
import type { AnalysisResult } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err, ExtractionError } from '../types/index.js';

import { ConversationSummaryParser } from '../parsers/ConversationSummaryParser.js';
import { AugmentParser } from '../parsers/AugmentParser.js';
import { GenericParser } from '../parsers/GenericParser.js';

import { IntentExtractor } from '../extractors/IntentExtractor.js';
import { ActionExtractor } from '../extractors/ActionExtractor.js';
import { TechnicalWorkExtractor } from '../extractors/TechnicalWorkExtractor.js';
import { DecisionExtractor } from '../extractors/DecisionExtractor.js';
import { FlowExtractor } from '../extractors/FlowExtractor.js';
import { StateExtractor } from '../extractors/StateExtractor.js';

/**
 * Orchestrator that combines all extractors and parsers
 * Provides unified analysis of conversations
 */
export class ConversationOrchestrator {
  private summaryParser: ConversationSummaryParser;
  private augmentParser: AugmentParser;
  private genericParser: GenericParser;

  private intentExtractor: IntentExtractor;
  private actionExtractor: ActionExtractor;
  private technicalWorkExtractor: TechnicalWorkExtractor;
  private decisionExtractor: DecisionExtractor;
  private flowExtractor: FlowExtractor;
  private stateExtractor: StateExtractor;

  constructor() {
    // Initialize parsers
    this.summaryParser = new ConversationSummaryParser();
    this.augmentParser = new AugmentParser();
    this.genericParser = new GenericParser();

    // Initialize extractors
    this.intentExtractor = new IntentExtractor();
    this.actionExtractor = new ActionExtractor();
    this.technicalWorkExtractor = new TechnicalWorkExtractor();
    this.decisionExtractor = new DecisionExtractor();
    this.flowExtractor = new FlowExtractor();
    this.stateExtractor = new StateExtractor();
  }

  /**
   * Analyze a conversation with all extractors
   * @param conversation - Conversation to analyze
   * @param rawData - Optional raw data for parsing
   * @returns Result with AnalysisResult or error
   */
  analyze(conversation: Conversation, rawData?: string): Result<AnalysisResult> {
    try {
      // Parse raw data if provided
      let summary: ConversationSummary | null = null;
      let messages = conversation.messages;

      if (rawData) {
        // Try to parse raw data (ignore errors, use conversation messages as fallback)
        const parseResult = this.parseRawData(rawData, conversation.id);
        if (parseResult.ok && parseResult.value.length > 0) {
          messages = parseResult.value;
        }
      }

      // Extract summary from messages
      const summaryResult = this.summaryParser.extractSummary(messages);
      if (summaryResult.ok) {
        summary = summaryResult.value;
      }

      // Extract all analysis components
      const intentsResult = this.intentExtractor.extract(messages, summary);
      const actionsResult = this.actionExtractor.extract(messages, summary);
      const workResult = this.technicalWorkExtractor.extract(messages, summary);
      const decisionsResult = this.decisionExtractor.extract(messages, summary);
      const flowResult = this.flowExtractor.extract(messages);
      const stateResult = this.stateExtractor.extract(messages, summary);

      // Check for errors
      if (!intentsResult.ok) return intentsResult;
      if (!actionsResult.ok) return actionsResult;
      if (!workResult.ok) return workResult;
      if (!decisionsResult.ok) return decisionsResult;
      if (!flowResult.ok) return flowResult;
      if (!stateResult.ok) return stateResult;

      // Combine results
      const analysis: AnalysisResult = {
        userIntents: intentsResult.value,
        aiActions: actionsResult.value,
        technicalWork: workResult.value,
        decisions: decisionsResult.value,
        flow: flowResult.value,
        workingState: stateResult.value,
      };

      return Ok(analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to analyze conversation: ${message}`, error));
    }
  }

  /**
   * Parse raw data using appropriate parser
   * @param rawData - Raw data to parse
   * @param conversationId - Conversation ID
   * @returns Result with Message[] or error
   */
  private parseRawData(rawData: string, conversationId: string): Result<Message[]> {
    try {
      // Try Augment parser first
      if (this.augmentParser.isAugmentData(rawData)) {
        const result = this.augmentParser.parse(rawData, conversationId);
        if (result.ok && result.value.length > 0) {
          return result;
        }
        // If Augment parser failed, continue to generic parser
      }

      // Try generic parser
      if (this.genericParser.isGenericData(rawData)) {
        const result = this.genericParser.parse(rawData, conversationId);
        if (result.ok && result.value.length > 0) {
          return result;
        }
        // If generic parser failed, continue
      }

      // Return empty array if no parser matched or all failed
      return Ok([]);
    } catch {
      // Return empty array on error instead of propagating error
      // This allows analysis to continue with conversation messages
      return Ok([]);
    }
  }

  /**
   * Detect conversation source from raw data
   * @param rawData - Raw data to analyze
   * @returns Detected source ('augment', 'generic', or 'unknown')
   */
  detectSource(rawData: string): 'augment' | 'generic' | 'unknown' {
    if (this.augmentParser.isAugmentData(rawData)) {
      return 'augment';
    }
    if (this.genericParser.isGenericData(rawData)) {
      return 'generic';
    }
    return 'unknown';
  }
}
