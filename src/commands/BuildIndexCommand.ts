/**
 * Build Index Command
 * Build QuadIndex from all existing conversations
 *
 * This command:
 * 1. Loads all conversations from .lill/raw/
 * 2. Processes them through ConversationWatcher extractors
 * 3. Indexes all principles to QuadIndex
 * 4. Takes a base snapshot
 *
 * Use this when:
 * - First installing AETHER (load existing conversation history)
 * - After reprocessing conversations (rebuild QuadIndex from scratch)
 * - After fixing extractors (re-extract with new logic)
 */

import { join } from 'path';
import { readdirSync, existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import {
  QuadIndex,
  SnapshotManager,
  ConceptResolver,
  type Hypothetical,
  type RejectedAlternative,
  type Principle,
} from 'lill-core';
import {
  ConversationWatcher,
  type ExtractedPrinciple,
  type ExtractedRelationship,
  type ExtractedHypothetical,
  type ExtractedRejected,
} from 'lill-core';

interface BuildIndexCommandOptions {
  cwd?: string;
  verbose?: boolean;
  force?: boolean;
}

interface ConversationFile {
  path: string;
  filename: string;
  conversationId: string;
  date: string;
}

export class BuildIndexCommand {
  private cwd: string;
  private verbose: boolean;
  private force: boolean;
  private quadIndex: QuadIndex;
  private snapshotManager: SnapshotManager;
  private conceptResolver: ConceptResolver;
  private totalPrinciples = 0;
  private totalRelationships = 0;
  private totalHypotheticals = 0;
  private totalRejected = 0;

  constructor(options: BuildIndexCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
    this.force = options.force || false;

    this.quadIndex = new QuadIndex();
    this.snapshotManager = new SnapshotManager({
      snapshotDir: join(this.cwd, '.lill', 'snapshots'),
      verbose: this.verbose,
    });
    this.conceptResolver = new ConceptResolver(this.quadIndex, {
      minConfidence: 0.5,
    });
  }

  async execute(): Promise<void> {
    console.log(chalk.blue('\n🏗️  Building QuadIndex from conversations...\n'));

    const snapshotDir = join(this.cwd, '.lill', 'snapshots', 'rolling');
    if (existsSync(snapshotDir) && readdirSync(snapshotDir).length > 0 && !this.force) {
      console.log(chalk.yellow('⚠️  QuadIndex snapshot already exists'));
      console.log(chalk.gray('   Use --force to rebuild\n'));
      return;
    }

    const spinner = ora('Finding conversation files...').start();
    const rawDir = join(this.cwd, '.lill', 'raw');

    if (!existsSync(rawDir)) {
      spinner.fail('No conversation files found');
      console.log(chalk.yellow(`\n   Directory not found: ${rawDir}`));
      console.log(chalk.gray('   Run the watcher first to collect conversations\n'));
      return;
    }

    const files = this.findConversationFiles(rawDir);

    if (files.length === 0) {
      spinner.fail('No conversation files found');
      console.log(chalk.yellow(`\n   No .json files in: ${rawDir}\n`));
      return;
    }

    spinner.succeed(`Found ${files.length} conversation file(s)`);

    console.log(chalk.cyan('\n📥 Processing conversations...\n'));

    let conversationsProcessed = 0;

    const watcher = new ConversationWatcher(this.cwd, {
      rawDir,
      verbose: this.verbose,
      onPrincipleExtracted: async (principle: ExtractedPrinciple) => {
        // Convert ExtractedPrinciple to full Principle format
        const fullPrinciple: Principle = {
          id: principle.id,
          name: principle.text, // Full text (no truncation)
          intent: principle.text,
          preconditions: [],
          postconditions: [],
          examples: [],
          counterexamples: [],
          applicable_to_models: ['all'],
          confidence: principle.confidence,
          status: 'proposed' as const,
          sources: [principle.source],
          created_at: new Date(principle.timestamp),
          updated_at: new Date(principle.timestamp),
          context: principle.conversationId,
        };

        const result = await this.quadIndex.addPrincipleAsync(fullPrinciple);
        if (result.success) {
          this.totalPrinciples++;
        }
      },
      onRelationshipExtracted: async (relationship: ExtractedRelationship) => {
        // Resolve concept names to principle IDs
        const resolved = await this.conceptResolver.resolveRelationship(
          relationship.from,
          relationship.to
        );

        if (!resolved) {
          // Cannot resolve one or both concepts - skip this relationship
          if (this.verbose) {
            console.log(
              chalk.gray(
                `   Skipped relationship (concepts not resolved): ${relationship.from} → ${relationship.to}`
              )
            );
          }
          return;
        }

        // Index relationship using resolved principle IDs
        const result = this.quadIndex.addRelationship(
          resolved.from, // Principle ID
          resolved.to, // Principle ID
          relationship.type,
          relationship.reason,
          relationship.evidence,
          relationship.strength * resolved.confidence // Adjust strength by resolution confidence
        );

        if (result.success) {
          this.totalRelationships++;
          if (this.verbose) {
            console.log(
              chalk.gray(
                `   Indexed relationship: ${resolved.from} → ${resolved.to} (from: ${relationship.from} → ${relationship.to})`
              )
            );
          }
        }
      },
      onHypotheticalExtracted: async (hypothetical: ExtractedHypothetical) => {
        // Convert ExtractedHypothetical to Hypothetical format
        const fullHypothetical: Hypothetical = {
          id: hypothetical.id,
          question: hypothetical.scenario,
          alternatives: [
            {
              option: hypothetical.expectedOutcome,
              status: 'deferred',
              reason: hypothetical.reasoning,
              confidence: hypothetical.confidence,
            },
          ],
          status: 'deferred',
          evidence: hypothetical.conversationId,
          created_at: new Date(hypothetical.timestamp),
          updated_at: new Date(hypothetical.timestamp),
        };

        const result = await this.quadIndex.addHypothetical(fullHypothetical);
        if (result.success) {
          this.totalHypotheticals++;
        }
      },
      onRejectedExtracted: async (rejected: ExtractedRejected) => {
        // Convert ExtractedRejected to RejectedAlternative format
        const fullRejected: RejectedAlternative = {
          id: rejected.id,
          option: rejected.alternative,
          reason: rejected.reason,
          evidence: rejected.conversationId,
          relatedDecision: rejected.principleId,
          created_at: new Date(rejected.timestamp),
        };

        const result = await this.quadIndex.addRejected(fullRejected);
        if (result.success) {
          this.totalRejected++;
        }
      },
      onConversationProcessed: (conversationId, stats) => {
        conversationsProcessed++;
        console.log(
          chalk.gray(
            `   [${conversationsProcessed}/${files.length}] ${conversationId.substring(0, 8)}... (${stats.principles} principles, ${stats.decisions} decisions)`
          )
        );
      },
    });

    // Start watcher to process all existing files, then stop
    const startResult = await watcher.start();
    if (!startResult.ok) {
      console.log(chalk.red(`\n❌ Failed to start watcher: ${startResult.error.message}\n`));
      return;
    }

    // Stop immediately (we only want to process existing files once)
    await watcher.stop();

    console.log(chalk.cyan('\n💾 Creating base snapshot...\n'));

    const snapshotSpinner = ora('Taking snapshot...').start();
    const snapshotResult = await this.snapshotManager.takeSnapshot(this.quadIndex, 'rolling');

    if (!snapshotResult.success) {
      snapshotSpinner.fail('Failed to create snapshot');
      console.log(chalk.red(`\n   Error: ${snapshotResult.error}\n`));
      return;
    }

    snapshotSpinner.succeed('Base snapshot created');

    console.log(chalk.blue('\n✅ QuadIndex built successfully!\n'));
    console.log(chalk.gray('   📊 Summary:'));
    console.log(chalk.gray(`      Conversations: ${conversationsProcessed}`));
    console.log(chalk.gray(`      Principles: ${this.totalPrinciples}`));
    console.log(chalk.gray(`      Relationships: ${this.totalRelationships}`));
    console.log(chalk.gray(`      Hypotheticals: ${this.totalHypotheticals}`));
    console.log(chalk.gray(`      Rejected: ${this.totalRejected}`));
    console.log(chalk.gray(`      Snapshot: ${snapshotResult.data}\n`));

    console.log(chalk.green('   🎯 QuadIndex is ready!'));
    console.log(chalk.gray('   Start the watcher to continue collecting data:\n'));
    console.log(chalk.cyan('      aether watch-terminal\n'));
  }

  private findConversationFiles(rawDir: string): ConversationFile[] {
    const files: ConversationFile[] = [];

    try {
      const entries = readdirSync(rawDir);

      for (const entry of entries) {
        if (entry.endsWith('.backup.json')) {
          continue;
        }

        if (!entry.endsWith('.json')) {
          continue;
        }

        const filepath = join(rawDir, entry);

        const match = entry.match(/^(\d{4}-\d{2}-\d{2})_([a-f0-9-]+)\.json$/);
        if (!match || !match[1] || !match[2]) {
          if (this.verbose) {
            console.log(chalk.yellow(`   Skipping invalid filename: ${entry}`));
          }
          continue;
        }

        const date = match[1];
        const conversationId = match[2];

        files.push({
          path: filepath,
          filename: entry,
          conversationId,
          date,
        });
      }

      files.sort((a, b) => a.date.localeCompare(b.date));

      return files;
    } catch (error) {
      console.error(chalk.red('Error reading directory:'), error);
      return [];
    }
  }
}
