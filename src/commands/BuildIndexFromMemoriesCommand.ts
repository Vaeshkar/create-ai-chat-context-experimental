/**
 * Build Index From Memories Command
 * Build QuadIndex from Augment-Memories files (distilled insights)
 *
 * This command:
 * 1. Finds all Augment-Memories files in VSCode workspace storage
 * 2. Parses distilled insights from markdown format
 * 3. Indexes all insights to QuadIndex as principles
 * 4. Takes a base snapshot
 *
 * Use this when:
 * - First installing AETHER (load existing distilled knowledge)
 * - After Augment updates memories (rebuild QuadIndex from latest)
 * - Want clean principles (no conversation noise)
 */

import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { QuadIndex, SnapshotManager, type Principle } from 'lill-core';
import { AugmentMemoriesParser, type AugmentMemoriesResult } from 'aicf-core';

interface BuildIndexFromMemoriesCommandOptions {
  cwd?: string;
  verbose?: boolean;
  force?: boolean;
}

export class BuildIndexFromMemoriesCommand {
  private cwd: string;
  private verbose: boolean;
  private force: boolean;
  private quadIndex: QuadIndex;
  private snapshotManager: SnapshotManager;
  private totalPrinciples = 0;

  constructor(options: BuildIndexFromMemoriesCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
    this.force = options.force || false;

    this.quadIndex = new QuadIndex();
    this.snapshotManager = new SnapshotManager({
      snapshotDir: join(this.cwd, '.lill', 'snapshots'),
      verbose: this.verbose,
    });
  }

  async execute(): Promise<void> {
    console.log(chalk.blue('\n🧠 Building QuadIndex from Augment-Memories...\n'));

    const snapshotDir = join(this.cwd, '.lill', 'snapshots', 'rolling');
    if (existsSync(snapshotDir) && readdirSync(snapshotDir).length > 0 && !this.force) {
      console.log(chalk.yellow('⚠️  QuadIndex snapshot already exists'));
      console.log(chalk.gray('   Use --force to rebuild\n'));
      return;
    }

    const spinner = ora('Finding Augment-Memories files...').start();

    const parser = new AugmentMemoriesParser(this.verbose);
    const memoryFiles = parser.findMemoryFiles();

    if (memoryFiles.length === 0) {
      spinner.fail('No Augment-Memories files found');
      console.log(chalk.yellow('\n   No Augment-Memories files in VSCode workspace storage'));
      console.log(chalk.gray('   Augment needs to create memories first\n'));
      return;
    }

    spinner.succeed(`Found ${memoryFiles.length} Augment-Memories file(s)`);

    console.log(chalk.cyan('\n📥 Parsing memories...\n'));

    const results = parser.parseAll();
    const totalItems = results.reduce(
      (sum: number, r: AugmentMemoriesResult) => sum + r.totalItems,
      0
    );

    if (totalItems === 0) {
      console.log(chalk.yellow('⚠️  No memory items found'));
      console.log(chalk.gray('   All Augment-Memories files are empty\n'));
      return;
    }

    console.log(
      chalk.green(`✅ Parsed ${totalItems} memory items from ${results.length} workspace(s)\n`)
    );

    console.log(chalk.cyan('📊 Indexing to QuadIndex...\n'));

    // Index all memory items as principles
    for (const result of results) {
      for (const section of result.sections) {
        for (const item of section.items) {
          const principle: Principle = {
            id: `memory-${result.workspaceId}-${this.totalPrinciples}`,
            name: item.text,
            intent: item.text,
            preconditions: [],
            postconditions: [],
            examples: [],
            counterexamples: [],
            applicable_to_models: ['all'],
            confidence: item.confidence,
            status: 'validated' as const, // Augment-Memories are already validated
            sources: [`augment-memories:${result.workspaceId}`],
            created_at: result.lastModified,
            updated_at: result.lastModified,
            context: section.category, // Use section category as context
          };

          const addResult = this.quadIndex.addPrinciple(principle);
          if (addResult.success) {
            this.totalPrinciples++;

            if (this.verbose) {
              const preview =
                item.text.length > 80 ? item.text.substring(0, 80) + '...' : item.text;
              console.log(chalk.gray(`   [${item.confidence.toFixed(2)}] ${preview}`));
            }
          }
        }
      }
    }

    console.log(chalk.green(`\n✅ Indexed ${this.totalPrinciples} principles\n`));

    // Take snapshot
    console.log(chalk.cyan('💾 Taking snapshot...\n'));

    const snapshotResult = await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');

    if (snapshotResult.success) {
      console.log(chalk.green('✅ Snapshot saved\n'));

      // Show stats
      const stats = this.quadIndex.getStats();
      console.log(chalk.cyan('📊 QuadIndex Stats:\n'));
      console.log(chalk.gray(`   Principles: ${stats.data.metadata.total}`));
      console.log(chalk.gray(`   Vector embeddings: ${stats.data.vector.indexed}`));
      console.log(chalk.gray(`   Relationships: ${stats.data.graph.edges}`));
      console.log(chalk.gray(`   Hypotheticals: ${stats.data.reasoning.hypotheticals}`));
      console.log(chalk.gray(`   Rejected: ${stats.data.reasoning.rejected}\n`));

      console.log(chalk.green('✅ QuadIndex built successfully!\n'));
    } else {
      console.log(chalk.red(`❌ Failed to save snapshot: ${snapshotResult.error}\n`));
    }
  }
}
