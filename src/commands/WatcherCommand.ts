/**
 * Watcher Command
 * Phase 3: CLI Integration - October 2025
 *
 * Background watcher for automatic checkpoint processing
 */

import { readdirSync, existsSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { CheckpointProcessor } from './CheckpointProcessor.js';
import { WatcherManager } from '../utils/WatcherManager.js';
import { WatcherLogger } from '../utils/WatcherLogger.js';

interface WatcherCommandOptions {
  interval?: string;
  dir?: string;
  verbose?: boolean;
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
  private isRunning: boolean = false;
  private processedFiles: Set<string> = new Set();

  constructor(options: WatcherCommandOptions = {}) {
    this.interval = parseInt(options.interval || '5000', 10);
    this.watchDir = options.dir || './checkpoints';
    this.verbose = options.verbose || false;
    this.processor = new CheckpointProcessor({
      output: '.aicf',
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
    });

    console.log(chalk.cyan('\n🔍 Starting checkpoint watcher...\n'));
    console.log(chalk.gray(`   Watch Directory: ${this.watchDir}`));
    console.log(chalk.gray(`   Check Interval: ${this.interval}ms`));
    console.log(chalk.gray(`   Verbose: ${this.verbose ? 'enabled' : 'disabled'}`));
    console.log(chalk.gray(`   PID File: ${this.manager.getPidFilePath()}`));
    console.log(chalk.gray(`   Log File: ${this.manager.getLogFilePath()}`));
    console.log(chalk.gray('\n   Press Ctrl+C to stop\n'));

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.stop();
    });

    // Start watching
    this.watch();
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
   * Check for new checkpoint files
   */
  private checkForCheckpoints(): void {
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
