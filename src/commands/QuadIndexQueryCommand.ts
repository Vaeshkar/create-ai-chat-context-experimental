/**
 * QuadIndex Query Command
 * Query QuadIndex (4 stores: Vector, Metadata, Graph, Reasoning)
 */

import chalk from 'chalk';
import { QuadIndex, SnapshotManager, type Principle, type PrincipleStatus } from 'lill-core';
import { join } from 'node:path';
import type { QuadQuery, QuadRetrievalResult } from '../types/quad-index.js';

export interface QuadIndexQueryOptions {
  cwd?: string;
  store?: 'vector' | 'metadata' | 'graph' | 'reasoning';
  limit?: number;
  minConfidence?: number;
  status?: string;
  includeRelationships?: boolean;
  maxIterations?: number;
  models?: string[];
  offset?: number;
  verbose?: boolean;
  json?: boolean; // Output as JSON for AI consumption
}

export class QuadIndexQueryCommand {
  private readonly cwd: string;
  private quadIndex: QuadIndex;
  private snapshotManager: SnapshotManager;

  constructor(options?: { cwd?: string }) {
    this.cwd = options?.cwd ?? process.cwd();
    this.quadIndex = new QuadIndex();
    this.snapshotManager = new SnapshotManager({
      snapshotDir: join(this.cwd, '.lill', 'snapshots'),
      verbose: false,
    });
  }

  async execute(queryText: string, options: QuadIndexQueryOptions = {}): Promise<void> {
    try {
      // Step 1: Load QuadIndex from snapshot
      if (!options.json && options.verbose) {
        console.log(chalk.blue('📚 Loading QuadIndex from snapshot...'));
      }

      const restoreResult = await this.snapshotManager.restore(this.quadIndex, 'rolling');
      if (!restoreResult.success) {
        // Try golden snapshot
        const goldenResult = await this.snapshotManager.restore(this.quadIndex, 'golden');
        if (!goldenResult.success) {
          if (options.json) {
            this.outputJsonError('No snapshots found. Run watcher first to collect data.');
          } else {
            console.error(chalk.red('❌ No snapshots found'));
            console.log(chalk.gray('   Run: aether watch-terminal'));
          }
          process.exit(1);
        }
      }

      // Step 2: Build query
      const query = this.buildQuery(queryText, options);

      // Step 3: Execute query
      if (!options.json && options.verbose) {
        console.log(chalk.blue(`🔍 Querying ${options.store || 'vector'} store: "${queryText}"`));
        console.log();
      }

      const result = await this.quadIndex.searchAsync(query);

      // Step 4: Output results
      if (result.success && result.data) {
        if (options.json) {
          this.outputJson(result.data, options);
        } else {
          this.outputHuman(result.data, options);
        }
      } else {
        if (options.json) {
          this.outputJsonError(result.error || 'Query failed');
        } else {
          console.error(chalk.red('❌ Query failed:'), result.error);
        }
        process.exit(1);
      }
    } catch (error) {
      if (options.json) {
        this.outputJsonError(error instanceof Error ? error.message : String(error));
      } else {
        console.error(
          chalk.red('❌ Error:'),
          error instanceof Error ? error.message : String(error)
        );
      }
      process.exit(1);
    }
  }

  private buildQuery(text: string, options: QuadIndexQueryOptions): QuadQuery {
    // QuadQuery extends PrincipleQuery, so we can set all properties directly
    const query: QuadQuery = {
      text,
      limit: options.limit || 5,
      offset: options.offset || 0,
    };

    // Add metadata filters
    if (options.minConfidence !== undefined) {
      query.minConfidence = options.minConfidence;
    }

    if (options.status) {
      query.status = options.status as PrincipleStatus;
    }

    if (options.models && options.models.length > 0) {
      query.models = options.models;
    }

    // Add store-specific options
    switch (options.store) {
      case 'vector':
        // Vector search is default
        break;

      case 'metadata':
        // Metadata search uses filters (already added above)
        break;

      case 'graph':
        query.includeRelationships = true;
        query.relationshipDepth = 2;
        break;

      case 'reasoning':
        query.includeReasoning = true;
        query.reasoningIterations = options.maxIterations || 3;
        break;

      default:
        // Default: vector search with optional relationships
        if (options.includeRelationships) {
          query.includeRelationships = true;
        }
    }

    return query as QuadQuery;
  }

  private outputHuman(data: QuadRetrievalResult, options: QuadIndexQueryOptions): void {
    if (data.principles.length === 0) {
      console.log(chalk.yellow('❌ No results found'));
      return;
    }

    console.log(chalk.green(`✅ Found ${data.total} principle(s):\n`));

    for (let i = 0; i < data.principles.length; i++) {
      const principle = data.principles[i];
      if (!principle) continue; // Skip if undefined (shouldn't happen but satisfies TypeScript)

      const score = data.scores[i] || 0;

      console.log(chalk.bold(`${i + 1}. ${principle.id}: ${principle.name}`));
      console.log(chalk.gray(`   Intent: ${principle.intent}`));
      console.log(chalk.gray(`   Status: ${principle.status}`));
      console.log(
        chalk.gray(
          `   Confidence: ${(principle.confidence * 100).toFixed(0)}% | Score: ${(score * 100).toFixed(0)}%`
        )
      );

      if (options.verbose && principle.sources && principle.sources.length > 0) {
        console.log(chalk.gray(`   Source: ${principle.sources[0]}`));
      }

      console.log();
    }

    // Show relationships if included
    if (data.relationships && data.relationships.length > 0) {
      console.log(chalk.blue(`🔗 Relationships (${data.relationships.length}):\n`));
      for (const rel of data.relationships) {
        console.log(chalk.gray(`   ${rel.from} --[${rel.type}]--> ${rel.to}`));
      }
      console.log();
    }

    // Show reasoning if included
    if (data.reasoning) {
      console.log(chalk.blue('🧠 Reasoning:\n'));
      console.log(chalk.gray(`   Query: ${data.reasoning.query}`));
      console.log(chalk.gray(`   Conclusion: ${data.reasoning.conclusion}`));
      console.log(chalk.gray(`   Confidence: ${(data.reasoning.confidence * 100).toFixed(0)}%`));
      console.log(chalk.gray(`   Iterations: ${data.reasoning.iterations}`));

      if (data.reasoning.alternatives && data.reasoning.alternatives.length > 0) {
        console.log(chalk.gray('   Alternatives Considered:'));
        for (const alt of data.reasoning.alternatives) {
          const confidence =
            alt.confidence !== undefined ? (alt.confidence * 100).toFixed(0) : 'N/A';
          console.log(chalk.gray(`   - ${alt.option}: ${alt.reason} (confidence: ${confidence}%)`));
        }
      }
      if (data.reasoning.lessons && data.reasoning.lessons.length > 0) {
        console.log(chalk.gray('   Lessons Applied:'));
        for (const lesson of data.reasoning.lessons) {
          console.log(chalk.gray(`   - ${lesson.lesson}`));
        }
      }
      console.log();
    }
  }

  private outputJson(data: QuadRetrievalResult, options: QuadIndexQueryOptions): void {
    const output = {
      success: true,
      results: data.principles.map((p: Principle, i: number) => ({
        id: p.id,
        name: p.name,
        intent: p.intent,
        confidence: p.confidence,
        status: p.status,
        source: p.sources?.[0] || 'unknown',
        timestamp: p.created_at instanceof Date ? p.created_at.getTime() : Date.now(),
        score: data.scores[i] || 0,
        metadata: {
          type: 'principle',
          model: p.applicable_to_models?.[0] || 'unknown',
        },
      })),
      relationships: data.relationships || [],
      reasoning: data.reasoning || undefined,
      stats: {
        total: data.total,
        returned: data.principles.length,
        store: options.store || 'vector',
        query: data.query,
      },
    };

    console.log(JSON.stringify(output, null, 2));
  }

  private outputJsonError(error: string): void {
    const output = {
      success: false,
      error,
      results: [],
      stats: {
        total: 0,
        returned: 0,
      },
    };

    console.error(JSON.stringify(output, null, 2));
  }
}
