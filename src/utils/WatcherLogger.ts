/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Watcher Logger
 * Phase 3.3: Watcher Integration - October 2025
 *
 * Structured logging for watcher operations
 * Integrated with aicf-core for AICF format output
 */

import chalk from 'chalk';
import { AICFWriter } from 'aicf-core';
import { appendFileSync } from 'fs';

export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface WatcherLoggerOptions {
  verbose?: boolean;
  logLevel?: LogLevel;
  maxEntries?: number;
  aicfDir?: string;
  logFile?: string;
}

/**
 * Structured logger for watcher operations
 * Integrates with aicf-core for AICF format output
 */
export class WatcherLogger {
  private verbose: boolean;
  private logLevel: LogLevel;
  private maxEntries: number;
  private entries: LogEntry[] = [];
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    success: 2,
    warning: 3,
    error: 4,
  };
  private aicfWriter: AICFWriter;
  private logFile?: string;

  constructor(options: WatcherLoggerOptions = {}) {
    this.verbose = options.verbose || false;
    this.logLevel = options.logLevel || 'info';
    this.maxEntries = options.maxEntries || 1000;
    this.aicfWriter = new AICFWriter(options.aicfDir || '.aicf');
    this.logFile = options.logFile;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Log success message
   */
  success(message: string, context?: Record<string, unknown>): void {
    this.log('success', message, context);
  }

  /**
   * Log warning message
   */
  warning(message: string, context?: Record<string, unknown>): void {
    this.log('warning', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // Check if this level should be logged
    if (this.levelPriority[level] < this.levelPriority[this.logLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    // Add to entries
    this.entries.push(entry);

    // Trim entries if exceeds max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Print to console if verbose
    if (this.verbose) {
      this.printEntry(entry);
    }

    // Write to log file if specified
    if (this.logFile) {
      this.writeToFile(entry);
    }
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: LogEntry): void {
    if (!this.logFile) return;

    try {
      const timestamp = entry.timestamp.toISOString();
      const levelStr = entry.level.toUpperCase().padEnd(7);
      let logLine = `[${timestamp}] [${levelStr}] ${entry.message}`;

      if (entry.context && Object.keys(entry.context).length > 0) {
        logLine += ` ${JSON.stringify(entry.context)}`;
      }

      logLine += '\n';

      appendFileSync(this.logFile, logLine, 'utf-8');
    } catch {
      // Silently ignore file write errors
    }
  }

  /**
   * Print log entry to console
   */
  private printEntry(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = entry.level.toUpperCase().padEnd(7);

    const colorMap: Record<LogLevel, (str: string) => string> = {
      debug: chalk.gray,
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
    };

    const colorFn = colorMap[entry.level];
    const prefix = colorFn(`[${timestamp}] [${levelStr}]`);

    let output = `${prefix} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    console.log(output);
  }

  /**
   * Get all log entries
   */
  getEntries(level?: LogLevel): LogEntry[] {
    if (!level) {
      return [...this.entries];
    }

    return this.entries.filter((entry) => entry.level === level);
  }

  /**
   * Get recent log entries
   */
  getRecent(count: number = 10, level?: LogLevel): LogEntry[] {
    let entries = this.entries;

    if (level) {
      entries = entries.filter((entry) => entry.level === level);
    }

    return entries.slice(-count);
  }

  /**
   * Get log entries since timestamp
   */
  getSince(timestamp: Date, level?: LogLevel): LogEntry[] {
    let entries = this.entries.filter((entry) => entry.timestamp >= timestamp);

    if (level) {
      entries = entries.filter((entry) => entry.level === level);
    }

    return entries;
  }

  /**
   * Get log statistics
   */
  getStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      success: 0,
      warning: 0,
      error: 0,
    };

    for (const entry of this.entries) {
      stats[entry.level]++;
    }

    return stats;
  }

  /**
   * Clear all log entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Set verbose mode
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Format entries as string (plain text format)
   */
  format(entries?: LogEntry[]): string {
    const entriesToFormat = entries || this.entries;

    return entriesToFormat
      .map((entry) => {
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase().padEnd(7);
        let line = `[${timestamp}] [${level}] ${entry.message}`;

        if (entry.context && Object.keys(entry.context).length > 0) {
          line += ` ${JSON.stringify(entry.context)}`;
        }

        return line;
      })
      .join('\n');
  }

  /**
   * Write entries to AICF file using aicf-core
   * Delegates to AICFWriter for professional AICF format output
   */
  async writeToAICF(entries?: LogEntry[]): Promise<{ ok: boolean; error?: string }> {
    const entriesToWrite = entries || this.entries;

    if (entriesToWrite.length === 0) {
      return { ok: true };
    }

    try {
      // Group entries by type
      const checkEntries = entriesToWrite.filter(
        (e) => e.message.includes('checkpoint') || e.message.includes('Checking')
      );
      const parseEntries = entriesToWrite.filter(
        (e) => e.message.includes('parse') || e.message.includes('platform')
      );
      const writeEntries = entriesToWrite.filter(
        (e) => e.message.includes('write') || e.message.includes('Processed')
      );
      const errorEntries = entriesToWrite.filter((e) => e.level === 'error');

      // Write checkpoint events
      for (const entry of checkEntries) {
        await this.aicfWriter.appendLine(
          '.watcher-events.aicf',
          `@WATCHER_CHECK|timestamp=${entry.timestamp.toISOString()}|event=checkpoint_check|status=${entry.level === 'error' ? 'error' : 'success'}|message=${entry.message}`
        );
      }

      // Write parse events
      for (const entry of parseEntries) {
        await this.aicfWriter.appendLine(
          '.watcher-events.aicf',
          `@WATCHER_PARSE|timestamp=${entry.timestamp.toISOString()}|event=conversation_parse|status=${entry.level === 'error' ? 'error' : 'success'}|message=${entry.message}`
        );
      }

      // Write file write events
      for (const entry of writeEntries) {
        await this.aicfWriter.appendLine(
          '.watcher-events.aicf',
          `@WATCHER_WRITE|timestamp=${entry.timestamp.toISOString()}|event=files_written|status=${entry.level === 'error' ? 'error' : 'success'}|message=${entry.message}`
        );
      }

      // Write error events
      for (const entry of errorEntries) {
        await this.aicfWriter.appendLine(
          '.watcher-events.aicf',
          `@WATCHER_ERROR|timestamp=${entry.timestamp.toISOString()}|event=watcher_error|status=error|message=${entry.message}`
        );
      }

      // Write summary
      const stats = this.getStats();
      await this.aicfWriter.appendLine(
        '.watcher-events.aicf',
        `@WATCHER_SUMMARY|timestamp=${new Date().toISOString()}|event=cycle_summary|total_entries=${entriesToWrite.length}|info=${stats.info}|success=${stats.success}|warning=${stats.warning}|error=${stats.error}|debug=${stats.debug}`
      );

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get total entry count
   */
  getCount(): number {
    return this.entries.length;
  }
}
