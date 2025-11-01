/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Stop Command - Stop the background watcher daemon
 */

import chalk from 'chalk';
import ora from 'ora';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { DaemonManager } from '../utils/DaemonManager.js';

export interface StopCommandOptions {
  cwd?: string;
  verbose?: boolean;
}

export interface StopResult {
  message: string;
  pid?: number;
}

export class StopCommand {
  private cwd: string;

  constructor(options: StopCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
  }

  async execute(): Promise<Result<StopResult>> {
    try {
      const spinner = ora();
      const daemonManager = new DaemonManager(this.cwd);

      // Check if daemon is running
      const statusResult = daemonManager.getStatus();
      if (!statusResult.ok) {
        return Err(statusResult.error);
      }

      const status = statusResult.value;

      if (!status.running) {
        spinner.info('No watcher daemon running');
        console.log();
        console.log(chalk.dim('To start the watcher, run:'));
        console.log(chalk.cyan('  aether watch'));
        console.log();
        return Ok({
          message: 'No daemon running',
        });
      }

      spinner.start(`Stopping watcher daemon (PID: ${status.pid})...`);

      // Stop the daemon
      const stopResult = daemonManager.stopDaemon();
      if (!stopResult.ok) {
        spinner.fail('Failed to stop daemon');
        return Err(stopResult.error);
      }

      spinner.succeed(`Watcher daemon stopped (PID: ${status.pid})`);
      console.log();
      console.log(chalk.green('✅ Watcher Stopped'));
      console.log();
      console.log(chalk.dim('To restart the watcher, run:'));
      console.log(chalk.cyan('  aether watch'));
      console.log();

      return Ok({
        message: 'Daemon stopped successfully',
        pid: status.pid,
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
