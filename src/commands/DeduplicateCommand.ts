/**
 * Deduplicate Command
 * Clean up duplicate principles in QuadIndex
 */

import chalk from 'chalk';
import { QuadIndex, SnapshotManager } from 'lill-core';
import { DeduplicationAgent } from 'lill-meta';

export interface DeduplicateOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

export class DeduplicateCommand {
  private dryRun: boolean;
  private verbose: boolean;

  constructor(options: DeduplicateOptions = {}) {
    this.dryRun = options.dryRun ?? false;
    this.verbose = options.verbose ?? false;
  }

  async execute(): Promise<void> {
    console.log(chalk.cyan('\n🧹 AETHER Deduplication Agent\n'));

    if (this.dryRun) {
      console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made\n'));
    }

    try {
      // Load QuadIndex from snapshot
      console.log('📂 Loading QuadIndex from snapshot...');
      const quadIndex = new QuadIndex();
      const snapshotManager = new SnapshotManager();

      await snapshotManager.restore(quadIndex, 'rolling');

      const statsBefore = quadIndex.getStats();
      if (!statsBefore.success || !statsBefore.data) {
        console.error(chalk.red('❌ Failed to get QuadIndex stats:'), statsBefore.error);
        return;
      }

      console.log(chalk.gray(`   Loaded ${statsBefore.data.metadata.total} principles\n`));

      // Run deduplication
      console.log('🔍 Analyzing duplicates...\n');
      const agent = new DeduplicationAgent(quadIndex);
      const result = await agent.deduplicate({
        dryRun: this.dryRun,
        verbose: this.verbose,
      });

      // Display results
      if (result.success) {
        console.log(chalk.green('\n✅ Deduplication complete!\n'));
        console.log(chalk.gray(`   Duplicate groups found: ${result.duplicateGroups}`));
        console.log(chalk.gray(`   Principles merged: ${result.principlesMerged}`));
        console.log(chalk.gray(`   Principles removed: ${result.principlesRemoved}`));

        if (!this.dryRun && result.principlesRemoved > 0) {
          // Save snapshot
          console.log('\n💾 Saving snapshot...');
          await snapshotManager.takeSnapshot(quadIndex, 'rolling');

          const statsAfter = quadIndex.getStats();
          if (statsAfter.success && statsAfter.data) {
            console.log(
              chalk.gray(
                `   Principles: ${statsBefore.data.metadata.total} → ${statsAfter.data.metadata.total}`
              )
            );
            console.log(
              chalk.gray(
                `   Space saved: ${((result.principlesRemoved / statsBefore.data.metadata.total) * 100).toFixed(1)}%`
              )
            );
          }

          console.log(chalk.green('\n✅ Snapshot saved!'));
        } else if (this.dryRun) {
          console.log(chalk.yellow('\n⚠️  DRY RUN - Run without --dry-run to apply changes'));
        }
      } else {
        console.error(chalk.red('\n❌ Deduplication failed!\n'));
        for (const error of result.errors) {
          console.error(chalk.red(`   • ${error}`));
        }
      }
    } catch (error) {
      console.error(
        chalk.red('\n❌ Deduplication failed:'),
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }
}
