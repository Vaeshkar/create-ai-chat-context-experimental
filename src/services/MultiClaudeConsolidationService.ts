/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Multi-Claude Consolidation Service
 * Phase 5.5: Multi-Claude Support - October 2025
 *
 * Service to consolidate messages from all three Claude instances
 */

import { ClaudeCliWatcher } from '../watchers/ClaudeCliWatcher.js';
import { ClaudeDesktopWatcher } from '../watchers/ClaudeDesktopWatcher.js';
import { MultiClaudeOrchestrator } from '../orchestrators/MultiClaudeOrchestrator.js';
import type { Message } from '../types/conversation.js';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface ConsolidationStats {
  totalMessages: number;
  deduplicatedCount: number;
  deduplicationRate: string;
  sourceBreakdown: {
    web: number;
    desktop: number;
    cli: number;
  };
  conflictCount: number;
  timestamp: string;
}

export interface ConsolidationServiceOptions {
  verbose?: boolean;
  enableCli?: boolean;
  enableDesktop?: boolean;
  cliProjectPath?: string;
  pollingInterval?: number; // milliseconds, default 300000 (5 minutes)
}

/**
 * Service to consolidate messages from all Claude instances
 */
export class MultiClaudeConsolidationService {
  private cliWatcher: ClaudeCliWatcher;
  private desktopWatcher: ClaudeDesktopWatcher;
  private orchestrator: MultiClaudeOrchestrator;
  private options: ConsolidationServiceOptions;
  private lastStats: ConsolidationStats | null = null;
  private lastCheckTime: number = 0;
  private pollingInterval: number;

  constructor(options: ConsolidationServiceOptions = {}) {
    this.cliWatcher = new ClaudeCliWatcher();
    this.desktopWatcher = new ClaudeDesktopWatcher();
    this.orchestrator = new MultiClaudeOrchestrator();
    this.options = {
      verbose: false,
      enableCli: true,
      enableDesktop: true,
      pollingInterval: 300000, // 5 minutes default
      ...options,
    };
    this.pollingInterval = this.options.pollingInterval || 300000;
  }

  /**
   * Check if any Claude instance is available
   */
  isAvailable(): boolean {
    const cliAvailable = (this.options.enableCli ?? false) && this.cliWatcher.isAvailable();
    const desktopAvailable =
      (this.options.enableDesktop ?? false) && this.desktopWatcher.isAvailable();
    return cliAvailable || desktopAvailable;
  }

  /**
   * Get available sources
   */
  getAvailableSources(): string[] {
    const sources: string[] = [];
    if (this.options.enableCli && this.cliWatcher.isAvailable()) {
      sources.push('claude-cli');
    }
    if (this.options.enableDesktop && this.desktopWatcher.isAvailable()) {
      sources.push('claude-desktop');
    }
    return sources;
  }

  /**
   * Consolidate messages from all available sources
   * Respects polling interval to avoid excessive disk I/O
   */
  async consolidate(webMessages: Message[] = []): Promise<Result<Message[]>> {
    try {
      // Check if enough time has passed since last check
      const now = Date.now();
      if (this.lastCheckTime > 0 && now - this.lastCheckTime < this.pollingInterval) {
        // Not enough time has passed, return empty result
        return Ok([]);
      }

      // Update last check time
      this.lastCheckTime = now;

      let cliMessages: Message[] = [];
      let desktopMessages: Message[] = [];

      // Collect from CLI
      if (this.options.enableCli && this.cliWatcher.isAvailable()) {
        const projectPath = this.options.cliProjectPath || '.';
        const cliResult = this.cliWatcher.getProjectSessions(projectPath);
        if (cliResult.ok) {
          cliMessages = cliResult.value;
        } else if (this.options.verbose) {
          console.warn('Failed to get CLI messages:', cliResult.error);
        }
      }

      // Collect from Desktop
      if (this.options.enableDesktop && this.desktopWatcher.isAvailable()) {
        const desktopResult = this.desktopWatcher.getAllMessages();
        if (desktopResult.ok) {
          desktopMessages = desktopResult.value;
        } else if (this.options.verbose) {
          console.warn('Failed to get Desktop messages:', desktopResult.error);
        }
      }

      // Consolidate all sources
      const consolidationResult = this.orchestrator.consolidate(
        webMessages,
        desktopMessages,
        cliMessages
      );

      if (!consolidationResult.ok) {
        return Err(consolidationResult.error);
      }

      // Calculate and store statistics
      this.orchestrator.getStatistics(consolidationResult.value);
      this.lastStats = {
        totalMessages: consolidationResult.value.messages.length,
        deduplicatedCount: consolidationResult.value.deduplicatedCount,
        deduplicationRate: `${((consolidationResult.value.deduplicatedCount / (consolidationResult.value.messages.length + consolidationResult.value.deduplicatedCount)) * 100).toFixed(2)}%`,
        sourceBreakdown: consolidationResult.value.sourceBreakdown,
        conflictCount: consolidationResult.value.conflictCount,
        timestamp: new Date().toISOString(),
      };

      return Ok(consolidationResult.value.messages);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get last consolidation statistics
   */
  getLastStats(): ConsolidationStats | null {
    return this.lastStats;
  }

  /**
   * Get messages by source
   */
  getMessagesBySource(
    messages: Message[],
    source: 'claude-web' | 'claude-desktop' | 'claude-cli'
  ): Message[] {
    return messages.filter((msg) => {
      const metadata = msg.metadata as Record<string, unknown> | undefined;
      return (metadata as Record<string, unknown> | undefined)?.['source'] === source;
    });
  }

  /**
   * Get messages by conversation
   */
  getMessagesByConversation(messages: Message[], conversationId: string): Message[] {
    return messages.filter((msg) => msg.conversationId === conversationId);
  }

  /**
   * Get unique conversations
   */
  getConversations(messages: Message[]): string[] {
    const conversations = new Set(messages.map((msg) => msg.conversationId));
    return Array.from(conversations);
  }

  /**
   * Get consolidation summary
   */
  getSummary(): string {
    if (!this.lastStats) {
      return 'No consolidation data available';
    }

    const { totalMessages, deduplicatedCount, deduplicationRate, sourceBreakdown, conflictCount } =
      this.lastStats;

    return `
Multi-Claude Consolidation Summary
═══════════════════════════════════
Total Messages: ${totalMessages}
Deduplicated: ${deduplicatedCount} (${deduplicationRate})
Conflicts Resolved: ${conflictCount}

Source Breakdown:
  • Claude Web: ${sourceBreakdown.web}
  • Claude Desktop: ${sourceBreakdown.desktop}
  • Claude CLI: ${sourceBreakdown.cli}

Available Sources: ${this.getAvailableSources().join(', ') || 'None'}
Last Updated: ${this.lastStats.timestamp}
    `.trim();
  }
}
