/**
 * ValidateCommand - Validate principles and increase confidence
 *
 * Allows explicit validation of principles:
 * - Mark principles as "validated" status
 * - Increase confidence score
 * - Track validation history
 */

import chalk from 'chalk';
import { QuadIndex } from 'lill-core';
import { SnapshotManager } from 'lill-core';

export interface ValidateCommandOptions {
  cwd: string;
  verbose?: boolean;
  confidence?: number; // New confidence score (0.0-1.0)
  reason?: string; // Reason for validation
}

export class ValidateCommand {
  private quadIndex: QuadIndex;
  private snapshotManager: SnapshotManager;

  constructor(_options: ValidateCommandOptions) {
    this.quadIndex = new QuadIndex();
    this.snapshotManager = new SnapshotManager();
  }

  async execute(principleId: string, options: ValidateCommandOptions): Promise<void> {
    try {
      // Step 1: Load QuadIndex from snapshot
      if (options.verbose) {
        console.log(chalk.blue('📚 Loading QuadIndex from snapshot...'));
      }

      const restoreResult = await this.snapshotManager.restore(this.quadIndex, 'rolling');
      if (!restoreResult.success) {
        console.error(chalk.red('❌ Failed to load QuadIndex:'), restoreResult.error);
        process.exit(1);
      }

      if (options.verbose) {
        const stats = this.quadIndex.getStats();
        console.log(chalk.gray(`   Loaded ${stats.data.metadata.total} principles`));
        console.log();
      }

      // Step 2: Find the principle
      const principle = this.quadIndex.getPrinciple(principleId);
      if (!principle.success || !principle.data) {
        console.error(chalk.red(`❌ Principle not found: ${principleId}`));
        process.exit(1);
      }

      const currentPrinciple = principle.data;

      if (options.verbose) {
        console.log(chalk.blue(`🔍 Found principle: ${currentPrinciple.name}`));
        console.log(chalk.gray(`   Current status: ${currentPrinciple.status}`));
        console.log(
          chalk.gray(`   Current confidence: ${(currentPrinciple.confidence * 100).toFixed(0)}%`)
        );
        console.log();
      }

      // Step 3: Update principle
      const newConfidence =
        options.confidence !== undefined
          ? Math.max(0.1, Math.min(1.0, options.confidence))
          : Math.min(1.0, currentPrinciple.confidence + 0.1); // Default: +10%

      const updatedPrinciple = {
        ...currentPrinciple,
        status: 'validated' as const,
        confidence: newConfidence,
        updated_at: new Date(),
      };

      // Remove old principle
      const removeResult = this.quadIndex.removePrinciple(principleId);
      if (!removeResult.success) {
        console.error(chalk.red('❌ Failed to remove old principle:'), removeResult.error);
        process.exit(1);
      }

      // Add updated principle
      const addResult = this.quadIndex.addPrinciple(updatedPrinciple);
      if (!addResult.success) {
        console.error(chalk.red('❌ Failed to add updated principle:'), addResult.error);
        process.exit(1);
      }

      // Step 4: Save snapshot
      if (options.verbose) {
        console.log(chalk.blue('💾 Saving snapshot...'));
      }

      const snapshotResult = await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');

      if (!snapshotResult.success) {
        console.error(chalk.red('❌ Failed to save snapshot:'), snapshotResult.error);
        process.exit(1);
      }

      // Step 5: Success!
      console.log(chalk.green('✅ Principle validated successfully!'));
      console.log();
      console.log(chalk.bold(`${principleId}: ${updatedPrinciple.name}`));
      console.log(chalk.gray(`   Status: ${currentPrinciple.status} → ${updatedPrinciple.status}`));
      console.log(
        chalk.gray(
          `   Confidence: ${(currentPrinciple.confidence * 100).toFixed(0)}% → ${(updatedPrinciple.confidence * 100).toFixed(0)}%`
        )
      );

      if (options.reason) {
        console.log(chalk.gray(`   Reason: ${options.reason}`));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  /**
   * Validate multiple principles at once
   */
  async executeBatch(principleIds: string[], options: ValidateCommandOptions): Promise<void> {
    try {
      // Step 1: Load QuadIndex from snapshot
      if (options.verbose) {
        console.log(chalk.blue('📚 Loading QuadIndex from snapshot...'));
      }

      const restoreResult = await this.snapshotManager.restore(this.quadIndex, 'rolling');
      if (!restoreResult.success) {
        console.error(chalk.red('❌ Failed to load QuadIndex:'), restoreResult.error);
        process.exit(1);
      }

      if (options.verbose) {
        const stats = this.quadIndex.getStats();
        console.log(chalk.gray(`   Loaded ${stats.data.metadata.total} principles`));
        console.log();
      }

      // Step 2: Validate each principle
      let validated = 0;
      let failed = 0;

      for (const principleId of principleIds) {
        const principle = this.quadIndex.getPrinciple(principleId);
        if (!principle.success || !principle.data) {
          console.error(chalk.red(`❌ Principle not found: ${principleId}`));
          failed++;
          continue;
        }

        const currentPrinciple = principle.data;
        const newConfidence =
          options.confidence !== undefined
            ? Math.max(0.1, Math.min(1.0, options.confidence))
            : Math.min(1.0, currentPrinciple.confidence + 0.1);

        const updatedPrinciple = {
          ...currentPrinciple,
          status: 'validated' as const,
          confidence: newConfidence,
          updated_at: new Date(),
        };

        // Remove old principle
        const removeResult = this.quadIndex.removePrinciple(principleId);
        if (!removeResult.success) {
          console.error(chalk.red(`❌ Failed to remove ${principleId}:`), removeResult.error);
          failed++;
          continue;
        }

        // Add updated principle
        const addResult = this.quadIndex.addPrinciple(updatedPrinciple);
        if (!addResult.success) {
          console.error(chalk.red(`❌ Failed to add updated ${principleId}:`), addResult.error);
          failed++;
          continue;
        }

        validated++;
        console.log(
          chalk.green(
            `✅ ${principleId}: ${(currentPrinciple.confidence * 100).toFixed(0)}% → ${(updatedPrinciple.confidence * 100).toFixed(0)}%`
          )
        );
      }

      // Step 3: Save snapshot
      if (validated > 0) {
        if (options.verbose) {
          console.log();
          console.log(chalk.blue('💾 Saving snapshot...'));
        }

        const snapshotResult = await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');

        if (!snapshotResult.success) {
          console.error(chalk.red('❌ Failed to save snapshot:'), snapshotResult.error);
          process.exit(1);
        }
      }

      // Step 4: Summary
      console.log();
      console.log(chalk.bold('📊 Validation Summary:'));
      console.log(chalk.green(`   ✅ Validated: ${validated}`));
      if (failed > 0) {
        console.log(chalk.red(`   ❌ Failed: ${failed}`));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}
