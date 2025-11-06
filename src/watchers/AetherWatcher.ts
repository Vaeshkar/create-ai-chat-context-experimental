/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * AETHER Unified Watcher
 * Orchestrates all 4 sub-watchers in a single process:
 * 1. AICE Watcher (conversation capture from LevelDB)
 * 2. JSONToAICF Watcher (JSON → AICF conversion)
 * 3. AICF File Watcher (indexing & extraction)
 * 4. Principle Watcher (validation & improvement)
 */

import chalk from 'chalk';
import { ConversationWatcher } from 'aicf-core';
import { PrincipleWatcher } from 'lill-meta';
import { join } from 'path';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * AETHER Watcher configuration
 */
export interface AetherWatcherConfig {
  cwd?: string;
  verbose?: boolean;
  enablePrincipleWatcher?: boolean; // Can be disabled if no API key
  pollInterval?: number; // Polling interval for all watchers (ms)
}

/**
 * Watcher status
 */
export interface WatcherStatus {
  isRunning: boolean;
  watchers: {
    conversation: boolean;
    principle: boolean;
  };
  uptime: number; // seconds
  errors: string[];
}

/**
 * AETHER Unified Watcher
 * Single process that manages all 4 sub-watchers
 */
export class AetherWatcher {
  private readonly cwd: string;
  private readonly verbose: boolean;
  private readonly enablePrincipleWatcher: boolean;
  private readonly pollInterval: number;

  // Sub-watchers
  private conversationWatcher: ConversationWatcher;
  private principleWatcher: PrincipleWatcher | null = null;

  // State
  private isRunning: boolean = false;
  private startTime: number = 0;
  private errors: string[] = [];

  constructor(config: AetherWatcherConfig = {}) {
    this.cwd = config.cwd || process.cwd();
    this.verbose = config.verbose || false;
    this.enablePrincipleWatcher = config.enablePrincipleWatcher ?? true;
    this.pollInterval = config.pollInterval || 5000; // 5 seconds default

    // Initialize sub-watchers
    this.conversationWatcher = new ConversationWatcher(this.cwd, {
      rawDir: join(this.cwd, '.aicf', 'raw'),
      pollInterval: this.pollInterval,
      verbose: this.verbose,
    });

    // Only initialize PrincipleWatcher and EnhancedConversationExtractor if enabled and API key is available
    if (this.enablePrincipleWatcher) {
      const apiKey = process.env['ANTHROPIC_API_KEY'];
      if (apiKey) {
        this.principleWatcher = new PrincipleWatcher(this.cwd, {
          rawDir: join(this.cwd, '.lill', 'raw'),
          pollInterval: 60000, // 1 minute for principle validation
          verbose: this.verbose,
        });
      } else if (this.verbose) {
        console.log(chalk.yellow('⚠️  PrincipleWatcher disabled: ANTHROPIC_API_KEY not found'));
      }
    }
  }

  /**
   * Start all watchers
   */
  async start(): Promise<Result<void>> {
    if (this.isRunning) {
      return Err(new Error('AETHER watcher is already running'));
    }

    try {
      this.startTime = Date.now();
      this.isRunning = true;
      this.errors = [];

      if (this.verbose) {
        console.log(chalk.cyan('\n🌌 Starting AETHER watcher...\n'));
      }

      // Start all watchers in parallel
      const results = await Promise.allSettled([
        this.startConversationWatcher(),
        this.startPrincipleWatcher(),
      ]);

      // Check for errors
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        for (const failure of failures) {
          if (failure.status === 'rejected') {
            this.errors.push(failure.reason.message);
            console.error(chalk.red('❌ Watcher failed:'), failure.reason.message);
          }
        }
      }

      // Show status
      if (this.verbose) {
        this.showStatus();
      }

      return Ok(undefined);
    } catch (error) {
      this.isRunning = false;
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Stop all watchers
   */
  async stop(): Promise<Result<void>> {
    if (!this.isRunning) {
      return Ok(undefined);
    }

    try {
      if (this.verbose) {
        console.log(chalk.cyan('\n🌌 Stopping AETHER watcher...\n'));
      }

      this.isRunning = false;

      // Stop all watchers in parallel
      const results = await Promise.allSettled([
        this.stopConversationWatcher(),
        this.stopPrincipleWatcher(),
      ]);

      // Check for errors
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        for (const failure of failures) {
          if (failure.status === 'rejected') {
            console.error(chalk.red('❌ Failed to stop watcher:'), failure.reason.message);
          }
        }
      }

      if (this.verbose) {
        console.log(chalk.green('\n✅ AETHER watcher stopped\n'));
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get watcher status
   */
  getStatus(): WatcherStatus {
    const uptime = this.isRunning ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

    return {
      isRunning: this.isRunning,
      watchers: {
        conversation: this.isRunning,
        principle: this.principleWatcher !== null && this.isRunning,
      },
      uptime,
      errors: [...this.errors],
    };
  }

  /**
   * Show status in console
   */
  private showStatus(): void {
    const status = this.getStatus();

    console.log(chalk.cyan('📊 AETHER Watcher Status:\n'));
    console.log(
      `  ${status.watchers.conversation ? chalk.green('✓') : chalk.red('✗')} Conversation Watcher (JSON → QuadIndex)`
    );
    console.log(
      `  ${status.watchers.principle ? chalk.green('✓') : chalk.yellow('○')} Principle Watcher (validation & improvement)${!status.watchers.principle ? chalk.dim(' - disabled') : ''}`
    );
    console.log();
  }

  /**
   * Start Conversation watcher
   */
  private async startConversationWatcher(): Promise<void> {
    const result = await this.conversationWatcher.start();
    if (!result.ok) {
      throw result.error;
    }
    if (this.verbose) {
      console.log(chalk.green('✅ Conversation Watcher started'));
    }
  }

  /**
   * Stop Conversation watcher
   */
  private async stopConversationWatcher(): Promise<void> {
    const result = await this.conversationWatcher.stop();
    if (!result.ok) {
      throw result.error;
    }
    if (this.verbose) {
      console.log(chalk.dim('  ✓ Conversation Watcher stopped'));
    }
  }

  /**
   * Start Principle watcher
   */
  private async startPrincipleWatcher(): Promise<void> {
    if (!this.principleWatcher) {
      if (this.verbose) {
        console.log(chalk.yellow('○ Principle Watcher disabled (no API key)'));
      }
      return;
    }

    await this.principleWatcher.start();
    if (this.verbose) {
      console.log(chalk.green('✅ Principle Watcher started'));
    }
  }

  /**
   * Stop Principle watcher
   */
  private async stopPrincipleWatcher(): Promise<void> {
    if (!this.principleWatcher) {
      return;
    }

    await this.principleWatcher.stop();
    if (this.verbose) {
      console.log(chalk.dim('  ✓ Principle Watcher stopped'));
    }
  }
}
