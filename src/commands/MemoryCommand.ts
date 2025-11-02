/**
 * Memory Command
 * Query all 6 memory types
 */

import chalk from 'chalk';
import { MemoryRetriever } from 'lill-core';
import { join } from 'node:path';

export interface MemoryCommandOptions {
  cwd?: string;
  topK?: number;
  verbose?: boolean;
}

export class MemoryCommand {
  private readonly cwd: string;

  constructor(options?: { cwd?: string }) {
    this.cwd = options?.cwd ?? process.cwd();
  }

  async execute(type: string, query: string, options: MemoryCommandOptions = {}): Promise<void> {
    const topK = options.topK ?? 5;
    const verbose = options.verbose ?? false;

    const retriever = new MemoryRetriever({
      aicfDir: join(this.cwd, '.aicf'),
      verbose,
    });

    console.log(chalk.blue(`🔍 Querying ${type}: "${query}"`));
    console.log();

    let results;

    switch (type) {
      case 'principles':
        results = retriever.queryPrinciples(query, topK);
        break;
      case 'decisions':
        results = retriever.queryDecisions(query, topK);
        break;
      case 'profile':
        results = retriever.queryUserProfile(query, topK);
        break;
      case 'rejected':
        results = retriever.queryRejected(query, topK);
        break;
      case 'relationships':
        results = retriever.queryRelationships(query, topK);
        break;
      case 'hypotheticals':
        results = retriever.queryHypotheticals(query, topK);
        break;
      case 'all':
        results = retriever.queryAll(query, topK);
        break;
      default:
        console.log(chalk.red(`❌ Unknown memory type: ${type}`));
        console.log(
          chalk.gray(
            '   Valid types: principles, decisions, profile, rejected, relationships, hypotheticals, all'
          )
        );
        return;
    }

    if (results.length === 0) {
      console.log(chalk.yellow('❌ No results found'));
      return;
    }

    console.log(chalk.green(`✅ Found ${results.length} results:\n`));

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (!result) continue;

      const rank = i + 1;

      console.log(chalk.bold(`${rank}. [${result.type}] Score: ${result.score.toFixed(2)}`));

      // Parse and display content
      const parts = result.content.split('|');
      if (parts.length >= 2) {
        const contentParts = parts.slice(2); // Skip line number and type
        console.log(chalk.gray(`   ${contentParts.join(' | ')}`));
      } else {
        console.log(chalk.gray(`   ${result.content}`));
      }

      console.log();
    }
  }
}
