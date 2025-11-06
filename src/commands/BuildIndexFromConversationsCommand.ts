/**
 * Build Index From Conversations Command
 * Index conversations from raw JSON files to QuadIndex
 *
 * This command:
 * 1. Reads all conversations from .lill/raw/*.json
 * 2. Creates conversation nodes in QuadIndex GraphStore
 * 3. Links conversations to principles via relationships
 * 4. Enables progressive detail queries (principles → conversations)
 *
 * Use this when:
 * - After building index from Augment-Memories (Phase 1)
 * - Want to link principles to source conversations
 * - Need full conversation context for principles
 */

import { join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { QuadIndex, SnapshotManager, ConversationToQuadIndexer } from 'lill-core';

interface BuildIndexFromConversationsCommandOptions {
  cwd?: string;
  verbose?: boolean;
  force?: boolean;
  linkToPrinciples?: boolean;
}

export class BuildIndexFromConversationsCommand {
  private cwd: string;
  private verbose: boolean;
  private linkToPrinciples: boolean;
  private quadIndex: QuadIndex;
  private snapshotManager: SnapshotManager;

  constructor(options: BuildIndexFromConversationsCommandOptions = {}) {
    this.cwd = options.cwd ?? process.cwd();
    this.verbose = options.verbose ?? false;
    this.linkToPrinciples = options.linkToPrinciples ?? true;
    this.quadIndex = new QuadIndex();
    this.snapshotManager = new SnapshotManager();
  }

  async execute(): Promise<void> {
    console.log(chalk.cyan.bold('\n🔗 Building QuadIndex from Conversations...\n'));

    // Check if .lill/raw exists
    const rawDir = join(this.cwd, '.lill/raw');
    if (!existsSync(rawDir)) {
      console.log(chalk.red('❌ No raw conversations found\n'));
      console.log(chalk.yellow('   Run watcher first to capture conversations\n'));
      return;
    }

    // Restore QuadIndex from snapshot (if exists)
    const spinner = ora('Restoring QuadIndex from snapshot...').start();

    const restoreResult = await this.snapshotManager.restore(this.quadIndex, 'rolling');

    if (restoreResult.success) {
      const stats = this.quadIndex.getStats();
      spinner.succeed(
        `Restored QuadIndex (${stats.data.metadata.total} principles, ${stats.data.graph.nodes} nodes)`
      );
    } else {
      spinner.warn('No snapshot found, starting fresh');
    }

    // Index conversations
    console.log(chalk.cyan('\n📥 Indexing conversations...\n'));

    const indexer = new ConversationToQuadIndexer({
      rawDir,
      verbose: this.verbose,
      linkToPrinciples: this.linkToPrinciples,
    });

    const indexSpinner = ora('Indexing conversations...').start();

    const result = await indexer.indexAll(this.quadIndex);

    if (result.errors.length > 0) {
      indexSpinner.warn(`Indexed with ${result.errors.length} error(s)`);
      if (this.verbose) {
        console.log(chalk.yellow('\n⚠️  Errors:\n'));
        for (const error of result.errors) {
          console.log(chalk.gray(`   ${error}`));
        }
      }
    } else {
      indexSpinner.succeed('Indexed all conversations');
    }

    console.log(chalk.green(`\n✅ Indexed ${result.conversationsIndexed} conversations\n`));

    if (this.linkToPrinciples) {
      console.log(
        chalk.green(`✅ Linked ${result.principlesLinked} principle-conversation relationships\n`)
      );
    }

    // Take snapshot
    console.log(chalk.cyan('💾 Taking snapshot...\n'));

    const snapshotSpinner = ora('Saving snapshot...').start();

    const snapshotResult = await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');

    if (snapshotResult.success) {
      snapshotSpinner.succeed('Snapshot saved');
    } else {
      snapshotSpinner.fail(`Snapshot failed: ${snapshotResult.error}`);
    }

    // Show stats
    console.log(chalk.cyan('\n📊 QuadIndex Stats:\n'));

    const stats = this.quadIndex.getStats();

    console.log(chalk.white(`   Principles: ${stats.data.metadata.total}`));
    console.log(chalk.white(`   Graph nodes: ${stats.data.graph.nodes}`));
    console.log(chalk.white(`   Graph edges: ${stats.data.graph.edges}`));
    console.log(chalk.white(`   Conversations: ${result.conversationsIndexed}`));
    console.log(chalk.white(`   Relationships: ${stats.data.graph.edges}`));
    console.log(chalk.white(`   Hypotheticals: ${stats.data.reasoning.hypotheticals}`));
    console.log(chalk.white(`   Rejected: ${stats.data.reasoning.rejected}\n`));

    console.log(chalk.green('✅ Done!\n'));

    // Show example queries
    console.log(chalk.cyan('💡 Try these queries:\n'));
    console.log(chalk.gray('   aether quad-query "error handling" --include-relationships'));
    console.log(chalk.gray('   aether quad-query "Dennis preferences" --include-relationships'));
    console.log(chalk.gray('   aether quad-stats\n'));
  }
}
