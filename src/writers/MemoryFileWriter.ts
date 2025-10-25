/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Memory File Writer
 * Writes analysis results to .aicf and .ai memory files
 * Phase 2.4: Integration - October 2025
 * Phase 8: Enhanced with aicf-core integration - October 2025
 */

import type { AnalysisResult, Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { AICFWriter } from 'aicf-core';

/**
 * Writer for memory files (.aicf and .ai formats)
 * Now uses aicf-core for enterprise-grade file operations
 */
export class MemoryFileWriter {
  private aicfWriter: AICFWriter;
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    this.aicfWriter = new AICFWriter(join(cwd, '.aicf'));
  }
  /**
   * Generate AICF format content
   * @param analysis - Analysis result
   * @param conversationId - Conversation ID
   * @returns AICF content as string
   */
  generateAICF(analysis: AnalysisResult, conversationId: string): string {
    const timestamp = new Date().toISOString();

    // Serialize each component
    const userIntents = this.serializeUserIntents(analysis.userIntents);
    const aiActions = this.serializeAIActions(analysis.aiActions);
    const technicalWork = this.serializeTechnicalWork(analysis.technicalWork);
    const decisions = this.serializeDecisions(analysis.decisions);
    const flow = this.serializeFlow(analysis.flow);
    const workingState = this.serializeWorkingState(analysis.workingState);

    // Build AICF content (pipe-delimited)
    const lines = [
      `version|3.0.0-alpha`,
      `timestamp|${timestamp}`,
      `conversationId|${conversationId}`,
      `userIntents|${userIntents}`,
      `aiActions|${aiActions}`,
      `technicalWork|${technicalWork}`,
      `decisions|${decisions}`,
      `flow|${flow}`,
      `workingState|${workingState}`,
    ];

    return lines.join('\n');
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

  /**
   * Serialize user intents to pipe-delimited format
   */
  private serializeUserIntents(intents: AnalysisResult['userIntents']): string {
    if (intents.length === 0) return '';
    return intents.map((i) => `${i.timestamp}|${i.intent}|${i.confidence}`).join(';');
  }

  /**
   * Serialize AI actions to pipe-delimited format
   */
  private serializeAIActions(actions: AnalysisResult['aiActions']): string {
    if (actions.length === 0) return '';
    return actions.map((a) => `${a.timestamp}|${a.type}|${a.details}`).join(';');
  }

  /**
   * Serialize technical work to pipe-delimited format
   */
  private serializeTechnicalWork(work: AnalysisResult['technicalWork']): string {
    if (work.length === 0) return '';
    return work.map((w) => `${w.timestamp}|${w.type}|${w.work}`).join(';');
  }

  /**
   * Serialize decisions to pipe-delimited format
   */
  private serializeDecisions(decisions: AnalysisResult['decisions']): string {
    if (decisions.length === 0) return '';
    return decisions.map((d) => `${d.timestamp}|${d.decision}|${d.impact}`).join(';');
  }

  /**
   * Serialize flow to pipe-delimited format
   */
  private serializeFlow(flow: AnalysisResult['flow']): string {
    return `${flow.turns}|${flow.dominantRole}|${flow.sequence.join(',')}`;
  }

  /**
   * Serialize working state to pipe-delimited format
   */
  private serializeWorkingState(state: AnalysisResult['workingState']): string {
    return `${state.currentTask}|${state.blockers.join(',')}|${state.nextAction}`;
  }

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
   * NOW USES aicf-core FOR ENTERPRISE-GRADE WRITES:
   * - Thread-safe file locking (prevents corruption)
   * - Atomic writes (all-or-nothing)
   * - Input validation (schema-based)
   * - PII redaction (if enabled)
   * - Error recovery (corrupted file detection)
   */
  async writeAICF(
    conversationId: string,
    content: string,
    cwd: string = this.cwd,
    timestamp?: string
  ): Promise<Result<void>> {
    try {
      // Ensure directory exists
      const aicfDir = join(cwd, '.aicf', 'recent');
      if (!existsSync(aicfDir)) {
        mkdirSync(aicfDir, { recursive: true });
      }

      // Use conversation timestamp if provided, otherwise use today
      // This is CRITICAL for historical conversations to be placed in correct age bucket
      const conversationDate = timestamp
        ? new Date(timestamp).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Build relative file path for aicf-core
      const fileName = `recent/${conversationDate}_${conversationId}.aicf`;

      // Use aicf-core's appendLine for enterprise-grade writes
      // This gives us: thread-safe locking, validation, PII redaction, error recovery
      const result = await this.aicfWriter.appendLine(fileName, content);

      if (!result.ok) {
        return Err(new Error(`Failed to write AICF file: ${result.error.message}`));
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
   * This method throws errors instead of returning Result
   */
  writeAICFSync(
    conversationId: string,
    content: string,
    cwd: string = this.cwd,
    timestamp?: string
  ): void {
    const aicfDir = join(cwd, '.aicf', 'recent');
    if (!existsSync(aicfDir)) {
      mkdirSync(aicfDir, { recursive: true });
    }
    const conversationDate = timestamp
      ? new Date(timestamp).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const fileName = `recent/${conversationDate}_${conversationId}.aicf`;

    // Note: This bypasses aicf-core's safety features
    // Use async writeAICF() for enterprise-grade writes
    const result = this.aicfWriter.appendLine(fileName, content);

    // Block until promise resolves (not ideal, but needed for sync API)
    if (result instanceof Promise) {
      throw new Error('Cannot use sync write with async aicf-core. Use writeAICF() instead.');
    }
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
