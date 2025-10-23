/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Watcher Command
 * Phase 3: CLI Integration - October 2025
 * Phase 5.5: Multi-Claude Support - October 2025
 *
 * Background watcher for automatic checkpoint processing and multi-Claude consolidation
 */

import { readdirSync, existsSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { CheckpointProcessor } from './CheckpointProcessor.js';
import { WatcherManager } from '../utils/WatcherManager.js';
import { WatcherLogger } from '../utils/WatcherLogger.js';
import { MultiClaudeConsolidationService } from '../services/MultiClaudeConsolidationService.js';
import { WatcherConfigManager, type PlatformName } from '../core/WatcherConfigManager.js';

interface WatcherCommandOptions {
  interval?: string;
  dir?: string;
  output?: string;
  verbose?: boolean;
  augment?: boolean;
  warp?: boolean;
  claudeDesktop?: boolean;
  claudeCli?: boolean;
  copilot?: boolean;
  chatgpt?: boolean;
}

/**
 * Watch directory for checkpoint files and process them automatically
 */
export class WatcherCommand {
  private interval: number;
  private watchDir: string;
  private verbose: boolean;
  private processor: CheckpointProcessor;
  private manager: WatcherManager;
  private logger: WatcherLogger;
  private consolidationService: MultiClaudeConsolidationService;
  private configManager: WatcherConfigManager;
  private isRunning: boolean = false;
  private processedFiles: Set<string> = new Set();
  private enabledPlatforms: PlatformName[] = [];

  constructor(options: WatcherCommandOptions = {}) {
    this.interval = parseInt(options.interval || '5000', 10);
    this.watchDir = options.dir || './checkpoints';
    this.verbose = options.verbose || false;
    this.processor = new CheckpointProcessor({
      output: options.output || '.aicf',
      verbose: this.verbose,
      backup: true,
    });
    this.manager = new WatcherManager({
      pidFile: '.watcher.pid',
      logFile: '.watcher.log',
      verbose: this.verbose,
    });
    this.logger = new WatcherLogger({
      verbose: this.verbose,
      logLevel: this.verbose ? 'debug' : 'info',
    });
    this.configManager = new WatcherConfigManager();
    this.consolidationService = new MultiClaudeConsolidationService({
      verbose: this.verbose,
      enableCli: options.claudeCli ?? true,
      enableDesktop: options.claudeDesktop ?? true,
    });

    // Determine which platforms to enable
    this.enabledPlatforms = this.determinePlatforms(options);
  }

  /**
   * Determine which platforms to enable based on CLI options or config
   */
  private determinePlatforms(options: WatcherCommandOptions): PlatformName[] {
    const selectedPlatforms: PlatformName[] = [];

    // Check if any platform flags were explicitly set
    const hasExplicitFlags =
      options.augment !== undefined ||
      options.warp !== undefined ||
      options.claudeDesktop !== undefined ||
      options.claudeCli !== undefined ||
      options.copilot !== undefined ||
      options.chatgpt !== undefined;

    if (hasExplicitFlags) {
      // Use only explicitly enabled platforms
      if (options.augment) selectedPlatforms.push('augment');
      if (options.warp) selectedPlatforms.push('warp');
      if (options.claudeDesktop) selectedPlatforms.push('claude-desktop');
      if (options.claudeCli) selectedPlatforms.push('claude-cli');
      if (options.copilot) selectedPlatforms.push('copilot');
      if (options.chatgpt) selectedPlatforms.push('chatgpt');
    } else {
      // Use all enabled platforms from config (or defaults if config not found)
      const configResult = this.configManager.loadSync();
      if (configResult.ok) {
        return this.configManager.getEnabledPlatforms();
      }
      // Default: enable Augment if no config found
      selectedPlatforms.push('augment');
    }

    return selectedPlatforms;
  }

  /**
   * Start the watcher
   */
  async start(): Promise<void> {
    this.isRunning = true;

    // Initialize manager
    const initResult = this.manager.initialize();
    if (!initResult.ok) {
      console.error(chalk.red('❌ Failed to initialize watcher:'), initResult.error);
      process.exit(1);
    }

    this.logger.info('Watcher started', {
      watchDir: this.watchDir,
      interval: this.interval,
      verbose: this.verbose,
      platforms: this.enabledPlatforms,
    });

    console.log(chalk.cyan('\n🔍 Starting watcher...\n'));
    console.log(chalk.gray(`   Watch Directory: ${this.watchDir}`));
    console.log(chalk.gray(`   Check Interval: ${this.interval}ms`));
    console.log(chalk.gray(`   Verbose: ${this.verbose ? 'enabled' : 'disabled'}`));
    console.log(chalk.gray(`   PID File: ${this.manager.getPidFilePath()}`));
    console.log(chalk.gray(`   Log File: ${this.manager.getLogFilePath()}`));

    // Show enabled platforms
    if (this.enabledPlatforms.length > 0) {
      console.log(chalk.cyan('\n   🤖 Enabled Platforms:'));
      this.enabledPlatforms.forEach((platform) => {
        const platformEmoji = this.getPlatformEmoji(platform);
        console.log(chalk.gray(`      ${platformEmoji} ${platform}`));
      });
    } else {
      console.log(chalk.yellow('\n   ⚠️  No platforms enabled'));
    }

    // Show multi-Claude status only if Claude platforms are enabled
    const claudePlatformsEnabled = this.enabledPlatforms.some((p) =>
      ['claude-desktop', 'claude-cli'].includes(p)
    );
    if (claudePlatformsEnabled) {
      const availableSources = this.consolidationService.getAvailableSources();
      if (availableSources.length > 0) {
        console.log(chalk.cyan('\n   📚 Multi-Claude Support Enabled'));
        console.log(chalk.gray(`   Available Sources: ${availableSources.join(', ')}`));
      }
    }

    console.log(chalk.gray('\n   Press Ctrl+C to stop\n'));

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.stop();
    });

    // Start watching
    this.watch();
  }

  /**
   * Get emoji for platform
   */
  private getPlatformEmoji(platform: PlatformName): string {
    const emojis: Record<PlatformName, string> = {
      augment: '🔧',
      warp: '⚡',
      'claude-desktop': '🖥️',
      'claude-cli': '💻',
      copilot: '🤖',
      chatgpt: '🌐',
    };
    return emojis[platform];
  }

  /**
   * Stop the watcher
   */
  private stop(): void {
    this.isRunning = false;

    const status = this.manager.getStatus();
    this.logger.info('Watcher stopped', {
      uptime: status.uptime,
      processedCount: status.processedCount,
      errorCount: status.errorCount,
    });

    const cleanupResult = this.manager.cleanup();
    if (!cleanupResult.ok) {
      console.error(chalk.red('❌ Failed to cleanup watcher:'), cleanupResult.error);
    }

    console.log(chalk.yellow('\n\n🛑 Watcher stopped\n'));
    console.log(chalk.gray(`   Processed: ${status.processedCount}`));
    console.log(chalk.gray(`   Errors: ${status.errorCount}`));
    console.log(
      chalk.gray(`   Uptime: ${status.uptime ? Math.round(status.uptime / 1000) : 0}s\n`)
    );

    process.exit(0);
  }

  /**
   * Watch directory for checkpoint files
   */
  private watch(): void {
    const checkInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(checkInterval);
        return;
      }

      try {
        this.checkForCheckpoints();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error('Watcher error', { error: errorMsg });
        console.error(chalk.red('❌ Watcher error:'), errorMsg);
        this.manager.recordError(errorMsg);
      }
    }, this.interval);
  }

  /**
   * Check for new checkpoint files and multi-Claude messages
   */
  private checkForCheckpoints(): void {
    // Check for multi-Claude messages
    this.checkForMultiClaudeMessages();

    if (!existsSync(this.watchDir)) {
      this.logger.debug('Waiting for checkpoint directory', { dir: this.watchDir });
      if (this.verbose) {
        console.log(chalk.gray(`⏳ Waiting for checkpoint directory: ${this.watchDir}`));
      }
      return;
    }

    try {
      const files = readdirSync(this.watchDir);
      const checkpointFiles = files.filter((file) => extname(file) === '.json');

      if (checkpointFiles.length === 0) {
        this.logger.debug('No checkpoint files found');
        if (this.verbose) {
          console.log(chalk.gray('⏳ No checkpoint files found'));
        }
        return;
      }

      this.logger.info('Found checkpoint files', { count: checkpointFiles.length });

      for (const file of checkpointFiles) {
        const filePath = join(this.watchDir, file);

        // Skip if already processed
        if (this.processedFiles.has(filePath)) {
          continue;
        }

        // Mark as processed
        this.processedFiles.add(filePath);

        // Process checkpoint
        this.processCheckpoint(filePath);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Error reading checkpoint directory', { error: errorMsg });
      console.error(chalk.red('❌ Error reading checkpoint directory:'), errorMsg);
    }
  }

  /**
   * Check for multi-Claude messages and consolidate
   */
  private async checkForMultiClaudeMessages(): Promise<void> {
    if (!this.consolidationService.isAvailable()) {
      return;
    }

    try {
      const consolidationResult = await this.consolidationService.consolidate([]);

      if (!consolidationResult.ok) {
        this.logger.debug('Multi-Claude consolidation skipped', {
          reason: consolidationResult.error.message,
        });
        return;
      }

      const messages = consolidationResult.value;
      if (messages.length === 0) {
        return;
      }

      const stats = this.consolidationService.getLastStats();
      if (stats && stats.deduplicatedCount > 0) {
        this.logger.info('Multi-Claude consolidation complete', {
          totalMessages: stats.totalMessages,
          deduplicatedCount: stats.deduplicatedCount,
          sources: stats.sourceBreakdown,
        });

        if (this.verbose) {
          console.log(chalk.cyan('   📚 Multi-Claude consolidation:'));
          console.log(
            chalk.gray(
              `      Total: ${stats.totalMessages}, Deduplicated: ${stats.deduplicatedCount}`
            )
          );
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.debug('Multi-Claude check error', { error: errorMsg });
    }
  }

  /**
   * Process a checkpoint file
   */
  private async processCheckpoint(filePath: string): Promise<void> {
    const spinner = ora();

    try {
      spinner.start(`📂 Processing: ${filePath}`);
      this.logger.info('Processing checkpoint', { file: filePath });

      await this.processor.process(filePath);

      spinner.succeed(`✅ Processed: ${filePath}`);
      this.logger.success('Checkpoint processed', { file: filePath });
      this.manager.recordSuccess();

      // Delete processed file
      try {
        unlinkSync(filePath);
        this.logger.debug('Deleted checkpoint file', { file: filePath });
        if (this.verbose) {
          console.log(chalk.gray(`   Deleted checkpoint file: ${filePath}`));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.warning('Could not delete checkpoint file', {
          file: filePath,
          error: errorMsg,
        });
        console.warn(chalk.yellow(`   ⚠️  Could not delete checkpoint file: ${filePath}`));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      spinner.fail(`❌ Failed to process: ${filePath}`);
      this.logger.error('Failed to process checkpoint', { file: filePath, error: errorMsg });
      console.error(chalk.red('   Error:'), errorMsg);
      this.manager.recordError(errorMsg);

      // Remove from processed set so it can be retried
      this.processedFiles.delete(filePath);
    }
  }
}
