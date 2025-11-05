/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Status Command - Show AETHER daemon status (Watcher + Guardian)
 * Phase 6: November 2025
 */

import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { DaemonController, type DaemonStatus } from '../utils/DaemonController.js';

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
      const controller = new DaemonController(this.cwd);
      const status = controller.getStatus();

      // Show banner
      console.log();
      console.log(
        chalk.bold.cyan('╔════════════════════════════════════════════════════════════════╗')
      );
      console.log(
        chalk.bold.cyan('║                      🌌 AETHER STATUS                          ║')
      );
      console.log(
        chalk.bold.cyan('╚════════════════════════════════════════════════════════════════╝')
      );
      console.log();

      // Watcher status
      console.log(chalk.bold('Watcher:'), this.getStatusBadge(status.watcher.running));
      if (status.watcher.running) {
        console.log(chalk.dim(`  PID: ${status.watcher.pid}`));
        if (status.watcher.uptime) {
          console.log(chalk.dim(`  Uptime: ${this.formatUptime(status.watcher.uptime)}`));
        }
        if (status.watcher.lastHeartbeat) {
          const age = Date.now() - status.watcher.lastHeartbeat;
          console.log(chalk.dim(`  Last heartbeat: ${this.formatAge(age)} ago`));
        }
      }
      console.log();

      // Guardian status
      console.log(chalk.bold('Guardian:'), this.getStatusBadge(status.guardian.running));
      if (status.guardian.running) {
        console.log(chalk.dim(`  PID: ${status.guardian.pid}`));
        if (status.guardian.uptime) {
          console.log(chalk.dim(`  Uptime: ${this.formatUptime(status.guardian.uptime)}`));
        }
      }
      console.log();

      // Memory stats (from QuadIndex)
      const memoryStats = this.getMemoryStats();
      if (memoryStats) {
        console.log(chalk.bold('Memory:'));
        console.log(chalk.dim(`  Principles: ${memoryStats.principles.toLocaleString()}`));
        console.log(chalk.dim(`  Relationships: ${memoryStats.relationships.toLocaleString()}`));
        console.log(chalk.dim(`  Hypotheticals: ${memoryStats.hypotheticals.toLocaleString()}`));
        console.log();
      }

      // Commands
      if (!status.watcher.running && !status.guardian.running) {
        console.log(chalk.dim('To start AETHER, run:'));
        console.log(chalk.cyan('  aether start'));
      } else {
        console.log(chalk.dim('Commands:'));
        console.log(chalk.cyan('  aether stop      ') + chalk.dim('- Stop all services'));
        console.log(chalk.cyan('  aether restart   ') + chalk.dim('- Restart all services'));
        console.log(chalk.cyan('  aether quad-query') + chalk.dim(' - Query memory'));
      }
      console.log();

      return Ok({
        status,
        message:
          status.watcher.running || status.guardian.running
            ? 'Services running'
            : 'Services not running',
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private getStatusBadge(running: boolean): string {
    return running ? chalk.green('✅ Running') : chalk.red('❌ Not Running');
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private formatAge(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  private getMemoryStats(): {
    principles: number;
    relationships: number;
    hypotheticals: number;
  } | null {
    try {
      const healthFile = join(this.cwd, '.aether-health.json');
      if (!existsSync(healthFile)) return null;

      const health = JSON.parse(readFileSync(healthFile, 'utf-8'));
      if (!health.stats) return null;

      return {
        principles: health.stats.principles || 0,
        relationships: health.stats.relationships || 0,
        hypotheticals: health.stats.hypotheticals || 0,
      };
    } catch {
      return null;
    }
  }
}
