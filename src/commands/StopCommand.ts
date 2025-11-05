/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Stop Command - Stop AETHER daemons (Watcher + Guardian)
 * Phase 6: November 2025
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
  guardianStopped: boolean;
}

export class StopCommand {
  private cwd: string;
  private verbose: boolean;

  constructor(options: StopCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
  }

  async execute(): Promise<Result<StopResult>> {
    try {
      const spinner = ora();
      const controller = new DaemonController(this.cwd);

      // Check current status
      const status = controller.getStatus();

      if (!status.watcher.running && !status.guardian.running) {
        spinner.info('No AETHER services running');
        console.log();
        console.log(chalk.dim('To start AETHER, run:'));
        console.log(chalk.cyan('  aether start'));
        console.log();
        return Ok({
          message: 'No services running',
          watcherStopped: false,
          guardianStopped: false,
        });
      }

      // Show banner
      console.log(chalk.bold.cyan('\n🛑 Stopping AETHER...\n'));

      spinner.start('Stopping background services...');

      // Stop both daemons
      const stopResult = await controller.stop();

      let watcherStopped = false;
      let guardianStopped = false;

      if (!stopResult.ok) {
        // Partial failure - some services stopped, some didn't
        spinner.warn('Some services failed to stop');
        console.log();
        console.log(chalk.yellow(`⚠️  ${stopResult.error.message}`));
        console.log();

        // Check which ones actually stopped
        const newStatus = controller.getStatus();
        watcherStopped = !newStatus.watcher.running;
        guardianStopped = !newStatus.guardian.running;
      } else {
        spinner.succeed('Background services stopped');
        watcherStopped = true;
        guardianStopped = true;
      }

      // Show what was stopped
      console.log();
      if (watcherStopped) {
        console.log(chalk.green('✅ Watcher stopped'));
        if (status.watcher.pid) {
          console.log(chalk.dim(`   PID: ${status.watcher.pid}`));
        }
      }

      if (guardianStopped) {
        console.log(chalk.green('✅ Guardian stopped'));
        if (status.guardian.pid) {
          console.log(chalk.dim(`   PID: ${status.guardian.pid}`));
        }
      }

      console.log();
      console.log(chalk.dim('To restart AETHER, run:'));
      console.log(chalk.cyan('  aether start'));
      console.log();

      return Ok({
        message: 'AETHER stopped successfully',
        watcherStopped,
        guardianStopped,
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
