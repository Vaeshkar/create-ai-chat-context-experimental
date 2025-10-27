/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Status Command - Show watcher daemon status
 */

import chalk from 'chalk';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { DaemonManager, type DaemonStatus } from '../utils/DaemonManager.js';

export interface StatusCommandOptions {
  cwd?: string;
  verbose?: boolean;
}

export interface StatusResult {
  status: DaemonStatus;
  message: string;
}

export class StatusCommand {
  private cwd: string;

  constructor(options: StatusCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
  }

  async execute(): Promise<Result<StatusResult>> {
    try {
      const daemonManager = new DaemonManager(this.cwd);

      // Get daemon status
      const statusResult = daemonManager.getStatus();
      if (!statusResult.ok) {
        return Err(statusResult.error);
      }

      const status = statusResult.value;

      console.log();
      console.log(chalk.cyan('🔍 Watcher Status'));
      console.log();

      if (!status.running) {
        console.log(chalk.yellow('Status:'), chalk.red('Not Running'));
        console.log();
        console.log(chalk.dim('To start the watcher, run:'));
        console.log(chalk.cyan('  aice watch'));
        console.log();
        return Ok({
          status,
          message: 'Daemon not running',
        });
      }

      // Daemon is running - show details
      console.log(chalk.yellow('Status:'), chalk.green('Running ✓'));
      console.log(chalk.yellow('PID:'), status.pid);
      console.log(chalk.yellow('Uptime:'), status.uptime);

      if (status.startTime) {
        console.log(chalk.yellow('Started:'), status.startTime.toLocaleString());
      }

      if (status.lastSync) {
        const timeSinceSync = Date.now() - status.lastSync.getTime();
        const minutesAgo = Math.floor(timeSinceSync / 60000);
        console.log(
          chalk.yellow('Last Sync:'),
          `${status.lastSync.toLocaleTimeString()} (${minutesAgo}m ago)`
        );
      }

      if (status.platforms && status.platforms.length > 0) {
        console.log(chalk.yellow('Platforms:'), status.platforms.join(', '));
      }

      console.log();
      console.log(chalk.dim('To stop the watcher, run:'));
      console.log(chalk.cyan('  aice stop'));
      console.log();

      return Ok({
        status,
        message: 'Daemon running',
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
