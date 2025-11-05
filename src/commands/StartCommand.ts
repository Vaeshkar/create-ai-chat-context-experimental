/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Start Command - Start AETHER daemons
 * Phase 6: November 2025
 *
 * Starts both Watcher and Guardian as background daemons
 */

import chalk from 'chalk';
import ora from 'ora';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { DaemonController } from '../utils/DaemonController.js';

export interface StartCommandOptions {
  cwd?: string;
  verbose?: boolean;
  watcherOnly?: boolean;
  guardianOnly?: boolean;
}

export interface StartResult {
  watcherPid?: number;
  guardianPid?: number;
  message: string;
}

/**
 * Start AETHER daemons (Watcher + Guardian)
 */
export class StartCommand {
  private cwd: string;
  private verbose: boolean;
  private watcherOnly: boolean;
  private guardianOnly: boolean;

  constructor(options: StartCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
    this.watcherOnly = options.watcherOnly || false;
    this.guardianOnly = options.guardianOnly || false;
  }

  /**
   * Execute start command
   */
  async execute(): Promise<Result<StartResult>> {
    try {
      const spinner = ora();
      const controller = new DaemonController(this.cwd);

      // Check current status
      const status = controller.getStatus();

      // Check if already running
      if (!this.watcherOnly && !this.guardianOnly) {
        if (status.watcher.running && status.guardian.running) {
          return Err(
            new Error(
              `AETHER already running\n   Watcher: PID ${status.watcher.pid}\n   Guardian: PID ${status.guardian.pid}`
            )
          );
        }
      }

      if (this.watcherOnly && status.watcher.running) {
        return Err(new Error(`Watcher already running (PID: ${status.watcher.pid})`));
      }

      if (this.guardianOnly && status.guardian.running) {
        return Err(new Error(`Guardian already running (PID: ${status.guardian.pid})`));
      }

      // Show banner
      console.log(chalk.bold.cyan('\n🌌 Starting AETHER...\n'));

      // Start daemons
      spinner.start('Starting background services...');

      const startResult = await controller.start({
        cwd: this.cwd,
        verbose: this.verbose,
        watcherOnly: this.watcherOnly,
        guardianOnly: this.guardianOnly,
      });

      if (!startResult.ok) {
        spinner.fail('Failed to start AETHER');
        return startResult;
      }

      spinner.succeed('Background services started');

      // Show success message
      console.log();
      if (startResult.value.watcherPid) {
        console.log(chalk.green('✅ Watcher started'));
        console.log(chalk.dim(`   PID: ${startResult.value.watcherPid}`));
        console.log(chalk.dim(`   Monitoring: AI conversations`));
        console.log(chalk.dim(`   Health: .aether-health.json`));
      }

      if (startResult.value.guardianPid) {
        console.log(chalk.green('✅ Guardian started'));
        console.log(chalk.dim(`   PID: ${startResult.value.guardianPid}`));
        console.log(chalk.dim(`   Protecting: .ai/ folder`));
        console.log(chalk.dim(`   Feedback: .aether-STOP.md`));
      }

      console.log();
      console.log(chalk.bold('📊 Status:'));
      console.log(chalk.dim('   Check status: aether status'));
      console.log(chalk.dim('   View logs: tail -f .lill/.aether.log'));
      console.log(chalk.dim('   Stop services: aether stop'));
      console.log();

      return Ok({
        watcherPid: startResult.value.watcherPid,
        guardianPid: startResult.value.guardianPid,
        message: 'AETHER started successfully',
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
