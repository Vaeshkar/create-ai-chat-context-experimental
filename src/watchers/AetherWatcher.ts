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
import { JSONToAICFWatcher } from 'aicf-core';
import { AICFFileWatcher } from 'lill-core';
import { PrincipleWatcher, EnhancedConversationExtractor } from 'lill-meta';
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
    jsonToAicf: boolean;
    aicfFile: boolean;
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
  private jsonToAICFWatcher: JSONToAICFWatcher;
  private aicfFileWatcher: AICFFileWatcher;
  private principleWatcher: PrincipleWatcher | null = null;
  private enhancedConversationExtractor: EnhancedConversationExtractor | null = null;

  // State
  private isRunning: boolean = false;
  private startTime: number = 0;
  private errors: string[] = [];
  private isExtracting: boolean = false; // Prevent concurrent extractions

  constructor(config: AetherWatcherConfig = {}) {
    this.cwd = config.cwd || process.cwd();
    this.verbose = config.verbose || false;
    this.enablePrincipleWatcher = config.enablePrincipleWatcher ?? true;
    this.pollInterval = config.pollInterval || 5000; // 5 seconds default

    // Initialize sub-watchers
    this.jsonToAICFWatcher = new JSONToAICFWatcher(this.cwd, {
      rawDir: join(this.cwd, '.aicf', 'raw'),
      aicfDir: join(this.cwd, '.aicf'),
      pollInterval: this.pollInterval,
      verbose: this.verbose,
    });

    this.aicfFileWatcher = new AICFFileWatcher(this.cwd, {
      aicfDir: join(this.cwd, '.aicf'),
      stateDir: join(this.cwd, '.lill', 'state'),
      pollInterval: this.pollInterval,
      verbose: this.verbose,
      enableStorage: true,
      principleExtractionThreshold: 500, // Trigger extraction after 500 lines read
      onNewEntry: async (file: string, lineNumber: number, content: string) => {
        if (this.verbose) {
          const preview = content.substring(0, 80).replace(/\n/g, ' ');
          console.log(chalk.dim(`[AICF] ${file}:${lineNumber} - ${preview}`));
        }
      },
      onThresholdReached: async () => {
        // Trigger principle extraction when threshold reached
        await this.triggerPrincipleExtraction();
      },
    });

    // Only initialize PrincipleWatcher and EnhancedConversationExtractor if enabled and API key is available
    if (this.enablePrincipleWatcher) {
      const apiKey = process.env['ANTHROPIC_API_KEY'];
      if (apiKey) {
        this.principleWatcher = new PrincipleWatcher(this.cwd, {
          aicfDir: join(this.cwd, '.aicf'),
          stateDir: join(this.cwd, '.lill', 'state'),
          pollInterval: 60000, // 1 minute for principle validation
          verbose: this.verbose,
          enableLearning: true,
          apiKey,
        });

        this.enhancedConversationExtractor = new EnhancedConversationExtractor(this.cwd, {
          aicfDir: join(this.cwd, '.aicf'),
          apiKey,
          batchSize: 5, // Analyze last 5 conversations (optimal for learning)
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
        this.startJSONToAICFWatcher(),
        this.startAICFFileWatcher(),
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
        this.stopJSONToAICFWatcher(),
        this.stopAICFFileWatcher(),
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
        jsonToAicf: this.isRunning,
        aicfFile: this.isRunning,
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
      `  ${status.watchers.jsonToAicf ? chalk.green('✓') : chalk.red('✗')} JSONToAICF Watcher (format conversion)`
    );
    console.log(
      `  ${status.watchers.aicfFile ? chalk.green('✓') : chalk.red('✗')} AICF File Watcher (indexing & extraction)`
    );
    console.log(
      `  ${status.watchers.principle ? chalk.green('✓') : chalk.yellow('○')} Principle Watcher (validation & improvement)${!status.watchers.principle ? chalk.dim(' - disabled') : ''}`
    );
    console.log();
  }

  /**
   * Start JSONToAICF watcher
   */
  private async startJSONToAICFWatcher(): Promise<void> {
    const result = await this.jsonToAICFWatcher.start();
    if (!result.ok) {
      throw result.error;
    }
    if (this.verbose) {
      console.log(chalk.green('✅ JSONToAICF Watcher started'));
    }
  }

  /**
   * Stop JSONToAICF watcher
   */
  private async stopJSONToAICFWatcher(): Promise<void> {
    const result = await this.jsonToAICFWatcher.stop();
    if (!result.ok) {
      throw result.error;
    }
    if (this.verbose) {
      console.log(chalk.dim('  ✓ JSONToAICF Watcher stopped'));
    }
  }

  /**
   * Start AICF File watcher
   */
  private async startAICFFileWatcher(): Promise<void> {
    await this.aicfFileWatcher.start();
    if (this.verbose) {
      console.log(chalk.green('✅ AICF File Watcher started'));
    }
  }

  /**
   * Stop AICF File watcher
   */
  private async stopAICFFileWatcher(): Promise<void> {
    await this.aicfFileWatcher.stop();
    if (this.verbose) {
      console.log(chalk.dim('  ✓ AICF File Watcher stopped'));
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

  /**
   * Trigger enhanced memory extraction from conversations
   * Called when AICFFileWatcher reaches threshold (500 lines read)
   * Phase 7: Extracts all 6 memory types (principles, decisions, profile, rejected, relationships, hypotheticals)
   */
  private async triggerPrincipleExtraction(): Promise<void> {
    // Prevent concurrent extractions
    if (this.isExtracting) {
      if (this.verbose) {
        console.log(chalk.yellow('[AETHER] Memory extraction already in progress, skipping...'));
      }
      return;
    }

    if (!this.enhancedConversationExtractor) {
      if (this.verbose) {
        console.log(chalk.yellow('[AETHER] EnhancedConversationExtractor not initialized'));
      }
      return;
    }

    try {
      this.isExtracting = true;

      if (this.verbose) {
        console.log(chalk.cyan('\n🧠 [AETHER] Triggering enhanced memory extraction...'));
      }

      const result = await this.enhancedConversationExtractor.extractMemory();

      if (result.success) {
        console.log(chalk.green(`✅ [AETHER] Enhanced memory extraction complete:`));
        console.log(chalk.gray(`   Principles: ${result.principlesExtracted}`));
        console.log(chalk.gray(`   Decisions: ${result.decisionsExtracted}`));
        console.log(chalk.gray(`   Preferences: ${result.preferencesExtracted}`));
        console.log(chalk.gray(`   Patterns: ${result.patternsExtracted}`));
        console.log(chalk.gray(`   Triggers: ${result.triggersExtracted}`));
        console.log(chalk.gray(`   Communication Styles: ${result.communicationStylesExtracted}`));
        console.log(chalk.gray(`   Rejected: ${result.rejectedExtracted}`));
        console.log(chalk.gray(`   Relationships: ${result.relationshipsExtracted}`));
        console.log(chalk.gray(`   Hypotheticals: ${result.hypotheticalsExtracted}`));
        console.log(chalk.gray(`   Conversations Analyzed: ${result.conversationsAnalyzed}`));

        // Reset the counter in AICFFileWatcher
        this.aicfFileWatcher.resetExtractionCounter();
      } else {
        console.error(chalk.red(`❌ [AETHER] Memory extraction failed: ${result.error}`));
      }
    } catch (error) {
      console.error(chalk.red('[AETHER] Memory extraction error:'), error);
    } finally {
      this.isExtracting = false;
    }
  }
}
