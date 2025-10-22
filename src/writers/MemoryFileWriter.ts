/**
 * Memory File Writer
 * Writes analysis results to .aicf and .ai memory files
 * Phase 2.4: Integration - October 2025
 */

import type { AnalysisResult } from '../types/index.js';

/**
 * Writer for memory files (.aicf and .ai formats)
 */
export class MemoryFileWriter {
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
}
