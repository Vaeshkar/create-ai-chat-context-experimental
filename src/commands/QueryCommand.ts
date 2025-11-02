/**
 * Query Command
 *
 * Queries conversations using ConversationRAG
 */

import chalk from 'chalk';
import { ConversationRetriever, ConversationIndexer } from 'lill-core';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export interface QueryCommandOptions {
  cwd?: string;
  topK?: number;
  verbose?: boolean;
  type?: 'conversation' | 'decision' | 'insight';
  dateFrom?: string;
  dateTo?: string;
  reindex?: boolean;
}

export class QueryCommand {
  private readonly cwd: string;

  constructor(options?: { cwd?: string }) {
    this.cwd = options?.cwd ?? process.cwd();
  }

  async execute(queryText: string, options: QueryCommandOptions = {}): Promise<void> {
    const topK = options.topK ?? 5;
    const verbose = options.verbose ?? false;

    // Check if index exists
    const indexPath = join(this.cwd, '.lill', 'conversations', 'index.json');
    const indexExists = existsSync(indexPath);

    // Reindex if requested or if index doesn't exist
    if (options.reindex || !indexExists) {
      console.log(chalk.blue('📚 Indexing conversations...'));
      const indexer = new ConversationIndexer(this.cwd, {
        aicfDir: join(this.cwd, '.aicf'),
        storageDir: join(this.cwd, '.lill', 'conversations'),
        verbose,
      });

      const totalChunks = await indexer.indexAll();
      const stats = indexer.getStats();

      console.log(chalk.green(`✅ Indexed ${totalChunks} chunks`));
      console.log(chalk.gray(`   Conversations: ${stats.byType['conversation'] || 0}`));
      console.log(chalk.gray(`   Decisions: ${stats.byType['decision'] || 0}`));
      console.log(chalk.gray(`   Insights: ${stats.byType['insight'] || 0}`));
      console.log();
    }

    // Query conversations
    console.log(chalk.blue(`🔍 Querying: "${queryText}"`));
    console.log();

    const retriever = new ConversationRetriever(this.cwd, {
      storageDir: join(this.cwd, '.lill', 'conversations'),
      topK,
      verbose,
    });

    await retriever.loadIndex();

    // Build filters
    const filters: Record<string, string> = {};
    if (options.type) filters.type = options.type;
    if (options.dateFrom) filters.dateFrom = options.dateFrom;
    if (options.dateTo) filters.dateTo = options.dateTo;

    const results = await retriever.query(queryText, filters, topK);

    if (results.length === 0) {
      console.log(chalk.yellow('❌ No results found'));
      return;
    }

    console.log(chalk.green(`✅ Found ${results.length} results:\n`));

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (!result) continue;

      const rank = i + 1;

      console.log(chalk.bold(`${rank}. ${result.file}`));
      console.log(chalk.gray(`   Conversation ID: ${result.conversationId.substring(0, 8)}...`));
      console.log(chalk.gray(`   Timestamp: ${result.timestamp}`));
      console.log(chalk.gray(`   Score: ${result.score.toFixed(2)}`));
      console.log(chalk.gray(`   Exchanges: ${result.exchangeCount}`));
      console.log(chalk.gray(`   Tokens: ${result.tokens.toLocaleString()}`));

      // Show preview (first 200 chars)
      const preview = result.content
        .substring(0, 200)
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      console.log(chalk.gray(`   Preview: ${preview}...`));
      console.log();
    }
  }
}
