/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Background Service
 * Phase 5.5a: Automatic conversation capture every 5 minutes
 *
 * Reads from LLM platforms, parses conversations, writes to memory files
 */

import chalk from 'chalk';
import { AugmentLevelDBReader } from '../readers/AugmentLevelDBReader.js';
import { AugmentParser } from '../parsers/AugmentParser.js';
import { ConversationOrchestrator } from '../orchestrators/ConversationOrchestrator.js';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import type { Conversation } from '../types/conversation.js';

export interface BackgroundServiceOptions {
  cwd?: string;
  interval?: number; // milliseconds, default 5 minutes
  verbose?: boolean;
}

/**
 * Background service for automatic conversation capture
 */
export class BackgroundService {
  private cwd: string;
  private interval: number;
  private verbose: boolean;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastProcessedConversations: Set<string> = new Set();

  private augmentReader: AugmentLevelDBReader;
  private augmentParser: AugmentParser;
  private orchestrator: ConversationOrchestrator;

  constructor(options: BackgroundServiceOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.interval = options.interval || 5 * 60 * 1000; // 5 minutes default
    this.verbose = options.verbose || false;

    this.augmentReader = new AugmentLevelDBReader();
    this.augmentParser = new AugmentParser();
    this.orchestrator = new ConversationOrchestrator();
  }

  /**
   * Start the background service
   */
  async start(): Promise<Result<void>> {
    try {
      if (this.isRunning) {
        return Err(new Error('Background service is already running'));
      }

      this.isRunning = true;

      if (this.verbose) {
        console.log(chalk.cyan('🚀 Starting background service...'));
        console.log(chalk.gray(`   Interval: ${this.interval / 1000 / 60} minutes`));
        console.log(chalk.gray(`   Working directory: ${this.cwd}`));
      }

      // Run immediately on start
      await this.poll();

      // Then run every interval
      this.intervalId = setInterval(() => {
        this.poll().catch((error) => {
          console.error(chalk.red('❌ Background service error:'), error);
        });
      }, this.interval);

      return Ok(undefined);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error(`Failed to start background service: ${String(error)}`)
      );
    }
  }

  /**
   * Stop the background service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;

    if (this.verbose) {
      console.log(chalk.yellow('🛑 Background service stopped'));
    }
  }

  /**
   * Poll for new conversations
   */
  private async poll(): Promise<void> {
    try {
      if (this.verbose) {
        console.log(chalk.gray(`⏰ Polling at ${new Date().toISOString()}`));
      }

      // Read Augment conversations
      const augmentResult = await this.augmentReader.readAllConversations();

      if (!augmentResult.ok) {
        if (this.verbose) {
          console.log(chalk.yellow(`⚠️  No Augment data found`));
        }
        return;
      }

      const conversations = augmentResult.value;

      if (conversations.length === 0) {
        if (this.verbose) {
          console.log(chalk.gray('   No new conversations'));
        }
        return;
      }

      // Process new conversations
      for (const conv of conversations) {
        const convKey = `${conv.workspaceId}-${conv.conversationId}`;

        if (this.lastProcessedConversations.has(convKey)) {
          continue; // Already processed
        }

        // Parse with AugmentParser
        const parseResult = this.augmentParser.parse(conv.rawData, conv.conversationId);

        if (!parseResult.ok) {
          if (this.verbose) {
            console.log(chalk.yellow(`⚠️  Failed to parse conversation ${conv.conversationId}`));
          }
          continue;
        }

        // Create conversation object for orchestrator
        const conversation: Conversation = {
          id: conv.conversationId,
          messages: parseResult.value,
          timestamp: conv.timestamp,
          source: 'augment',
        };

        // Analyze with orchestrator
        const analysisResult = this.orchestrator.analyze(conversation, conv.rawData);

        if (analysisResult.ok) {
          // Generate memory files
          // TODO: Write to disk
          // const aicf = this.memoryWriter.generateAICF(analysisResult.value, conv.conversationId);
          // const markdown = this.memoryWriter.generateMarkdown(analysisResult.value, conv.conversationId);

          this.lastProcessedConversations.add(convKey);

          if (this.verbose) {
            console.log(chalk.green(`✅ Processed conversation ${conv.conversationId}`));
          }
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Poll error:'), error);
    }
  }

  /**
   * Check if service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
