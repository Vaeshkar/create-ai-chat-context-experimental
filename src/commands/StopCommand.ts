/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Stop Command - Stop AETHER watcher
 * Phase 6: November 2025
 * Updated: November 9, 2025 - Guardian archived with MCP integration
 */

import chalk from 'chalk';
import ora from 'ora';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { DaemonController } from '../utils/DaemonController.js';

export interface StopCommandOptions {
  cwd?: string;
  verbose?: boolean;
}

export interface StopResult {
  message: string;
  watcherStopped: boolean;
}

export class StopCommand {
  private cwd: string;

  constructor(options: StopCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
  }

  async execute(): Promise<Result<StopResult>> {
    try {
      const spinner = ora();
      const controller = new DaemonController(this.cwd);

      // Check current status
      const status = controller.getStatus();

      if (!status.watcher.running) {
        spinner.info('Watcher not running');
        console.log();
        console.log(chalk.dim('To start AETHER, run:'));
        console.log(chalk.cyan('  aether start'));
        console.log();
        return Ok({
          message: 'Watcher not running',
          watcherStopped: false,
        });
      }

      // Show banner
      console.log(chalk.bold.cyan('\n🛑 Stopping AETHER...\n'));

      spinner.start('Stopping watcher...');

      // Stop watcher
      const stopResult = await controller.stop();

      let watcherStopped = false;

      if (!stopResult.ok) {
        spinner.warn('Failed to stop watcher');
        console.log();
        console.log(chalk.yellow(`⚠️  ${stopResult.error.message}`));
        console.log();

        // Check if it actually stopped
        const newStatus = controller.getStatus();
        watcherStopped = !newStatus.watcher.running;
      } else {
        spinner.succeed('Watcher stopped');
        watcherStopped = true;
      }

      // Show what was stopped
      console.log();
      if (watcherStopped) {
        console.log(chalk.green('✅ Watcher stopped'));
        if (status.watcher.pid) {
          console.log(chalk.dim(`   PID: ${status.watcher.pid}`));
        }
      }

      console.log();
      console.log(chalk.dim('💡 Guardian archived (MCP integration handles protection)'));
      console.log();
      console.log(chalk.dim('To restart AETHER, run:'));
      console.log(chalk.cyan('  aether start'));
      console.log();

      return Ok({
        message: 'AETHER watcher stopped successfully',
        watcherStopped,
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
