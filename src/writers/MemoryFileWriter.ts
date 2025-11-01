/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Memory File Writer
 * Writes analysis results to .aicf and .ai memory files
 * Phase 2.4: Integration - October 2025
 * Phase 8: Enhanced with aicf-core v2.1.0 integration - October 2025
 * Phase 1 (AETHER Consolidation): Enhanced with AICF v3.1 bridge - October 2025
 *
 * NOW USES aicf-core v2.2.0 AICEToAICFBridge:
 * - AICF v3.1 format with semantic tags
 * - Proper memory categorization (episodic, semantic, procedural)
 * - Multi-file architecture (sessions, conversations, decisions, memories)
 * - Enterprise-grade file operations
 */

import { AICEToAICFBridge } from 'aicf-core';
import type { AnalysisResult, Result, Conversation } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { join } from 'path';
import { promises as fs } from 'fs';

/**
 * Writer for memory files (.aicf and .ai formats)
 * Uses aicf-core v2.2.0 bridge for AICF v3.1 format
 * Keeps markdown generation local (not in aicf-core)
 */
export class MemoryFileWriter {
  private bridge: AICEToAICFBridge;
  private cwd: string;
  private rawDir: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    const aicfDir = join(cwd, '.aicf');
    this.rawDir = join(aicfDir, 'raw');
    this.bridge = new AICEToAICFBridge(aicfDir);
  }

  /**
   * Generate AICF format content using aicf-core v2.2.0 bridge
   * @deprecated Use writeAICF() instead - v3.1 format writes directly to files
   * @param _analysis - Analysis result (unused)
   * @param conversationId - Conversation ID
   * @returns AICF content as string (legacy format for backward compatibility)
   */
  generateAICF(_analysis: AnalysisResult, conversationId: string): string {
    // For backward compatibility, return a simple representation
    // Real v3.1 format is written directly to files via writeAICF()
    const timestamp = new Date().toISOString();
    return `# AICF v3.1 Format\n# Use writeAICF() to write to files\n# Conversation: ${conversationId}\n# Timestamp: ${timestamp}`;
  }

  /**
   * Generate human-readable markdown content
   * @param analysis - Analysis result
   * @param conversationId - Conversation ID
   * @returns Markdown content as string
   */
  generateMarkdown(analysis: AnalysisResult, conversationId: string): string {
    const timestamp = new Date().toISOString();

    const sections = [
      `# Conversation Analysis`,
      ``,
      `**Conversation ID:** ${conversationId}`,
      `**Generated:** ${timestamp}`,
      ``,
      this.markdownUserIntents(analysis.userIntents),
      ``,
      this.markdownAIActions(analysis.aiActions),
      ``,
      this.markdownTechnicalWork(analysis.technicalWork),
      ``,
      this.markdownDecisions(analysis.decisions),
      ``,
      this.markdownFlow(analysis.flow),
      ``,
      this.markdownWorkingState(analysis.workingState),
    ];

    return sections.join('\n');
  }

  // ============================================================================
  // Markdown Generation (Local - Not in aicf-core)
  // ============================================================================

  /**
   * Generate markdown for user intents
   */
  private markdownUserIntents(intents: AnalysisResult['userIntents']): string {
    if (intents.length === 0) return '## User Intents\n\nNo intents extracted.';

    const items = intents.map((i) => `- **${i.confidence}:** ${i.intent}`).join('\n');

    return `## User Intents\n\n${items}`;
  }

  /**
   * Generate markdown for AI actions
   */
  private markdownAIActions(actions: AnalysisResult['aiActions']): string {
    if (actions.length === 0) return '## AI Actions\n\nNo actions extracted.';

    const items = actions.map((a) => `- **${a.type}:** ${a.details}`).join('\n');

    return `## AI Actions\n\n${items}`;
  }

  /**
   * Generate markdown for technical work
   */
  private markdownTechnicalWork(work: AnalysisResult['technicalWork']): string {
    if (work.length === 0) return '## Technical Work\n\nNo technical work extracted.';

    const items = work.map((w) => `- **${w.type}:** ${w.work}`).join('\n');

    return `## Technical Work\n\n${items}`;
  }

  /**
   * Generate markdown for decisions
   */
  private markdownDecisions(decisions: AnalysisResult['decisions']): string {
    if (decisions.length === 0) return '## Decisions\n\nNo decisions extracted.';

    const items = decisions
      .map((d) => `- **${d.impact} impact:** ${d.decision}\n  - Context: ${d.context}`)
      .join('\n');

    return `## Decisions\n\n${items}`;
  }

  /**
   * Generate markdown for flow
   */
  private markdownFlow(flow: AnalysisResult['flow']): string {
    return `## Conversation Flow\n\n- **Turns:** ${flow.turns}\n- **Dominant Role:** ${flow.dominantRole}\n- **Sequence:** ${flow.sequence.join(' → ')}`;
  }

  /**
   * Generate markdown for working state
   */
  private markdownWorkingState(state: AnalysisResult['workingState']): string {
    const blockers = state.blockers.length > 0 ? state.blockers.join(', ') : 'None';
    return `## Working State\n\n- **Current Task:** ${state.currentTask}\n- **Blockers:** ${blockers}\n- **Next Action:** ${state.nextAction}`;
  }

  /**
   * Write clean JSON to .aicf/raw/ directory
   * This is the new primary method - outputs structured JSON for AICF-Core watcher to process
   *
   * @param conversationId - Conversation ID
   * @param analysis - Analysis result to write
   * @param conversation - Full conversation object with messages and metadata
   * @returns Result<void>
   */
  async writeJSON(
    conversationId: string,
    analysis: AnalysisResult,
    conversation: Conversation
  ): Promise<Result<void>> {
    try {
      // Ensure raw directory exists
      await fs.mkdir(this.rawDir, { recursive: true });

      // Create clean JSON structure
      const date = new Date().toISOString().split('T')[0];
      const jsonData = {
        metadata: {
          conversationId,
          date,
          platform: conversation.source || 'augment',
          user: 'dennis_van_leeuwen',
          status: 'completed',
          timestamp_start: conversation.timestamp,
          timestamp_end: new Date().toISOString(),
          duration_minutes: Math.floor(
            (new Date().getTime() - new Date(conversation.timestamp).getTime()) / 60000
          ),
          messages: conversation.messages.length,
          tokens_estimated: conversation.messages.reduce(
            (sum, msg) => sum + Math.floor(msg.content.length / 4),
            0
          ),
        },
        conversation: {
          topic: this.extractTopic(analysis),
          summary: this.extractSummary(analysis),
          participants: ['user_dennis', 'assistant_augment'],
          flow: analysis.flow.sequence,
        },
        key_exchanges: conversation.messages.map((msg, idx) => ({
          index: idx,
          timestamp: msg.timestamp,
          role: msg.role,
          content: msg.content.substring(0, 500), // First 500 chars for key exchanges
          full_content_length: msg.content.length,
        })),
        decisions: analysis.decisions.map((d) => ({
          timestamp: d.timestamp,
          decision: d.decision,
          context: d.context,
          impact: d.impact,
        })),
        insights: analysis.technicalWork.map((w) => ({
          timestamp: w.timestamp,
          insight: w.work,
          type: w.type,
          source: w.source,
        })),
        technical_work: analysis.technicalWork.map((w) => ({
          timestamp: w.timestamp,
          work: w.work,
          type: w.type,
        })),
        state: {
          current_task: analysis.workingState.currentTask,
          blockers: analysis.workingState.blockers,
          next_action: analysis.workingState.nextAction,
          last_update: analysis.workingState.lastUpdate,
        },
        user_intents: analysis.userIntents.map((i) => ({
          timestamp: i.timestamp,
          intent: i.intent,
          confidence: i.confidence,
          inferred_from: i.inferredFrom,
        })),
        ai_actions: analysis.aiActions.map((a) => ({
          timestamp: a.timestamp,
          type: a.type,
          details: a.details,
          source: a.source,
        })),
      };

      // Write to .aicf/raw/{date}_{conversationId}.json
      const filename = `${date}_${conversationId}.json`;
      const filepath = join(this.rawDir, filename);
      await fs.writeFile(filepath, JSON.stringify(jsonData, null, 2), 'utf-8');

      return Ok(undefined);
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Failed to write JSON file: ${String(error)}`)
      );
    }
  }

  /**
   * Extract topic from analysis
   */
  private extractTopic(analysis: AnalysisResult): string {
    if (analysis.userIntents.length > 0 && analysis.userIntents[0]) {
      return analysis.userIntents[0].intent.substring(0, 100);
    }
    if (analysis.workingState.currentTask) {
      return analysis.workingState.currentTask;
    }
    return 'Conversation';
  }

  /**
   * Extract summary from analysis
   */
  private extractSummary(analysis: AnalysisResult): string {
    const parts: string[] = [];
    if (analysis.userIntents.length > 0 && analysis.userIntents[0]) {
      parts.push(`User requested: ${analysis.userIntents[0].intent.substring(0, 100)}`);
    }
    if (analysis.decisions.length > 0) {
      parts.push(`Decisions made: ${analysis.decisions.length}`);
    }
    if (analysis.technicalWork.length > 0) {
      parts.push(`Technical work: ${analysis.technicalWork.length} items`);
    }
    return parts.join('. ') || 'Conversation captured';
  }

  /**
   * Write AICF v3.1 format to multiple semantic files
   * Uses aicf-core v2.2.0 bridge to transform AnalysisResult into proper AICF v3.1 format
   *
   * @deprecated Use writeJSON() instead - new pipeline uses JSON → AICF-Core watcher → AICF v3.1
   *
   * Writes to multiple files:
   * - sessions.aicf - Session metadata and metrics
   * - conversations.aicf - User intents and AI actions
   * - decisions.aicf - Decisions with context
   * - memories.aicf - Technical work and working state
   *
   * @param conversationId - Conversation ID
   * @param analysis - Analysis result to write
   * @param _cwd - Working directory (unused, uses constructor cwd)
   * @param _timestamp - Conversation timestamp (unused, uses analysis timestamps)
   * @returns Result<void>
   */
  async writeAICF(
    conversationId: string,
    analysis: AnalysisResult,
    _cwd: string = this.cwd,
    _timestamp?: string
  ): Promise<Result<void>> {
    try {
      // Use bridge to transform and write AICF v3.1 format
      const result = await this.bridge.transform(analysis, {
        conversationId,
        sessionId: conversationId,
        appName: 'augment',
        userId: 'default',
        source: 'augment',
      });

      if (!result.ok) {
        return Err(result.error);
      }

      return Ok(undefined);
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Failed to write AICF file: ${String(error)}`)
      );
    }
  }

  /**
   * Synchronous version of writeAICF for backward compatibility
   * DEPRECATED: Use async writeAICF() instead
   * v3.1 format requires async operations, this method is no longer supported
   */
  writeAICFSync(
    _conversationId: string,
    _content: string,
    _cwd: string = this.cwd,
    _timestamp?: string
  ): void {
    throw new Error(
      'writeAICFSync is deprecated and not supported with AICF v3.1 format. Use async writeAICF() instead.'
    );
  }

  /**
   * Write Markdown content to file in recent/ folder
   * DEPRECATED: We only use AICF format now
   * Keeping for backward compatibility
   */

  writeMarkdown(_conversationId: string, _content: string, _cwd: string = process.cwd()): void {
    // Markdown files are no longer written
    // All conversation data is stored in AICF format only
    // This method is kept for backward compatibility but does nothing
  }
}
