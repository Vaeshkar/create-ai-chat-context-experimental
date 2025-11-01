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

import { join } from 'path';
import chalk from 'chalk';
import { WatcherManager } from '../utils/WatcherManager.js';
import { WatcherLogger } from '../utils/WatcherLogger.js';
import { MultiClaudeConsolidationService } from '../services/MultiClaudeConsolidationService.js';
import { WatcherConfigManager, type PlatformName } from '../core/WatcherConfigManager.js';
import { AugmentCacheWriter } from '../writers/AugmentCacheWriter.js';
import { ClaudeCacheWriter } from '../writers/ClaudeCacheWriter.js';
import { CacheConsolidationAgent } from '../agents/CacheConsolidationAgent.js';
import { MemoryDropoffAgent } from '../agents/MemoryDropoffAgent.js';
import { SessionConsolidationAgent } from '../agents/SessionConsolidationAgent.js';
import { DaemonManager } from '../utils/DaemonManager.js';
import { JSONToAICFWatcher } from 'aicf-core';
import { AICFFileWatcher } from 'lill-core';
import { PrincipleWatcher } from 'lill-meta';

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
  private manager: WatcherManager;
  private logger: WatcherLogger;
  private consolidationService: MultiClaudeConsolidationService;
  private configManager: WatcherConfigManager;
  private augmentCacheWriter: AugmentCacheWriter;
  private claudeCacheWriter: ClaudeCacheWriter;
  private cacheConsolidationAgent: CacheConsolidationAgent;
  private sessionConsolidationAgent: SessionConsolidationAgent;
  private memoryDropoffAgent: MemoryDropoffAgent;
  private jsonToAICFWatcher: JSONToAICFWatcher;
  private aicfFileWatcher: AICFFileWatcher;
  private principleWatcher: PrincipleWatcher;
  private isRunning: boolean = false;
  private enabledPlatforms: PlatformName[] = [];
  private cwd: string;

  constructor(options: WatcherCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.interval = parseInt(options.interval || '300000', 10);
    this.watchDir = options.dir || join(this.cwd, './checkpoints');
    this.verbose = options.verbose || false;
    this._daemon = options.daemon || false;
    this._foreground = options.foreground !== false; // Default to foreground
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
    this.jsonToAICFWatcher = new JSONToAICFWatcher(this.cwd, {
      verbose: this.verbose,
    });
    this.aicfFileWatcher = new AICFFileWatcher(this.cwd, {
      verbose: this.verbose,
      onNewEntry: async (file: string, lineNumber: number, content: string) => {
        if (this.verbose) {
          const preview = content.substring(0, 80).replace(/\n/g, ' ');
          this.logger.debug(`[AICF] ${file}:${lineNumber} - ${preview}`);
        }
      },
    });
    this.principleWatcher = new PrincipleWatcher(this.cwd, {
      verbose: this.verbose,
      enableLearning: true,
      apiKey: process.env['ANTHROPIC_API_KEY'],
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
    // Check if daemon is already running
    const daemonManager = new DaemonManager(this.cwd);
    const statusResult = daemonManager.getStatus();

    if (statusResult.ok && statusResult.value.running) {
      console.log();
      console.log(chalk.red('❌ Watcher already running'));
      console.log();
      console.log(chalk.yellow('Status:'), chalk.green('Running ✓'));
      console.log(chalk.yellow('PID:'), statusResult.value.pid);
      console.log(chalk.yellow('Uptime:'), statusResult.value.uptime);
      console.log();
      console.log(chalk.dim('To stop the watcher, run:'));
      console.log(chalk.cyan('  aether stop'));
      console.log();
      console.log(chalk.dim('To check status, run:'));
      console.log(chalk.cyan('  aether status'));
      console.log();
      process.exit(1);
    }

    this.isRunning = true;

    // Initialize manager
    const initResult = this.manager.initialize();
    if (!initResult.ok) {
      console.error(chalk.red('❌ Failed to initialize watcher:'), initResult.error);
      process.exit(1);
    }

    // Write PID file
    const pidResult = daemonManager.writePidFile(process.pid);
    if (!pidResult.ok) {
      console.error(chalk.red('❌ Failed to write PID file:'), pidResult.error.message);
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

    // Start JSON-to-AICF watcher (Phase 2)
    this.jsonToAICFWatcher.start().then((result) => {
      if (result.ok) {
        if (this.verbose) {
          console.log(chalk.green('✅ JSON-to-AICF watcher started'));
        }
      } else {
        console.error(chalk.red('❌ Failed to start JSON-to-AICF watcher:'), result.error.message);
      }
    });

    // Start AICF file watcher (Phase 3)
    this.aicfFileWatcher
      .start()
      .then(() => {
        if (this.verbose) {
          console.log(chalk.green('✅ AICF file watcher started'));
        }
      })
      .catch((error: Error) => {
        console.error(chalk.red('❌ Failed to start AICF file watcher:'), error.message);
      });

    // Start Principle watcher (Phase 5)
    this.principleWatcher
      .start()
      .then(() => {
        if (this.verbose) {
          console.log(chalk.green('✅ Principle watcher started'));
        }
      })
      .catch((error: Error) => {
        console.error(chalk.red('❌ Failed to start Principle watcher:'), error.message);
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

    // Stop JSON-to-AICF watcher
    this.jsonToAICFWatcher.stop().then((result) => {
      if (!result.ok) {
        console.error(chalk.red('❌ Failed to stop JSON-to-AICF watcher:'), result.error.message);
      }
    });

    // Stop AICF file watcher
    this.aicfFileWatcher.stop().catch((error: Error) => {
      console.error(chalk.red('❌ Failed to stop AICF file watcher:'), error.message);
    });

    // Stop Principle watcher
    this.principleWatcher.stop().catch((error: Error) => {
      console.error(chalk.red('❌ Failed to stop Principle watcher:'), error.message);
    });

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

    // Clean up PID file
    const daemonManager = new DaemonManager(this.cwd);
    const deletePidResult = daemonManager.deletePidFile();
    if (!deletePidResult.ok) {
      console.error(chalk.red('❌ Failed to delete PID file:'), deletePidResult.error.message);
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
}
