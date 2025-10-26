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
 *
 * NOW USES aicf-core v2.1.0 MemoryFileWriter:
 * - Proper AICF escaping (newlines and pipes)
 * - Enterprise-grade file operations
 * - Backward compatible with existing code
 */

import { MemoryFileWriter as CoreMemoryFileWriter } from 'aicf-core';
import type { AnalysisResult, Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Writer for memory files (.aicf and .ai formats)
 * Delegates AICF generation to aicf-core v2.1.0
 * Keeps markdown generation local (not in aicf-core)
 */
export class MemoryFileWriter {
  private coreWriter: CoreMemoryFileWriter;
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    this.coreWriter = new CoreMemoryFileWriter(cwd);
  }

  /**
   * Generate AICF format content using aicf-core v2.1.0
   * @param analysis - Analysis result
   * @param conversationId - Conversation ID
   * @returns AICF content as string
   */
  generateAICF(analysis: AnalysisResult, conversationId: string): string {
    // Delegate to aicf-core's MemoryFileWriter
    return this.coreWriter.generateAICF(analysis, conversationId);
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
   * Write AICF content to file in recent/ folder with date in filename
   * All new conversations start in recent/ (0-7 days)
   * MemoryDropoffAgent will move them to medium/old/archive based on age
   * Filename format: {date}_{conversationId}.aicf (e.g., 2025-10-24_abc123.aicf)
   *
   * NOW USES aicf-core v2.1.0 FOR ENTERPRISE-GRADE WRITES:
   * - Proper AICF escaping (newlines and pipes)
   * - Thread-safe file operations
   * - Atomic writes (all-or-nothing)
   */
  async writeAICF(
    conversationId: string,
    content: string,
    cwd: string = this.cwd,
    timestamp?: string
  ): Promise<Result<void>> {
    try {
      // Delegate to aicf-core's writeAICF
      await this.coreWriter.writeAICF(conversationId, content, cwd, timestamp);
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
   * This method throws errors instead of returning Result
   */
  writeAICFSync(
    conversationId: string,
    content: string,
    cwd: string = this.cwd,
    timestamp?: string
  ): void {
    // Delegate to aicf-core's writeAICFSync
    this.coreWriter.writeAICFSync(conversationId, content, cwd, timestamp);
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
