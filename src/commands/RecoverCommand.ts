/**
 * Recover Command (Task 4e: Fallback Recovery)
 * Rebuilds QuadIndex from raw JSON conversation files if snapshots are corrupted
 *
 * NOTE: AICF files (.aicf/*.aicf) are legacy and no longer used.
 * This command ONLY recovers from .aicf/raw/*.json files (conversation exports from LLM platforms).
 */

import chalk from 'chalk';
import ora from 'ora';
import { QuadIndex, SnapshotManager } from 'lill-core';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import type { Principle } from 'lill-core';

export interface RecoverCommandOptions {
  cwd?: string;
  verbose?: boolean;
}

/**
 * Recover Command
 * Rebuilds QuadIndex from raw JSON conversation files
 */
export class RecoverCommand {
  private readonly cwd: string;
  private readonly verbose: boolean;
  private readonly rawDir: string;
  private readonly snapshotDir: string;

  constructor(options: RecoverCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
    this.rawDir = join(this.cwd, '.aicf', 'raw');
    this.snapshotDir = join(this.cwd, '.lill', 'snapshots');
  }

  /**
   * Recover QuadIndex from raw JSON conversation files
   */
  async execute(): Promise<Result<void>> {
    const spinner = ora('Recovering QuadIndex from raw JSON files...').start();

    try {
      // Check if raw directory exists
      if (!existsSync(this.rawDir)) {
        spinner.fail('Raw JSON directory not found (.aicf/raw/)');
        return Err(new Error('Raw JSON directory not found'));
      }

      // Create new QuadIndex
      const quadIndex = new QuadIndex();

      // Recover from raw JSON files
      spinner.text = 'Extracting principles from conversation files...';
      await this.recoverFromRawJSON(quadIndex, spinner);

      // Take snapshot
      spinner.text = 'Saving snapshot...';
      const snapshotManager = new SnapshotManager({
        snapshotDir: this.snapshotDir,
        verbose: this.verbose,
      });

      const snapshotResult = await snapshotManager.takeSnapshot(quadIndex, 'rolling');
      if (!snapshotResult.success) {
        spinner.fail('Failed to save snapshot');
        return Err(new Error(snapshotResult.error || 'Unknown error'));
      }

      // Get final stats
      const stats = quadIndex.getStats();

      spinner.succeed('Recovery complete');
      console.log();
      console.log(chalk.cyan('📊 Recovery Summary:'));
      console.log(chalk.gray(`   Principles: ${stats.data.metadata.total}`));
      console.log(chalk.gray(`   Relationships: ${stats.data.graph.edges}`));
      console.log(chalk.gray(`   Hypotheticals: ${stats.data.reasoning.hypotheticals}`));
      console.log(chalk.gray(`   Rejected: ${stats.data.reasoning.rejected}`));
      console.log(chalk.gray(`   Snapshot: ${snapshotResult.data}`));
      console.log();

      return Ok(undefined);
    } catch (error) {
      spinner.fail('Recovery failed');
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Recover from raw JSON files (standard path for all users)
   * Extracts principles from conversation JSON files
   */
  private async recoverFromRawJSON(
    quadIndex: QuadIndex,
    spinner: { text: string; info: (msg: string) => void; warn: (msg: string) => void }
  ): Promise<void> {
    if (!existsSync(this.rawDir)) {
      spinner.warn('No raw JSON files found');
      return;
    }

    const { readdirSync } = await import('fs');
    const files = readdirSync(this.rawDir).filter((f) => f.endsWith('.json'));

    if (files.length === 0) {
      spinner.warn('No JSON files found in .aicf/raw/');
      return;
    }

    spinner.info(`Found ${files.length} conversation files`);

    let totalPrinciples = 0;
    let totalDecisions = 0;

    for (const file of files) {
      const filepath = join(this.rawDir, file);
      spinner.text = `Processing ${file}...`;

      try {
        const content = readFileSync(filepath, 'utf-8');
        const conversation = JSON.parse(content);

        // Extract principles from decisions
        if (conversation.decisions && Array.isArray(conversation.decisions)) {
          for (const decision of conversation.decisions) {
            // Convert decision to principle
            const principle: Principle = {
              id: decision.id || `P${Date.now()}`,
              name: decision.decision || 'Unnamed decision',
              intent: decision.reasoning || decision.decision || '',
              preconditions: [],
              postconditions: [],
              examples: [],
              counterexamples: [],
              applicable_to_models: ['claude-sonnet-4.5'],
              confidence:
                decision.impact === 'HIGH' ? 0.9 : decision.impact === 'MEDIUM' ? 0.7 : 0.5,
              status: decision.status === 'IMPLEMENTED' ? 'validated' : 'active',
              sources: [conversation.metadata?.conversationId || file],
              created_at: new Date(decision.timestamp || Date.now()),
              updated_at: new Date(decision.timestamp || Date.now()),
            };

            quadIndex.addPrinciple(principle);
            totalPrinciples++;
          }
          totalDecisions += conversation.decisions.length;
        }

        // Extract principles from key_exchanges
        if (conversation.key_exchanges && Array.isArray(conversation.key_exchanges)) {
          for (const exchange of conversation.key_exchanges) {
            if (exchange.outcome) {
              const principle: Principle = {
                id: `P${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: exchange.outcome,
                intent: exchange.assistant_action || exchange.outcome,
                preconditions: [],
                postconditions: [],
                examples: [],
                counterexamples: [],
                applicable_to_models: ['claude-sonnet-4.5'],
                confidence: 0.6,
                status: 'active',
                sources: [conversation.metadata?.conversationId || file],
                created_at: new Date(exchange.timestamp || Date.now()),
                updated_at: new Date(exchange.timestamp || Date.now()),
              };

              quadIndex.addPrinciple(principle);
              totalPrinciples++;
            }
          }
        }
      } catch (error) {
        if (this.verbose) {
          spinner.warn(`Failed to process ${file}: ${error}`);
        }
      }
    }

    spinner.info(`Extracted ${totalPrinciples} principles from ${totalDecisions} decisions`);
  }
}
