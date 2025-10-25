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
import { AugmentCacheWriter } from '../writers/AugmentCacheWriter.js';
import { ClaudeCacheWriter } from '../writers/ClaudeCacheWriter.js';
import { CacheConsolidationAgent } from '../agents/CacheConsolidationAgent.js';
import { MemoryDropoffAgent } from '../agents/MemoryDropoffAgent.js';
import { SessionConsolidationAgent } from '../agents/SessionConsolidationAgent.js';

interface WatcherCommandOptions {
  interval?: string;
  dir?: string;
  output?: string;
  verbose?: boolean;
  daemon?: boolean;
  foreground?: boolean;
  augment?: boolean;
  warp?: boolean;
  claudeDesktop?: boolean;
  claudeCli?: boolean;
  copilot?: boolean;
  chatgpt?: boolean;
  cwd?: string;
}

/**
 * Watch directory for checkpoint files and process them automatically
 */
export class WatcherCommand {
  private interval: number;
  private watchDir: string;
  private verbose: boolean;
  private _daemon: boolean;
  private _foreground: boolean;
  private processor: CheckpointProcessor;
  private manager: WatcherManager;
  private logger: WatcherLogger;
  private consolidationService: MultiClaudeConsolidationService;
  private configManager: WatcherConfigManager;
  private augmentCacheWriter: AugmentCacheWriter;
  private claudeCacheWriter: ClaudeCacheWriter;
  private cacheConsolidationAgent: CacheConsolidationAgent;
  private sessionConsolidationAgent: SessionConsolidationAgent;
  private memoryDropoffAgent: MemoryDropoffAgent;
  private isRunning: boolean = false;
  private processedFiles: Set<string> = new Set();
  private enabledPlatforms: PlatformName[] = [];
  private cwd: string;

  constructor(options: WatcherCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.interval = parseInt(options.interval || '300000', 10);
    this.watchDir = options.dir || join(this.cwd, './checkpoints');
    this.verbose = options.verbose || false;
    this._daemon = options.daemon || false;
    this._foreground = options.foreground !== false; // Default to foreground
    this.processor = new CheckpointProcessor({
      output: options.output || join(this.cwd, '.aicf'),
      verbose: this.verbose,
      backup: true,
    });
    this.manager = new WatcherManager({
      pidFile: join(this.cwd, '.watcher.pid'),
      logFile: join(this.cwd, '.watcher.log'),
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
    this.augmentCacheWriter = new AugmentCacheWriter(this.cwd);
    this.claudeCacheWriter = new ClaudeCacheWriter(this.cwd);
    this.cacheConsolidationAgent = new CacheConsolidationAgent(this.cwd);
    this.sessionConsolidationAgent = new SessionConsolidationAgent(this.cwd);
    this.memoryDropoffAgent = new MemoryDropoffAgent(this.cwd);

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
    console.log(
      chalk.gray(`   Mode: ${this._daemon ? 'daemon' : this._foreground ? 'foreground' : 'auto'}`)
    );
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
    // Phase 6: Cache-First Pipeline
    // 1. Write LLM data to cache
    this.writeLLMDataToCache();

    // 2. Consolidate cache chunks into individual conversation files
    this.consolidateCacheChunks();

    // 3. Consolidate individual files into session files (Phase 6.5)
    this.consolidateSessionFiles();

    // 4. Run memory dropoff (Phase 7) - compress sessions by age
    this.runMemoryDropoff();

    // 4. Process manual checkpoints (legacy support)
    this.processManualCheckpoints();
  }

  /**
   * Write LLM data to cache (Augment and Claude)
   */
  private writeLLMDataToCache(): void {
    // Write Augment data to cache
    if (this.enabledPlatforms.includes('augment')) {
      this.augmentCacheWriter.write().then((result) => {
        if (result.ok) {
          this.logger.debug('Augment cache written', {
            newChunks: result.value.newChunksWritten,
            skipped: result.value.chunksSkipped,
          });
        } else {
          this.logger.error('Failed to write Augment cache', { error: result.error.message });
        }
      });
    }

    // Write Claude data to cache
    if (
      this.enabledPlatforms.includes('claude-cli') ||
      this.enabledPlatforms.includes('claude-desktop')
    ) {
      this.claudeCacheWriter.write().then((result) => {
        if (result.ok) {
          this.logger.debug('Claude cache written', {
            newChunks: result.value.newChunksWritten,
            skipped: result.value.chunksSkipped,
          });
        } else {
          this.logger.error('Failed to write Claude cache', { error: result.error.message });
        }
      });
    }
  }

  /**
   * Consolidate cache chunks into .aicf and .ai files
   */
  private consolidateCacheChunks(): void {
    this.cacheConsolidationAgent.consolidate().then((result) => {
      if (result.ok) {
        this.logger.info('Cache consolidation complete', {
          processed: result.value.totalChunksProcessed,
          consolidated: result.value.chunksConsolidated,
          duplicated: result.value.chunksDuplicated,
          filesWritten: result.value.filesWritten,
        });
        if (this.verbose) {
          console.log(chalk.green(`✅ Consolidated ${result.value.chunksConsolidated} chunks`));
        }
      } else {
        this.logger.error('Cache consolidation failed', { error: result.error.message });
      }
    });
  }

  /**
   * Consolidate individual conversation files into session files (Phase 6.5)
   * Groups conversations by date and creates clean, AI-readable session files
   */
  private consolidateSessionFiles(): void {
    this.sessionConsolidationAgent.consolidate().then((result) => {
      if (result.ok) {
        const stats = result.value;
        this.logger.info('Session consolidation complete', {
          totalFiles: stats.totalFiles,
          totalConversations: stats.totalConversations,
          sessionsCreated: stats.sessionsCreated,
          uniqueConversations: stats.uniqueConversations,
          duplicatesRemoved: stats.duplicatesRemoved,
          storageReduction: stats.storageReduction,
          tokenReduction: stats.tokenReduction,
        });
        if (this.verbose && stats.sessionsCreated > 0) {
          console.log(
            chalk.cyan(
              `📋 Consolidated ${stats.totalConversations} conversations into ${stats.sessionsCreated} sessions`
            )
          );
          console.log(
            chalk.gray(`   Storage: ${stats.storageReduction}, Tokens: ${stats.tokenReduction}`)
          );
        }
      } else {
        this.logger.error('Session consolidation failed', { error: result.error.message });
      }
    });
  }

  /**
   * Run memory dropoff agent (Phase 7)
   * Move and compress conversations by age
   */
  private runMemoryDropoff(): void {
    this.memoryDropoffAgent.dropoff().then((result) => {
      if (result.ok) {
        const stats = result.value;
        this.logger.info('Memory dropoff complete', {
          sessions: stats.sessionFiles,
          medium: stats.mediumFiles,
          old: stats.oldFiles,
          archive: stats.archiveFiles,
          movedToMedium: stats.movedToMedium,
          movedToOld: stats.movedToOld,
          movedToArchive: stats.movedToArchive,
          compressed: stats.compressed,
        });
        if (this.verbose && stats.compressed > 0) {
          console.log(chalk.cyan(`🗜️  Compressed ${stats.compressed} conversations`));
        }
      } else {
        this.logger.error('Memory dropoff failed', { error: result.error.message });
      }
    });
  }

  /**
   * Process manual checkpoint files (legacy support)
   */
  private processManualCheckpoints(): void {
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
