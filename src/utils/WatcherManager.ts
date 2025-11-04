/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Watcher Manager
 * Phase 3.3: Watcher Integration - October 2025
 *
 * Manages daemon mode, process lifecycle, and background watcher operations
 * Integrated with aicf-core for AICF format logging
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import chalk from 'chalk';
import { AICFWriter } from 'aicf-core';

export interface WatcherManagerOptions {
  pidFile?: string;
  logFile?: string;
  aicfLogFile?: string;
  daemonMode?: boolean;
  verbose?: boolean;
}

export interface WatcherStatus {
  isRunning: boolean;
  pid?: number;
  startTime?: Date;
  uptime?: number;
  processedCount?: number;
  errorCount?: number;
}

/**
 * Watcher Manager for daemon mode and process lifecycle management
 * Integrates with aicf-core for AICF format logging
 */
export class WatcherManager {
  private pidFile: string;
  private logFile: string;
  private aicfLogFile: string;
  private verbose: boolean;
  private pid: number;
  private startTime: Date | null = null;
  private processedCount: number = 0;
  private errorCount: number = 0;
  private aicfWriter: AICFWriter;

  constructor(options: WatcherManagerOptions = {}) {
    this.pidFile = options.pidFile || '.watcher.pid';
    this.logFile = options.logFile || '.watcher.log';
    this.aicfLogFile = options.aicfLogFile || '.lill/.watcher-events.aicf'; // Phase 6: Use .lill/ not .aicf/
    this.verbose = options.verbose || false;
    this.pid = process.pid;
    this.aicfWriter = new AICFWriter('.lill'); // Phase 6: Use .lill/ not .aicf/
  }

  /**
   * Initialize watcher (write PID file, setup signal handlers)
   */
  initialize(): { ok: true } | { ok: false; error: string } {
    try {
      // Write PID file
      writeFileSync(this.pidFile, String(this.pid), 'utf-8');

      // Record start time
      this.startTime = new Date();

      // Setup signal handlers
      this.setupSignalHandlers();

      if (this.verbose) {
        console.log(chalk.green(`✅ Watcher initialized (PID: ${this.pid})`));
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cleanup watcher (remove PID file, cleanup resources)
   */
  cleanup(): { ok: true } | { ok: false; error: string } {
    try {
      // Remove PID file
      if (existsSync(this.pidFile)) {
        unlinkSync(this.pidFile);
      }

      if (this.verbose) {
        console.log(chalk.green('✅ Watcher cleaned up'));
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get watcher status
   */
  getStatus(): WatcherStatus {
    const isRunning = this.isProcessRunning();
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : undefined;

    return {
      isRunning,
      pid: this.pid,
      startTime: this.startTime || undefined,
      uptime,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
    };
  }

  /**
   * Check if process is running
   */
  isProcessRunning(): boolean {
    if (!existsSync(this.pidFile)) {
      return false;
    }

    try {
      const pidContent = readFileSync(this.pidFile, 'utf-8').trim();
      const storedPid = parseInt(pidContent, 10);
      return storedPid === this.pid;
    } catch {
      return false;
    }
  }

  /**
   * Record successful checkpoint processing
   */
  async recordSuccess(): Promise<void> {
    this.processedCount++;
    await this.logEvent('success', `Processed checkpoint (total: ${this.processedCount})`);
  }

  /**
   * Record checkpoint processing error
   */
  async recordError(error: string): Promise<void> {
    this.errorCount++;
    await this.logEvent('error', `Processing error: ${error} (total errors: ${this.errorCount})`);
  }

  /**
   * Log event to file (both plain text and AICF)
   */
  private async logEvent(
    level: 'info' | 'success' | 'error' | 'warning',
    message: string
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

      // Append to plain text log file
      if (existsSync(this.logFile)) {
        const existing = readFileSync(this.logFile, 'utf-8');
        writeFileSync(this.logFile, existing + logEntry, 'utf-8');
      } else {
        writeFileSync(this.logFile, logEntry, 'utf-8');
      }

      // Also write to AICF log file using aicf-core
      await this.logEventAsAICF(level, message, timestamp);

      if (this.verbose) {
        const colorMap = {
          info: chalk.blue,
          success: chalk.green,
          error: chalk.red,
          warning: chalk.yellow,
        };
        const colorFn = colorMap[level];
        console.log(colorFn(`[${level.toUpperCase()}] ${message}`));
      }
    } catch (error) {
      console.error(chalk.red('Failed to write log:'), error);
    }
  }

  /**
   * Log event to AICF file using aicf-core
   */
  private async logEventAsAICF(level: string, message: string, timestamp: string): Promise<void> {
    try {
      // Determine event type from message
      let eventType = 'watcher_event';
      if (message.includes('checkpoint')) eventType = 'checkpoint_processed';
      if (message.includes('error')) eventType = 'error_occurred';
      if (message.includes('Received')) eventType = 'signal_received';

      // Use aicf-core's AICFWriter to append event
      const aicfEntry = `@WATCHER_EVENT|timestamp=${timestamp}|level=${level}|event=${eventType}|message=${message}`;
      await this.aicfWriter.appendLine('.watcher-events.aicf', aicfEntry);
    } catch (error) {
      // Silently fail for AICF logging to not disrupt main logging
      if (this.verbose) {
        console.error(chalk.yellow('Warning: Failed to write AICF log:'), error);
      }
    }
  }

  /**
   * Setup signal handlers for graceful shutdown
   *
   * NOTE: Signal handlers are now managed by WatcherCommand to ensure
   * proper shutdown order (take final snapshot, then cleanup).
   * This method is kept for backwards compatibility but does nothing.
   */
  private setupSignalHandlers(): void {
    // Signal handlers removed - WatcherCommand handles shutdown
  }

  /**
   * Get log file content
   */
  getLogContent(): { ok: true; content: string } | { ok: false; error: string } {
    try {
      if (!existsSync(this.logFile)) {
        return { ok: true, content: '' };
      }

      const content = readFileSync(this.logFile, 'utf-8');
      return { ok: true, content };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clear log file
   */
  async clearLog(): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      if (existsSync(this.logFile)) {
        unlinkSync(this.logFile);
      }

      await this.logEvent('info', 'Log file cleared');
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get PID file path
   */
  getPidFilePath(): string {
    return this.pidFile;
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.logFile;
  }

  /**
   * Get AICF log file path
   */
  getAICFLogFilePath(): string {
    return this.aicfLogFile;
  }

  /**
   * Set verbose mode
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
}
