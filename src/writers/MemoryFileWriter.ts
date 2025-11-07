/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Memory File Writer
 * Writes analysis results to JSON files in .lill/raw/
 *
 * AETHER Consolidation (November 2025):
 * - Removed AICF format dependency
 * - Writes JSON directly to .lill/raw/
 * - ConversationWatcher indexes JSON to QuadIndex
 * - Simplified architecture: JSON → QuadIndex → Snapshots
 */

import type { AnalysisResult, Result, Conversation } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { join } from 'path';
import { promises as fs } from 'fs';
import { PathValidator } from '../utils/PathValidator.js';
import { AuditLogger } from '../utils/AuditLogger.js';

/**
 * Writer for memory files (JSON format)
 * AICF format removed - now writes JSON directly to .lill/raw/
 * Part of AETHER consolidation (November 2025)
 */
export class MemoryFileWriter {
  private cwd: string;
  private rawDir: string;
  private auditLogger: AuditLogger;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    const lillDir = join(cwd, '.lill');
    this.rawDir = join(lillDir, 'raw');
    this.auditLogger = new AuditLogger(cwd);
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
  // Markdown Generation (Local)
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
   * Write clean JSON to .lill/raw/ directory (FIXED - NO TRUNCATION)
   * This is the primary method - outputs structured JSON for ConversationWatcher to process
   *
   * Layer 2: Code Guards - Manual validation using PathValidator:
   * - Pre-validation: Checks if path is allowed for writing
   * - Audit logging: Logs violations to .lill/.audit.log
   * - Blocks write if validation fails
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
      // Create clean JSON structure with FULL content (no truncation)
      const date = new Date().toISOString().split('T')[0];
      const filename = `${date}_${conversationId}.json`;
      const filepath = join(this.rawDir, filename);

      // 🛡️ VALIDATE WRITE OPERATION (Layer 2: Code Guards)
      const validation = PathValidator.validateWrite(filepath);
      if (!validation.ok) {
        // Log violation to audit log
        await this.auditLogger.logViolation(
          PathValidator.getBlockingRule(filepath) || 'unknown',
          filepath,
          'write',
          validation.error.message
        );
        return validation; // Block the write
      }

      // Ensure raw directory exists
      await fs.mkdir(this.rawDir, { recursive: true });

      const jsonData = {
        metadata: {
          conversationId,
          date,
          platform: conversation.source || 'augment-leveldb',
          user: 'dennis_van_leeuwen',
          status: 'completed',
          timestamp_start: conversation.timestamp,
          timestamp_end:
            conversation.messages[conversation.messages.length - 1]?.timestamp ||
            new Date().toISOString(),
          duration_minutes: Math.floor(
            (new Date(
              conversation.messages[conversation.messages.length - 1]?.timestamp || new Date()
            ).getTime() -
              new Date(conversation.timestamp).getTime()) /
              60000
          ),
          messages: conversation.messages.length,
          tokens_estimated: conversation.messages.reduce(
            (sum, msg) => sum + Math.floor(msg.content.length / 4),
            0
          ),
        },

        // Conversation summary
        conversation: {
          topic: this.extractTopic(analysis),
          summary: this.extractSummary(analysis),
          participants: ['user_dennis', 'assistant_augment'],
          flow: analysis.flow.sequence,
        },

        // ✅ FULL messages with complete content (no truncation)
        messages: conversation.messages.map((msg, idx) => ({
          index: idx,
          timestamp: msg.timestamp,
          role: msg.role,
          content: msg.content, // ✅ FULL content, NO truncation
          content_length: msg.content.length,

          // Extract structured data from content
          code_blocks: this.extractCodeBlocks(msg.content),
          diagrams: this.extractDiagrams(msg.content),
          file_references: this.extractFileReferences(msg.content),
          commands: this.extractCommands(msg.content),
        })),

        // ✅ Structured exchanges (user request → assistant response pairs)
        exchanges: this.extractExchanges(conversation.messages),

        decisions: analysis.decisions.map((d) => ({
          timestamp: d.timestamp,
          decision: d.decision,
          context: d.context, // ✅ Full context, no truncation
          impact: d.impact,
        })),

        insights: analysis.technicalWork.map((w) => ({
          timestamp: w.timestamp,
          insight: w.work, // ✅ Full insight, no truncation
          type: w.type,
          source: w.source,
        })),

        technical_work: analysis.technicalWork.map((w) => ({
          timestamp: w.timestamp,
          work: w.work, // ✅ Full work description, no truncation
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
          details: a.details, // ✅ Full details, no truncation
          source: a.source,
        })),
      };

      // Write to .lill/raw/{date}_{conversationId}.json (changed from .aicf to .lill)
      await fs.writeFile(filepath, JSON.stringify(jsonData, null, 2), 'utf-8');

      // ✅ Log successful compliance
      await this.auditLogger.logCompliance('lill-format-only', filepath, 'write');

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
   *
   * @deprecated AICF format removed - use writeJSON() instead
   * New pipeline: JSON → ConversationWatcher → QuadIndex → Snapshots
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
    _conversationId: string,
    _analysis: AnalysisResult,
    _cwd: string = this.cwd,
    _timestamp?: string
  ): Promise<Result<void>> {
    return Err(new Error('AICF format deprecated - use writeJSON() instead'));
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

  // ============================================================================
  // Content Extraction Methods (NEW - Extract structured data from messages)
  // ============================================================================

  /**
   * Extract code blocks from message content
   */
  private extractCodeBlocks(content: string): Array<{ language: string; code: string }> {
    const codeBlocks: Array<{ language: string; code: string }> = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2]?.trim() || '',
      });
    }

    return codeBlocks;
  }

  /**
   * Extract diagrams (Mermaid, ASCII art, etc.) from message content
   */
  private extractDiagrams(content: string): Array<{ type: string; diagram: string }> {
    const diagrams: Array<{ type: string; diagram: string }> = [];

    // Mermaid diagrams
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    let match;

    while ((match = mermaidRegex.exec(content)) !== null) {
      if (match[1]) {
        diagrams.push({
          type: 'mermaid',
          diagram: match[1].trim(),
        });
      }
    }

    // ASCII art diagrams (detect by box-drawing characters)
    const asciiRegex = /```(?:text|ascii)?\n([\s\S]*?[┌┐└┘│─├┤┬┴┼╔╗╚╝║═╠╣╦╩╬]+[\s\S]*?)```/g;
    while ((match = asciiRegex.exec(content)) !== null) {
      if (match[1]) {
        diagrams.push({
          type: 'ascii',
          diagram: match[1].trim(),
        });
      }
    }

    return diagrams;
  }

  /**
   * Extract file references from message content
   */
  private extractFileReferences(content: string): string[] {
    const files = new Set<string>();

    // Match file paths (e.g., packages/aice/src/file.ts)
    const filePathRegex = /(?:^|\s)([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?:\s|$|:|,)/g;
    let match;

    while ((match = filePathRegex.exec(content)) !== null) {
      const file = match[1];
      // Filter out common false positives
      if (file && !file.includes('http') && !file.includes('www.') && file.includes('/')) {
        files.add(file);
      }
    }

    return Array.from(files);
  }

  /**
   * Extract shell commands from message content
   */
  private extractCommands(content: string): string[] {
    const commands: string[] = [];

    // Match bash/shell code blocks
    const bashRegex = /```(?:bash|sh|shell)\n([\s\S]*?)```/g;
    let match;

    while ((match = bashRegex.exec(content)) !== null) {
      if (match[1]) {
        const lines = match[1].trim().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          // Skip comments and empty lines
          if (trimmed && !trimmed.startsWith('#')) {
            commands.push(trimmed);
          }
        }
      }
    }

    return commands;
  }

  /**
   * Extract structured exchanges (user request → assistant response pairs)
   */
  private extractExchanges(messages: Conversation['messages']): Array<{
    user_input: string;
    assistant_output: string;
    outcome: string;
    actions: string[];
    timestamp: string;
  }> {
    const exchanges: Array<{
      user_input: string;
      assistant_output: string;
      outcome: string;
      actions: string[];
      timestamp: string;
    }> = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg) continue;

      // Find user → assistant pairs
      if (msg.role === 'user') {
        const nextMsg = messages[i + 1];
        if (nextMsg && nextMsg.role === 'assistant') {
          exchanges.push({
            user_input: msg.content, // ✅ Full user input
            assistant_output: nextMsg.content, // ✅ Full assistant response
            outcome: this.extractOutcome(nextMsg.content),
            actions: this.extractActions(nextMsg.content),
            timestamp: msg.timestamp,
          });
          i++; // Skip the assistant message since we've processed it
        }
      }
    }

    return exchanges;
  }

  /**
   * Extract outcome from assistant response (what was accomplished)
   */
  private extractOutcome(content: string): string {
    // Look for outcome indicators
    const outcomePatterns = [
      /(?:✅|✓)\s*([^\n]+)/i,
      /(?:completed|done|finished|fixed|implemented):\s*([^\n]+)/i,
      /(?:result|outcome):\s*([^\n]+)/i,
    ];

    for (const pattern of outcomePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: first sentence
    const firstSentence = content.split(/[.!?]\s/)[0];
    return firstSentence ? firstSentence.substring(0, 200) : 'No outcome extracted';
  }

  /**
   * Extract actions from assistant response (what the assistant did)
   */
  private extractActions(content: string): string[] {
    const actions: string[] = [];

    // Look for action indicators
    const actionPatterns = [
      /(?:I|I'll|I've|Let me)\s+(created|updated|fixed|implemented|added|removed|modified|built|tested|deployed|configured)\s+([^\n]+)/gi,
      /(?:Created|Updated|Fixed|Implemented|Added|Removed|Modified|Built|Tested|Deployed|Configured)\s+([^\n]+)/gi,
    ];

    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const action = match[0].trim();
        if (action.length > 10 && action.length < 200) {
          actions.push(action);
        }
      }
    }

    return actions;
  }
}
