/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Start Command - Start AETHER watcher daemon
 * Phase 6: November 2025
 * Updated: November 9, 2025 - Guardian archived with MCP integration
 *
 * Starts Watcher as background daemon (Guardian archived)
 */

import chalk from 'chalk';
import ora from 'ora';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { DaemonController } from '../utils/DaemonController.js';

export interface StartCommandOptions {
  cwd?: string;
  verbose?: boolean;
}

export interface StartResult {
  watcherPid?: number;
  message: string;
}

/**
 * Start AETHER watcher daemon (Guardian archived)
 */
export class StartCommand {
  private cwd: string;
  private verbose: boolean;

  constructor(options: StartCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
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

      // Check if already running (watcher only - guardian archived)
      if (status.watcher.running) {
        return Err(new Error(`Watcher already running (PID: ${status.watcher.pid})`));
      }

      // Show banner
      console.log(chalk.bold.cyan('\n🌌 Starting AETHER...\n'));

      // Start watcher
      spinner.start('Starting watcher...');

      const startResult = await controller.start({
        cwd: this.cwd,
        verbose: this.verbose,
      });

      if (!startResult.ok) {
        spinner.fail('Failed to start watcher');
        return startResult;
      }

      spinner.succeed('Watcher started');

      // Show success message
      console.log();
      if (startResult.value.watcherPid) {
        console.log(chalk.green('✅ Watcher started'));
        console.log(chalk.dim(`   PID: ${startResult.value.watcherPid}`));
        console.log(chalk.dim(`   Monitoring: AI conversations`));
        console.log(chalk.dim(`   Health: .aether-health.json`));
      }

      console.log();
      console.log(chalk.bold('📊 Status:'));
      console.log(chalk.dim('   Check status: aether status'));
      console.log(chalk.dim('   View logs: tail -f .lill/.aether.log'));
      console.log(chalk.dim('   Stop watcher: aether stop'));
      console.log();
      console.log(chalk.dim('💡 Guardian archived (MCP integration handles protection)'));
      console.log();

      return Ok({
        watcherPid: startResult.value.watcherPid,
        message: 'AETHER watcher started successfully',
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
