/**
 * QuadIndex Stats Command
 * Show statistics from QuadIndex (4 stores: Vector, Metadata, Graph, Reasoning)
 */

import chalk from 'chalk';
import { QuadIndex, SnapshotManager } from 'lill-core';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface QuadIndexStatsOptions {
  cwd?: string;
  verbose?: boolean;
  json?: boolean; // Output as JSON for AI consumption
}

export interface HealthData {
  isAlive: boolean;
  lastHeartbeat: number;
  pid: number;
  uptime: number;
  stats: {
    principles: number;
    relationships: number;
    hypotheticals: number;
    rejected: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  lock: {
    readers: number;
    writers: number;
    writeRequests: number;
    readQueueLength: number;
    writeQueueLength: number;
  };
}

export interface QuadIndexStats {
  vector: { size: number; vectorDimension: number };
  metadata: { total: number; byStatus: Record<string, number>; models: string[] };
  graph: { nodes: number; edges: number; types: string[] };
  reasoning: { hypotheticals: number; rejected: number; validated: number; deferred: number };
}

export interface LockStats {
  readers: number;
  writers: number;
  writeRequests: number;
  readQueueLength: number;
  writeQueueLength: number;
}

export class QuadIndexStatsCommand {
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

  async execute(options: QuadIndexStatsOptions = {}): Promise<void> {
    try {
      // Update snapshot manager verbose setting
      if (options.verbose) {
        this.snapshotManager = new SnapshotManager({
          snapshotDir: join(this.cwd, '.lill', 'snapshots'),
          verbose: true,
        });
      }

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
            if (options.verbose) {
              console.log(chalk.gray(`   Snapshot dir: ${join(this.cwd, '.lill', 'snapshots')}`));
              console.log(chalk.gray(`   Rolling error: ${restoreResult.error}`));
              console.log(chalk.gray(`   Golden error: ${goldenResult.error}`));
            }
          }
          process.exit(1);
        }
      }

      // Step 2: Get stats from QuadIndex
      const statsResult = this.quadIndex.getStats();
      if (!statsResult.success) {
        if (options.json) {
          this.outputJsonError(statsResult.error || 'Failed to get stats');
        } else {
          console.error(chalk.red('❌ Failed to get stats:'), statsResult.error);
        }
        process.exit(1);
      }

      // Step 3: Read health file
      const health = this.readHealthFile();

      // Step 4: Get lock stats
      const lockStats = this.quadIndex.getLockStats();

      // Step 5: Output results
      if (options.json) {
        this.outputJson(statsResult.data as any, health, lockStats);
      } else {
        this.outputHuman(statsResult.data as any, health, lockStats, options);
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

  private readHealthFile(): HealthData | null {
    const healthFile = join(this.cwd, '.aether-health.json');

    if (!existsSync(healthFile)) {
      return null;
    }

    try {
      const content = readFileSync(healthFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private isWatcherAlive(health: HealthData | null): boolean {
    if (!health) {
      return false;
    }

    if (!health.isAlive) {
      return false;
    }

    // Check if heartbeat is recent (within last 60 seconds)
    const now = Date.now();
    const age = now - health.lastHeartbeat;

    return age <= 60000; // 60 seconds
  }

  private outputHuman(
    stats: QuadIndexStats,
    health: HealthData | null,
    lockStats: LockStats,
    options: QuadIndexStatsOptions
  ): void {
    const watcherAlive = this.isWatcherAlive(health);

    console.log(chalk.bold('\n📊 QuadIndex Statistics\n'));

    // Watcher status
    if (watcherAlive) {
      console.log(chalk.green('✅ Watcher: Running'));
      if (health) {
        const uptimeHours = (health.uptime / (1000 * 60 * 60)).toFixed(1);
        console.log(chalk.gray(`   PID: ${health.pid} | Uptime: ${uptimeHours}h`));
      }
    } else {
      console.log(chalk.red('❌ Watcher: Stopped'));
      console.log(chalk.gray('   Run: aether watch-terminal'));
    }

    console.log();

    // Store statistics
    console.log(chalk.bold('📚 Stores:'));
    console.log(
      chalk.gray(
        `   Vector:    ${stats.vector.size.toLocaleString()} principles (${stats.vector.vectorDimension}D)`
      )
    );
    console.log(chalk.gray(`   Metadata:  ${stats.metadata.total.toLocaleString()} principles`));
    console.log(
      chalk.gray(
        `   Graph:     ${stats.graph.nodes.toLocaleString()} nodes, ${stats.graph.edges.toLocaleString()} edges`
      )
    );
    console.log(
      chalk.gray(
        `   Reasoning: ${stats.reasoning.hypotheticals} hypotheticals, ${stats.reasoning.rejected} rejected`
      )
    );

    console.log();

    // Status breakdown
    if (options.verbose && stats.metadata.byStatus) {
      console.log(chalk.bold('📋 By Status:'));
      for (const [status, count] of Object.entries(stats.metadata.byStatus)) {
        console.log(chalk.gray(`   ${status}: ${count}`));
      }
      console.log();
    }

    // Models
    if (options.verbose && stats.metadata.models && stats.metadata.models.length > 0) {
      console.log(chalk.bold('🤖 Models:'));
      console.log(chalk.gray(`   ${stats.metadata.models.join(', ')}`));
      console.log();
    }

    // Lock stats
    if (options.verbose) {
      console.log(chalk.bold('🔒 Read-Write Lock:'));
      console.log(chalk.gray(`   Readers: ${lockStats.readers} | Writers: ${lockStats.writers}`));
      console.log(
        chalk.gray(
          `   Queues: ${lockStats.readQueueLength} reads, ${lockStats.writeQueueLength} writes`
        )
      );
      console.log();
    }

    // Memory (if available)
    if (options.verbose && health?.memory) {
      console.log(chalk.bold('💾 Memory:'));
      console.log(
        chalk.gray(
          `   Heap: ${health.memory.heapUsedMB.toFixed(1)}MB / ${health.memory.heapTotalMB.toFixed(1)}MB`
        )
      );
      console.log(chalk.gray(`   RSS: ${health.memory.rssMB.toFixed(1)}MB`));
      console.log();
    }
  }

  private outputJson(stats: QuadIndexStats, health: HealthData | null, lockStats: LockStats): void {
    const watcherAlive = this.isWatcherAlive(health);

    const output = {
      success: true,
      isAlive: watcherAlive,
      uptime: health?.uptime || 0,
      stores: {
        vector: {
          total: stats.vector.size,
          indexed: stats.vector.size,
          dimension: stats.vector.vectorDimension,
        },
        metadata: {
          total: stats.metadata.total,
          byStatus: stats.metadata.byStatus,
          models: stats.metadata.models,
        },
        graph: {
          nodes: stats.graph.nodes,
          edges: stats.graph.edges,
          types: stats.graph.types,
        },
        reasoning: {
          hypotheticals: stats.reasoning.hypotheticals,
          rejected: stats.reasoning.rejected,
          validated: stats.reasoning.validated,
          deferred: stats.reasoning.deferred,
        },
      },
      features: {
        snapshot: {
          enabled: true,
          lastSnapshot: health?.lastHeartbeat || 0,
        },
        health: {
          enabled: watcherAlive,
          status: watcherAlive ? 'healthy' : 'stopped',
        },
        cache: {
          enabled: true,
          hitRate: 0, // TODO: Get from QueryCache
        },
        readWriteLock: {
          readers: lockStats.readers,
          writers: lockStats.writers,
          writeRequests: lockStats.writeRequests,
          readQueueLength: lockStats.readQueueLength,
          writeQueueLength: lockStats.writeQueueLength,
        },
      },
      memory: health?.memory || null,
      pid: health?.pid || null,
    };

    console.log(JSON.stringify(output, null, 2));
  }

  private outputJsonError(error: string): void {
    const output = {
      success: false,
      error,
      isAlive: false,
      stores: {
        vector: { total: 0, indexed: 0 },
        metadata: { total: 0, byStatus: {}, models: [] },
        graph: { nodes: 0, edges: 0, types: [] },
        reasoning: { hypotheticals: 0, rejected: 0, validated: 0, deferred: 0 },
      },
    };

    console.error(JSON.stringify(output, null, 2));
  }
}
