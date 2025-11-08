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

// Load environment variables from .env.local and .env (in that order)
// .env.local takes precedence over .env
import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';

// Load .env first (lower priority)
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenvConfig({ path: envPath });
}

// Load .env.local second (higher priority, overrides .env)
const envLocalPath = join(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}
import chalk from 'chalk';
import { WatcherManager } from '../utils/WatcherManager.js';
import { WatcherLogger } from '../utils/WatcherLogger.js';
import { MultiClaudeConsolidationService } from '../services/MultiClaudeConsolidationService.js';
import { WatcherConfigManager, type PlatformName } from '../core/WatcherConfigManager.js';
import { AugmentCacheWriter } from '../writers/AugmentCacheWriter.js';
import { ClaudeCacheWriter } from '../writers/ClaudeCacheWriter.js';
import { CacheConsolidationAgent } from '../agents/CacheConsolidationAgent.js';
// import { MemoryDropoffAgent } from '../agents/MemoryDropoffAgent.js'; // Phase 7 - Disabled (using QuadIndex snapshots now)
// import { SessionConsolidationAgent } from '../agents/SessionConsolidationAgent.js'; // Phase 6.5 - Disabled (using .lill/raw/ + QuadIndex now)
import { DaemonManager } from '../utils/DaemonManager.js';
import { HealthCheck } from '../utils/HealthCheck.js';
import {
  ConversationWatcher,
  type ExtractedRelationship,
  type ExtractedHypothetical,
  type ExtractedRejected,
} from 'lill-core';
import { QuadIndex, SnapshotManager, ConceptResolver, type Principle } from 'lill-core';
import { ConversationOrchestrator } from '../orchestrators/ConversationOrchestrator.js';
import { ReasoningExtractor } from '../extractors/ReasoningExtractor.js';
import type { Message } from '../types/conversation.js';

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
  cwd?: string;
}

/**
 * Watch directory for checkpoint files and process them automatically
 */
export class WatcherCommand {
  private interval: number;
  private watchDir: string;
  private verbose: boolean;
  private manager: WatcherManager;
  private logger: WatcherLogger;
  private consolidationService: MultiClaudeConsolidationService;
  private configManager: WatcherConfigManager;
  private augmentCacheWriter: AugmentCacheWriter;
  private claudeCacheWriter: ClaudeCacheWriter;
  private cacheConsolidationAgent: CacheConsolidationAgent;
  // private sessionConsolidationAgent: SessionConsolidationAgent; // Phase 6.5 - Disabled (using .lill/raw/ + QuadIndex now)
  // private memoryDropoffAgent: MemoryDropoffAgent; // Phase 7 - Disabled (using QuadIndex snapshots now)
  private conversationWatcher: ConversationWatcher;
  private quadIndex: QuadIndex;
  private snapshotManager: SnapshotManager;
  private conceptResolver: ConceptResolver;
  private healthCheck: HealthCheck;
  private isRunning: boolean = false;
  private enabledPlatforms: PlatformName[] = [];
  private cwd: string;
  private hasIndexedData: boolean = false; // Track if we've indexed any data
  private snapshotTimerStarted: boolean = false; // Track if periodic snapshot timer has started

  constructor(options: WatcherCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.interval = parseInt(options.interval || '300000', 10);
    this.watchDir = options.dir || join(this.cwd, './checkpoints');
    this.verbose = options.verbose || false;

    // Create timestamped log file in .lill/logs/
    const logsDir = join(this.cwd, '.lill', 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = join(logsDir, `watcher-${timestamp}.log`);

    // Clean up old log files (keep last 10) - do this early before creating new log
    this.cleanupOldLogsSync(logsDir);

    this.manager = new WatcherManager({
      pidFile: join(this.cwd, '.lill', '.watcher.pid'), // Phase 6: Store in .lill/
      logFile,
      verbose: this.verbose,
    });
    this.logger = new WatcherLogger({
      verbose: this.verbose,
      logLevel: this.verbose ? 'debug' : 'info',
      logFile, // Pass log file to logger so it writes to file
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
    // this.sessionConsolidationAgent = new SessionConsolidationAgent(this.cwd); // Phase 6.5 - Disabled (using .lill/raw/ + QuadIndex now)
    // this.memoryDropoffAgent = new MemoryDropoffAgent(this.cwd); // Phase 7 - Disabled (using QuadIndex snapshots now)

    // Initialize QuadIndex and SnapshotManager FIRST (before ConversationWatcher)
    this.quadIndex = new QuadIndex();
    this.snapshotManager = new SnapshotManager({
      snapshotDir: join(this.cwd, '.lill', 'snapshots'),
      verbose: this.verbose,
    });

    // Initialize ConceptResolver for mapping concept names to principle IDs
    this.conceptResolver = new ConceptResolver(this.quadIndex, {
      minConfidence: 0.5, // Require at least 50% confidence for concept resolution
    });

    // Now create ConversationWatcher with QuadIndex callback
    this.conversationWatcher = new ConversationWatcher(this.cwd, {
      rawDir: join(this.cwd, '.lill', 'raw'), // CRITICAL: Use .lill/raw/ not .aicf/raw/
      verbose: this.verbose,
      onConversationProcessed: (conversationId: string, stats) => {
        if (this.verbose) {
          this.logger.debug(`Processed conversation: ${conversationId}`, { stats });
        }
      },
      onPrincipleExtracted: async (principle) => {
        // Convert ExtractedPrinciple to full Principle format for QuadIndex
        const fullPrinciple: Principle = {
          id: principle.id,
          name: principle.text, // Full text (no truncation)
          intent: principle.text,
          preconditions: [],
          postconditions: [],
          examples: [],
          counterexamples: [],
          applicable_to_models: ['all'],
          confidence: principle.confidence,
          status: 'pending', // Use 'pending' for new principles
          sources: [principle.source],
          created_at: new Date(principle.timestamp),
          updated_at: new Date(principle.timestamp),
          context: principle.conversationId,
        };

        // Index principle to QuadIndex
        const result = await this.quadIndex.addPrincipleAsync(fullPrinciple);

        if (!result.success) {
          this.logger.error(`Failed to index principle: ${principle.id}`, {
            error: result.error,
          });
          return;
        }

        // Mark that we've indexed data
        if (!this.hasIndexedData) {
          this.hasIndexedData = true;
          // Start snapshot timer now that we have data
          await this.startSnapshotTimerIfNeeded();
        }

        if (this.verbose) {
          this.logger.debug(`Indexed principle: ${principle.id}`, {
            text: principle.text.substring(0, 100),
          });
        }
      },
      onRelationshipExtracted: async (relationship: ExtractedRelationship) => {
        // Resolve concept names to principle IDs
        const resolved = await this.conceptResolver.resolveRelationship(
          relationship.from,
          relationship.to
        );

        if (!resolved) {
          // Cannot resolve one or both concepts - skip this relationship
          if (this.verbose) {
            this.logger.debug(
              `Skipped relationship (concepts not resolved): ${relationship.from} → ${relationship.to}`,
              {
                type: relationship.type,
                reason: 'One or both concepts could not be mapped to principle IDs',
              }
            );
          }
          return;
        }

        // Index relationship to QuadIndex GraphStore using resolved principle IDs
        const result = this.quadIndex.addRelationship(
          resolved.from, // Principle ID
          resolved.to, // Principle ID
          relationship.type,
          relationship.reason,
          relationship.evidence,
          relationship.strength * resolved.confidence // Adjust strength by resolution confidence
        );

        if (!result.success) {
          this.logger.error(`Failed to index relationship: ${relationship.id}`, {
            error: result.error,
          });
          return;
        }

        if (this.verbose) {
          this.logger.debug(
            `Indexed relationship: ${resolved.from} → ${resolved.to} (resolved from: ${relationship.from} → ${relationship.to})`,
            {
              type: relationship.type,
              confidence: resolved.confidence,
            }
          );
        }
      },
      onHypotheticalExtracted: async (hypothetical: ExtractedHypothetical) => {
        // Index hypothetical to QuadIndex ReasoningStore
        const result = this.quadIndex.addHypothetical({
          id: hypothetical.id,
          question: hypothetical.scenario,
          alternatives: [
            {
              option: hypothetical.expectedOutcome,
              status: 'deferred' as const,
              reason: hypothetical.reasoning,
            },
          ],
          status: 'considered',
          evidence: hypothetical.conversationId,
          created_at: new Date(hypothetical.timestamp),
          updated_at: new Date(hypothetical.timestamp),
        });

        if (!result.success) {
          this.logger.error(`Failed to index hypothetical: ${hypothetical.id}`, {
            error: result.error,
          });
          return;
        }

        if (this.verbose) {
          this.logger.debug(`Indexed hypothetical: ${hypothetical.scenario.substring(0, 50)}...`);
        }
      },
      onRejectedExtracted: async (rejected: ExtractedRejected) => {
        // Index rejected alternative to QuadIndex ReasoningStore
        const result = this.quadIndex.addRejected({
          id: rejected.id,
          option: rejected.alternative,
          reason: rejected.reason,
          evidence: rejected.conversationId,
          created_at: new Date(rejected.timestamp),
        });

        if (!result.success) {
          this.logger.error(`Failed to index rejected alternative: ${rejected.id}`, {
            error: result.error,
          });
          return;
        }

        if (this.verbose) {
          this.logger.debug(`Indexed rejected: ${rejected.alternative.substring(0, 50)}...`);
        }
      },
    });

    // Initialize HealthCheck (Task 4c)
    this.healthCheck = new HealthCheck({
      cwd: this.cwd,
      heartbeatInterval: 30000, // 30 seconds
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

    // Load QuadIndex from latest snapshot
    await this.loadQuadIndexFromSnapshot();

    // Resume from last timestamp (Task 1: Continuous data collection)
    await this.resumeFromLastTimestamp();

    // Start health check (Task 4c)
    this.healthCheck.start();
    if (this.verbose) {
      console.log(chalk.green('✅ Started health check system'));
    }

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

    // Handle graceful shutdown (Task 4b)
    process.on('SIGINT', async () => {
      // ✅ Take final snapshot before stopping
      if (this.snapshotManager && this.quadIndex) {
        this.logger.info('Taking final snapshot before shutdown...');
        await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');
        this.logger.info('Final snapshot saved');
      }
      await this.stop();
    });
    process.on('SIGTERM', async () => {
      // ✅ Take final snapshot before stopping
      if (this.snapshotManager && this.quadIndex) {
        this.logger.info('Taking final snapshot before shutdown...');
        await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');
        this.logger.info('Final snapshot saved');
      }
      await this.stop();
    });
    process.on('SIGHUP', async () => {
      // ✅ Take final snapshot before stopping
      if (this.snapshotManager && this.quadIndex) {
        this.logger.info('Taking final snapshot before shutdown...');
        await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');
        this.logger.info('Final snapshot saved');
      }
      await this.stop();
    });

    // Start Conversation watcher (simplified: replaces JSON + AICF watchers)
    this.conversationWatcher.start().then((result) => {
      if (result.ok) {
        if (this.verbose) {
          console.log(chalk.green('✅ Conversation watcher started'));
        }
      } else {
        console.error(chalk.red('❌ Failed to start conversation watcher:'), result.error.message);
      }
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
   * Stop the watcher (with graceful shutdown)
   */
  private async stop(): Promise<void> {
    this.isRunning = false;

    console.log(chalk.yellow('\n\n🛑 Stopping watcher gracefully...\n'));

    // Save QuadIndex snapshot before shutdown
    await this.saveQuadIndexSnapshot();

    // Stop Conversation watcher
    this.conversationWatcher.stop().then((result) => {
      if (!result.ok) {
        console.error(chalk.red('❌ Failed to stop conversation watcher:'), result.error.message);
      }
    });

    // Stop SnapshotManager
    this.snapshotManager.stop();

    // Stop health check (Task 4c)
    this.healthCheck.stop();

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

    // Note: Terminal window will close automatically via the shell wrapper
    // in watch-terminal command (sleep 2; exit)

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

    // 3. Consolidate individual files into session files (Phase 6.5) - DISABLED (using .lill/raw/ + QuadIndex now)
    // this.consolidateSessionFiles();

    // 4. Run memory dropoff (Phase 7) - compress sessions by age - DISABLED (using QuadIndex snapshots now)
    // this.runMemoryDropoff();
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
   * Consolidate cache chunks into .lill and .ai files
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
   *
   * DISABLED: Using .lill/raw/ + QuadIndex now instead of .aicf/sessions/
   */
  /*
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
  */

  /**
   * Run memory dropoff agent (Phase 7)
   * Move and compress conversations by age
   *
   * DISABLED: Phase 7 - Not using session files yet
   */
  // private runMemoryDropoff(): void {
  //   this.memoryDropoffAgent.dropoff().then((result) => {
  //     if (result.ok) {
  //       const stats = result.value;
  //       this.logger.info('Memory dropoff complete', {
  //         sessions: stats.sessionFiles,
  //         medium: stats.mediumFiles,
  //         old: stats.oldFiles,
  //         archive: stats.archiveFiles,
  //         movedToMedium: stats.movedToMedium,
  //         movedToOld: stats.movedToOld,
  //         movedToArchive: stats.movedToArchive,
  //         compressed: stats.compressed,
  //       });
  //       if (this.verbose && stats.compressed > 0) {
  //         console.log(chalk.cyan(`🗜️  Compressed ${stats.compressed} conversations`));
  //       }
  //     } else {
  //       this.logger.error('Memory dropoff failed', { error: result.error.message });
  //     }
  //   });
  // }

  /**
   * Clean up old log files (keep last 10) - sync version for constructor
   */
  private cleanupOldLogsSync(logsDir: string): void {
    try {
      if (!existsSync(logsDir)) {
        return;
      }

      const files = readdirSync(logsDir)
        .filter((f: string) => f.startsWith('watcher-') && f.endsWith('.log'))
        .map((f: string) => ({
          name: f,
          path: join(logsDir, f),
          mtime: statSync(join(logsDir, f)).mtime.getTime(),
        }))
        .sort(
          (
            a: { name: string; path: string; mtime: number },
            b: { name: string; path: string; mtime: number }
          ) => b.mtime - a.mtime
        ); // Sort by newest first

      // Keep last 10, delete the rest
      if (files.length > 10) {
        const toDelete = files.slice(10);
        toDelete.forEach((file: { name: string; path: string; mtime: number }) => {
          unlinkSync(file.path);
        });
      }
    } catch {
      // Ignore errors in log cleanup
    }
  }

  /**
   * Start snapshot timer if we have data and haven't started it yet
   */
  private async startSnapshotTimerIfNeeded(): Promise<void> {
    if (this.hasIndexedData && !this.snapshotTimerStarted) {
      this.snapshotTimerStarted = true;

      // Start the periodic snapshot timer (does NOT take immediate snapshot)
      await this.snapshotManager.start(this.quadIndex);

      // Take immediate snapshot of the data we just indexed
      const snapshotResult = await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');

      if (this.verbose) {
        if (snapshotResult.success) {
          this.logger.info('Started continuous snapshot system (5-minute intervals)');
          this.logger.info(`Took initial snapshot: ${snapshotResult.data}`);
        } else {
          this.logger.error('Failed to take initial snapshot', { error: snapshotResult.error });
        }
      }
    }
  }

  /**
   * Load QuadIndex from latest snapshot (Task 4a)
   */
  private async loadQuadIndexFromSnapshot(): Promise<void> {
    try {
      const result = await this.snapshotManager.restore(this.quadIndex, 'rolling');

      if (result.success) {
        const stats = this.quadIndex.getStats();
        if (this.verbose) {
          console.log(chalk.green('✅ Loaded QuadIndex from snapshot'));
          console.log(chalk.gray(`   Principles: ${stats.data.metadata.total}`));
          console.log(chalk.gray(`   Relationships: ${stats.data.graph.edges}`));
          console.log(chalk.gray(`   Hypotheticals: ${stats.data.reasoning.hypotheticals}`));
        }

        // If we loaded data from snapshot, mark as having indexed data
        if (stats.data.metadata.total > 0) {
          this.hasIndexedData = true;
        }
      } else {
        if (this.verbose) {
          console.log(chalk.yellow('⚠️  No snapshot found, starting with empty QuadIndex'));
        }
      }

      // DON'T start continuous snapshots yet - wait until we have data
      // The timer will be started after first data is indexed (see startSnapshotTimerIfNeeded)
      if (this.verbose && !this.hasIndexedData) {
        console.log(chalk.gray('⏳ Snapshot timer will start after first data is indexed'));
      }

      // Update health check stats
      this.updateHealthCheckStats();
    } catch (error) {
      console.error(
        chalk.red('❌ Failed to load QuadIndex:'),
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Resume from last timestamp (Task 1: Continuous data collection)
   * Processes any missed conversations since the last saved timestamp
   */
  private async resumeFromLastTimestamp(): Promise<void> {
    try {
      const { getLastTimestamp, formatTimestamp, getTimeDifferenceMinutes } = await import(
        '../utils/TimestampUtils.js'
      );
      const { AugmentLevelDBReader } = await import('../readers/AugmentLevelDBReader.js');

      const rawDir = join(this.cwd, '.lill', 'raw');
      const lastTimestamp = getLastTimestamp(rawDir);

      if (!lastTimestamp) {
        if (this.verbose) {
          console.log(chalk.yellow('⚠️  No previous timestamp found, starting fresh'));
        }
        return;
      }

      if (this.verbose) {
        console.log(chalk.cyan('🔄 Resuming from last timestamp...'));
        console.log(chalk.gray(`   Last saved: ${formatTimestamp(lastTimestamp)}`));
      }

      // Query LevelDB for conversations since last timestamp
      const reader = new AugmentLevelDBReader(this.cwd);
      const conversationsResult = await reader.readConversationsSince(lastTimestamp);

      if (!conversationsResult.ok) {
        if (this.verbose) {
          console.log(
            chalk.yellow('⚠️  Failed to read conversations:'),
            conversationsResult.error.message
          );
        }
        return;
      }

      const missedConversations = conversationsResult.value;

      if (missedConversations.length === 0) {
        if (this.verbose) {
          console.log(chalk.green('✅ No missed conversations, already up to date'));
        }
        return;
      }

      // Process missed conversations
      console.log(
        chalk.cyan(`📥 Found ${missedConversations.length} missed conversation(s), processing...`)
      );

      for (const conversation of missedConversations) {
        try {
          // Write directly to .lill/raw/ directory
          const { writeFileSync, mkdirSync, existsSync } = await import('fs');
          const rawDir = join(this.cwd, '.lill', 'raw');

          // Ensure directory exists
          if (!existsSync(rawDir)) {
            mkdirSync(rawDir, { recursive: true });
          }

          // Parse the raw data to extract messages
          const messages: Message[] = JSON.parse(conversation.rawData);

          // Extract key exchanges (user → assistant pairs) with FULL content
          const keyExchanges: Array<{
            timestamp: string;
            user: string;
            assistant_action: string;
            outcome: string;
          }> = [];

          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (msg && msg.role === 'user') {
              const nextMsg = messages[i + 1];
              if (nextMsg && nextMsg.role === 'assistant') {
                keyExchanges.push({
                  timestamp: msg.timestamp,
                  user: msg.content, // ✅ FULL user input, NO truncation
                  assistant_action: nextMsg.content, // ✅ FULL assistant response, NO truncation
                  outcome: nextMsg.content, // ✅ FULL outcome, NO truncation
                });
                i++; // Skip the assistant message
              }
            }
          }

          // ✅ NEW: Run extractors to get decisions and insights
          const orchestrator = new ConversationOrchestrator();

          // Run orchestrator to extract decisions, technical work, etc.
          const analysisResult = orchestrator.analyze(
            {
              id: conversation.conversationId,
              messages,
              timestamp: conversation.timestamp,
              source: 'augment',
            },
            conversation.rawData
          );

          // Extract decisions and insights from analysis
          const decisions = analysisResult.ok
            ? analysisResult.value.decisions.map((d, index) => ({
                id: `D${index + 1}`,
                timestamp: d.timestamp,
                decision: d.decision,
                reasoning: d.context,
                impact: d.impact,
                status: 'EXTRACTED',
                files_affected: [],
              }))
            : [];

          const insights = analysisResult.ok
            ? analysisResult.value.technicalWork.map((w, index) => ({
                id: `I${index + 1}`,
                category: w.type.toUpperCase(),
                priority: 'MEDIUM',
                confidence: 0.7,
                insight: w.work,
                memory_type: 'procedural',
                evidence: `Extracted from ${w.source}`,
              }))
            : [];

          // ✅ Phase 4b: Extract reasoning (hypotheticals + rejected alternatives)
          const reasoningExtractor = new ReasoningExtractor();
          const timestamp = conversation.timestamp || new Date().toISOString();
          const conversationId = conversation.conversationId || 'unknown';
          const reasoningResult = reasoningExtractor.extract({
            metadata: {
              conversationId: conversationId as string,
              date: new Date(timestamp).toISOString().split('T')[0] as string,
              platform: 'augment-leveldb' as string,
            },
            messages,
          });

          // Index hypotheticals to QuadIndex
          for (const hypothetical of reasoningResult.hypotheticals) {
            const result = this.quadIndex.addHypothetical(hypothetical);
            if (!result.success && this.verbose) {
              this.logger.debug(`Failed to index hypothetical: ${hypothetical.id}`, {
                error: result.error,
              });
            }
          }

          // Index rejected alternatives to QuadIndex
          for (const rejected of reasoningResult.rejectedAlternatives) {
            const result = this.quadIndex.addRejected(rejected);
            if (!result.success && this.verbose) {
              this.logger.debug(`Failed to index rejected alternative: ${rejected.id}`, {
                error: result.error,
              });
            }
          }

          if (
            this.verbose &&
            (reasoningResult.hypotheticals.length > 0 ||
              reasoningResult.rejectedAlternatives.length > 0)
          ) {
            this.logger.debug(
              `Extracted reasoning: ${reasoningResult.hypotheticals.length} hypotheticals, ${reasoningResult.rejectedAlternatives.length} rejected`
            );
          }

          // Format as conversation JSON (NEW format with messages field)
          const conversationData = {
            metadata: {
              conversationId: conversation.conversationId,
              date: new Date(conversation.timestamp).toISOString().split('T')[0],
              platform: 'augment-leveldb',
              user: 'dennis_van_leeuwen',
              status: 'completed',
              timestamp_start: conversation.timestamp,
              timestamp_end: conversation.lastModified,
              duration_minutes: getTimeDifferenceMinutes(
                conversation.timestamp,
                conversation.lastModified
              ),
              messages: messages.length,
              tokens_estimated: messages.length * 100, // Rough estimate
            },
            conversation: {
              topic: 'Conversation',
              summary: `${messages.length} messages exchanged`,
              participants: ['user_dennis', 'assistant_augment'],
              flow: [],
            },
            messages, // ✅ NEW: Include full messages array for Phase 3
            key_exchanges: keyExchanges,
            decisions, // ✅ Now populated by DecisionExtractor
            insights, // ✅ Now populated by TechnicalWorkExtractor
          };

          // Write to file
          const filename = `${conversationData.metadata.date}_${conversation.conversationId}.json`;
          const filepath = join(rawDir, filename);
          writeFileSync(filepath, JSON.stringify(conversationData, null, 2), 'utf-8');

          const timeDiff = getTimeDifferenceMinutes(lastTimestamp, conversation.lastModified);
          if (this.verbose) {
            console.log(
              chalk.green(`   ✅ Processed conversation ${conversation.conversationId}`),
              chalk.gray(`(${timeDiff} minutes ago)`)
            );
          }
        } catch (error) {
          console.error(
            chalk.red(`   ❌ Error processing conversation ${conversation.conversationId}:`),
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      console.log(
        chalk.green(`✅ Resume complete, processed ${missedConversations.length} conversation(s)`)
      );
    } catch (error) {
      console.error(
        chalk.red('❌ Failed to resume from last timestamp:'),
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Save QuadIndex snapshot (Task 4b: Graceful Shutdown)
   */
  private async saveQuadIndexSnapshot(): Promise<void> {
    try {
      const result = await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');

      if (result.success) {
        console.log(chalk.green('✅ Saved QuadIndex snapshot'));
        if (this.verbose) {
          console.log(chalk.gray(`   Snapshot: ${result.data}`));
        }
      } else {
        console.error(chalk.red('❌ Failed to save snapshot:'), result.error);
      }
    } catch (error) {
      console.error(
        chalk.red('❌ Error saving snapshot:'),
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Update health check stats from QuadIndex (Task 4c + Task 4)
   */
  private updateHealthCheckStats(): void {
    try {
      const stats = this.quadIndex.getStats();
      this.healthCheck.updateStats({
        principles: stats.data.metadata.total,
        relationships: stats.data.graph.edges,
        hypotheticals: stats.data.reasoning.hypotheticals,
        rejected: stats.data.reasoning.rejected,
      });

      // Update lock stats (Task 4: Memory Monitoring)
      const lockStats = this.quadIndex.getLockStats();
      this.healthCheck.updateLockStats(lockStats);
    } catch {
      // Ignore errors (don't crash watcher)
    }
  }
}
