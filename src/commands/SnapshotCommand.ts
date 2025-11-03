/**
 * Snapshot Command
 * Manages QuadIndex snapshots (rolling and golden)
 */

import chalk from 'chalk';
import ora from 'ora';
import { QuadIndex, SnapshotManager } from 'lill-core';
import { join } from 'path';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

export interface SnapshotCommandOptions {
  cwd?: string;
  verbose?: boolean;
}

/**
 * Snapshot Command
 * Provides CLI interface for snapshot management
 */
export class SnapshotCommand {
  private readonly cwd: string;
  private readonly verbose: boolean;
  private readonly snapshotDir: string;

  constructor(options: SnapshotCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
    this.snapshotDir = join(this.cwd, '.lill', 'snapshots');
  }

  /**
   * Take a snapshot (rolling or golden)
   */
  async take(type: 'rolling' | 'golden' = 'rolling'): Promise<Result<void>> {
    const spinner = ora(`Taking ${type} snapshot...`).start();

    try {
      // Load QuadIndex from latest snapshot (if exists)
      const quadIndex = new QuadIndex();
      const snapshotManager = new SnapshotManager({
        snapshotDir: this.snapshotDir,
        verbose: this.verbose,
      });

      // Try to restore from latest snapshot first
      const restoreResult = await snapshotManager.restore(quadIndex, type);
      if (!restoreResult.success && this.verbose) {
        spinner.info('No existing snapshot found, creating new one');
      }

      // Take new snapshot
      const result = await snapshotManager.takeSnapshot(quadIndex, type);

      if (!result.success) {
        spinner.fail(`Failed to take ${type} snapshot`);
        return Err(new Error(result.error || 'Unknown error'));
      }

      spinner.succeed(`${type} snapshot saved: ${result.data}`);
      return Ok(undefined);
    } catch (error) {
      spinner.fail(`Error taking ${type} snapshot`);
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * List all snapshots
   */
  async list(): Promise<Result<void>> {
    try {
      const snapshotManager = new SnapshotManager({
        snapshotDir: this.snapshotDir,
        verbose: this.verbose,
      });

      const rollingSnapshots = await snapshotManager.listSnapshots('rolling');
      const goldenSnapshots = await snapshotManager.listSnapshots('golden');

      console.log(chalk.cyan('\n📸 Snapshots\n'));

      console.log(chalk.bold('Rolling Snapshots:'));
      if (rollingSnapshots.length === 0) {
        console.log(chalk.gray('  (none)'));
      } else {
        for (const snapshot of rollingSnapshots) {
          console.log(
            chalk.green(`  ✓ ${snapshot.timestamp.toISOString()}`),
            chalk.gray(
              `(${snapshot.stats.principles} principles, ${this.formatBytes(snapshot.size)})`
            )
          );
        }
      }

      console.log();
      console.log(chalk.bold('Golden Snapshots:'));
      if (goldenSnapshots.length === 0) {
        console.log(chalk.gray('  (none)'));
      } else {
        for (const snapshot of goldenSnapshots) {
          console.log(
            chalk.yellow(`  ⭐ ${snapshot.timestamp.toISOString()}`),
            chalk.gray(
              `(${snapshot.stats.principles} principles, ${this.formatBytes(snapshot.size)})`
            )
          );
        }
      }

      console.log();
      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Restore from snapshot
   */
  async restore(type: 'rolling' | 'golden' = 'rolling'): Promise<Result<void>> {
    const spinner = ora(`Restoring from ${type} snapshot...`).start();

    try {
      const quadIndex = new QuadIndex();
      const snapshotManager = new SnapshotManager({
        snapshotDir: this.snapshotDir,
        verbose: this.verbose,
      });

      const result = await snapshotManager.restore(quadIndex, type);

      if (!result.success) {
        spinner.fail(`Failed to restore from ${type} snapshot`);
        return Err(new Error(result.error || 'Unknown error'));
      }

      const stats = quadIndex.getStats();
      spinner.succeed(`Restored from ${type} snapshot`);
      console.log(chalk.gray(`  Principles: ${stats.data.metadata.total}`));
      console.log(chalk.gray(`  Relationships: ${stats.data.graph.edges}`));
      console.log(chalk.gray(`  Hypotheticals: ${stats.data.reasoning.hypotheticals}`));

      return Ok(undefined);
    } catch (error) {
      spinner.fail(`Error restoring from ${type} snapshot`);
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get snapshot stats
   */
  async stats(): Promise<Result<void>> {
    try {
      const snapshotManager = new SnapshotManager({
        snapshotDir: this.snapshotDir,
        verbose: this.verbose,
      });

      const rollingSnapshots = await snapshotManager.listSnapshots('rolling');
      const goldenSnapshots = await snapshotManager.listSnapshots('golden');

      const totalRollingSize = rollingSnapshots.reduce((sum, s) => sum + s.size, 0);
      const totalGoldenSize = goldenSnapshots.reduce((sum, s) => sum + s.size, 0);

      console.log(chalk.cyan('\n📊 Snapshot Statistics\n'));
      console.log(chalk.bold('Rolling Snapshots:'));
      console.log(chalk.gray(`  Count: ${rollingSnapshots.length}`));
      console.log(chalk.gray(`  Total Size: ${this.formatBytes(totalRollingSize)}`));
      console.log();
      console.log(chalk.bold('Golden Snapshots:'));
      console.log(chalk.gray(`  Count: ${goldenSnapshots.length}`));
      console.log(chalk.gray(`  Total Size: ${this.formatBytes(totalGoldenSize)}`));
      console.log();
      console.log(chalk.bold('Total:'));
      console.log(chalk.gray(`  Count: ${rollingSnapshots.length + goldenSnapshots.length}`));
      console.log(
        chalk.gray(`  Total Size: ${this.formatBytes(totalRollingSize + totalGoldenSize)}`)
      );
      console.log();

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
