/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Multi-Claude Orchestrator
 * Consolidates messages from all three Claude instances
 * Phase 5.5c: October 2025
 *
 * Merges messages from:
 * - Claude Web (via JSON export)
 * - Claude Desktop (via SQLite)
 * - Claude CLI (via JSONL)
 *
 * Features:
 * - Content hash deduplication
 * - Source tracking
 * - Conflict resolution
 * - Metadata preservation
 */

import { createHash } from 'crypto';
import type { Message } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Claude source types
 */
export type ClaudeSource = 'claude-web' | 'claude-desktop' | 'claude-cli';

/**
 * Message with source tracking
 */
export interface SourcedMessage extends Message {
  metadata: Message['metadata'] & {
    source: ClaudeSource;
    sourceTimestamp: string;
    contentHash: string;
  };
}

/**
 * Consolidation result
 */
export interface ConsolidationResult {
  messages: SourcedMessage[];
  deduplicatedCount: number;
  sourceBreakdown: {
    web: number;
    desktop: number;
    cli: number;
  };
  conflictCount: number;
}

/**
 * Consolidate messages from all three Claude instances
 */
export class MultiClaudeOrchestrator {
  /**
   * Consolidate messages from all sources
   *
   * @param webMessages - Messages from Claude Web export
   * @param desktopMessages - Messages from Claude Desktop SQLite
   * @param cliMessages - Messages from Claude CLI JSONL
   * @returns Result with ConsolidationResult or error
   */
  consolidate(
    webMessages: Message[] = [],
    desktopMessages: Message[] = [],
    cliMessages: Message[] = []
  ): Result<ConsolidationResult> {
    try {
      // Add source tracking to all messages
      const sourcedWeb = this.addSource(webMessages, 'claude-web');
      const sourcedDesktop = this.addSource(desktopMessages, 'claude-desktop');
      const sourcedCli = this.addSource(cliMessages, 'claude-cli');

      // Combine all messages
      const allMessages = [...sourcedWeb, ...sourcedDesktop, ...sourcedCli];

      // Deduplicate by content hash
      const deduplicationResult = this.deduplicate(allMessages);

      // Track source breakdown
      const sourceBreakdown = {
        web: sourcedWeb.length,
        desktop: sourcedDesktop.length,
        cli: sourcedCli.length,
      };

      // Calculate deduplication stats
      const deduplicatedCount = allMessages.length - deduplicationResult.messages.length;

      return Ok({
        messages: deduplicationResult.messages,
        deduplicatedCount,
        sourceBreakdown,
        conflictCount: deduplicationResult.conflictCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new Error(`Failed to consolidate Claude messages: ${message}`));
    }
  }

  /**
   * Add source tracking to messages
   *
   * @param messages - Messages to track
   * @param source - Source identifier
   * @returns Messages with source metadata
   */
  private addSource(messages: Message[], source: ClaudeSource): SourcedMessage[] {
    return messages.map((msg) => {
      const contentHash = this.hashContent(msg.content);

      return {
        ...msg,
        metadata: {
          ...msg.metadata,
          source,
          sourceTimestamp: msg.timestamp,
          contentHash,
          extractedFrom: msg.metadata?.extractedFrom || 'unknown',
          rawLength: msg.metadata?.rawLength || msg.content.length,
          messageType:
            msg.metadata?.messageType || (msg.role === 'user' ? 'user_request' : 'ai_response'),
          platform: msg.metadata?.platform || source,
        },
      };
    });
  }

  /**
   * Deduplicate messages by content hash
   *
   * @param messages - Messages to deduplicate
   * @returns Deduplicated messages with conflict tracking
   */
  private deduplicate(messages: SourcedMessage[]): {
    messages: SourcedMessage[];
    conflictCount: number;
  } {
    const seen = new Map<string, SourcedMessage>();
    let conflictCount = 0;

    for (const msg of messages) {
      const hash = msg.metadata.contentHash;

      if (seen.has(hash)) {
        // Duplicate found
        conflictCount++;

        // Keep the one with the earliest timestamp
        const existing = seen.get(hash)!;
        if (msg.timestamp < existing.timestamp) {
          seen.set(hash, msg);
        }
      } else {
        // New message
        seen.set(hash, msg);
      }
    }

    return {
      messages: Array.from(seen.values()),
      conflictCount,
    };
  }

  /**
   * Generate content hash for deduplication
   *
   * @param content - Message content
   * @returns SHA256 hash of content
   */
  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Merge conversations by project context
   * Groups messages by conversation ID
   *
   * @param messages - Messages to group
   * @returns Map of conversation ID to messages
   */
  groupByConversation(messages: SourcedMessage[]): Map<string, SourcedMessage[]> {
    const grouped = new Map<string, SourcedMessage[]>();

    for (const msg of messages) {
      const convId = msg.conversationId;

      if (!grouped.has(convId)) {
        grouped.set(convId, []);
      }

      grouped.get(convId)!.push(msg);
    }

    return grouped;
  }

  /**
   * Get messages from specific source
   *
   * @param messages - All messages
   * @param source - Source to filter by
   * @returns Messages from that source
   */
  filterBySource(messages: SourcedMessage[], source: ClaudeSource): SourcedMessage[] {
    return messages.filter((msg) => msg.metadata.source === source);
  }

  /**
   * Get messages from specific conversation
   *
   * @param messages - All messages
   * @param conversationId - Conversation ID to filter by
   * @returns Messages from that conversation
   */
  filterByConversation(messages: SourcedMessage[], conversationId: string): SourcedMessage[] {
    return messages.filter((msg) => msg.conversationId === conversationId);
  }

  /**
   * Sort messages by timestamp
   *
   * @param messages - Messages to sort
   * @returns Sorted messages (oldest first)
   */
  sortByTimestamp(messages: SourcedMessage[]): SourcedMessage[] {
    return [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Get statistics about consolidated messages
   *
   * @param result - Consolidation result
   * @returns Statistics object
   */
  getStatistics(result: ConsolidationResult): {
    totalMessages: number;
    deduplicatedCount: number;
    deduplicationRate: string;
    sourceBreakdown: Record<string, number>;
    conflictCount: number;
  } {
    const total = result.messages.length + result.deduplicatedCount;
    const rate = total > 0 ? ((result.deduplicatedCount / total) * 100).toFixed(2) : '0.00';

    return {
      totalMessages: result.messages.length,
      deduplicatedCount: result.deduplicatedCount,
      deduplicationRate: `${rate}%`,
      sourceBreakdown: result.sourceBreakdown,
      conflictCount: result.conflictCount,
    };
  }
}
