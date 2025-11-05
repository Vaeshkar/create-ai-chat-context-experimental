/**
 * Health Command
 * Shows QuadIndex health metrics and system status
 */

import chalk from 'chalk';
import { QuadIndex } from 'lill-core';
import { HealthMetricsCollector } from 'lill-core';
import { join } from 'path';

export interface HealthCommandOptions {
  cwd: string;
  verbose?: boolean;
  save?: boolean;
}

export interface HealthCommandResult {
  ok: boolean;
  error?: Error;
}

export interface QuadIndexHealthData {
  stores: {
    vector: { size: number; avgQueryTime: number };
    metadata: { size: number; avgQueryTime: number };
    graph: { nodes: number; edges: number; avgDepth: number };
    reasoning: { hypotheticals: number; rejected: number };
  };
  quality: {
    avgConfidence: number;
    contradictions: number;
    orphanedPrinciples: number;
    stalePrinciples: number;
    duplicates: number;
  };
  usage: {
    totalQueries: number;
    queriesPerHour: number;
    topQueries: string[];
    cacheHitRate: number;
  };
  cache: {
    size: number;
    maxSize: number;
    hitRate: number;
    evictions: number;
  };
}

export class HealthCommand {
  private options: HealthCommandOptions;

  constructor(options: HealthCommandOptions) {
    this.options = options;
  }

  async execute(): Promise<HealthCommandResult> {
    try {
      console.log(chalk.blue('🏥 Collecting QuadIndex health metrics...'));

      // Initialize QuadIndex
      const quadIndex = new QuadIndex();

      // Try to load existing data
      try {
        const snapshotDir = join(this.options.cwd, '.lill', 'snapshots');
        // Note: In a real implementation, we'd restore from the latest snapshot
        // For now, we'll work with an empty QuadIndex
        if (this.options.verbose) {
          console.log(chalk.gray(`Looking for snapshots in: ${snapshotDir}`));
        }
      } catch {
        if (this.options.verbose) {
          console.log(chalk.yellow('⚠️  No existing snapshots found, using empty QuadIndex'));
        }
      }

      // Collect health metrics
      const metricsFile = join(this.options.cwd, '.lill', 'metrics.json');
      const snapshotDir = join(this.options.cwd, '.lill', 'snapshots');
      const collector = new HealthMetricsCollector(metricsFile, snapshotDir);

      const health = await collector.collect(quadIndex);

      // Save metrics if requested
      if (this.options.save) {
        await collector.save(health);
        if (this.options.verbose) {
          console.log(chalk.green(`✅ Metrics saved to: ${metricsFile}`));
        }
      }

      // Display health dashboard
      console.log('');
      console.log(collector.format(health, this.options.verbose));

      // Show overall health status
      const healthStatus = this.assessOverallHealth(health);
      console.log('');
      console.log(
        chalk.bold('🎯 Overall Health:'),
        this.getHealthStatusColor(healthStatus.score)(healthStatus.status)
      );

      if (healthStatus.criticalIssues.length > 0) {
        console.log('');
        console.log(chalk.red.bold('🚨 Critical Issues:'));
        healthStatus.criticalIssues.forEach((issue) => {
          console.log(chalk.red(`  • ${issue}`));
        });
      }

      if (healthStatus.warnings.length > 0) {
        console.log('');
        console.log(chalk.yellow.bold('⚠️  Warnings:'));
        healthStatus.warnings.forEach((warning) => {
          console.log(chalk.yellow(`  • ${warning}`));
        });
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Assess overall health status
   */
  private assessOverallHealth(health: QuadIndexHealthData): {
    score: number;
    status: string;
    criticalIssues: string[];
    warnings: string[];
  } {
    let score = 100;
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    // Check for critical issues (major score deductions)
    if (health.quality.contradictions > 10) {
      score -= 30;
      criticalIssues.push(`High contradiction count: ${health.quality.contradictions}`);
    }

    if (health.quality.avgConfidence < 0.5) {
      score -= 25;
      criticalIssues.push(
        `Very low average confidence: ${(health.quality.avgConfidence * 100).toFixed(1)}%`
      );
    }

    if (health.stores.vector.size === 0 && health.stores.metadata.size === 0) {
      score -= 50;
      criticalIssues.push('No principles found in system');
    }

    // Check for warnings (minor score deductions)
    if (health.quality.contradictions > 5) {
      score -= 10;
      warnings.push(`Moderate contradiction count: ${health.quality.contradictions}`);
    }

    if (health.quality.stalePrinciples > 20) {
      score -= 10;
      warnings.push(`Many stale principles: ${health.quality.stalePrinciples}`);
    }

    if (health.quality.avgConfidence < 0.7) {
      score -= 10;
      warnings.push(`Low average confidence: ${(health.quality.avgConfidence * 100).toFixed(1)}%`);
    }

    if (health.usage.cacheHitRate < 0.5) {
      score -= 5;
      warnings.push(`Low cache hit rate: ${(health.usage.cacheHitRate * 100).toFixed(1)}%`);
    }

    if (health.quality.orphanedPrinciples > 10) {
      score -= 5;
      warnings.push(`Many orphaned principles: ${health.quality.orphanedPrinciples}`);
    }

    // Determine status
    let status: string;
    if (score >= 90) {
      status = 'Excellent';
    } else if (score >= 80) {
      status = 'Good';
    } else if (score >= 70) {
      status = 'Fair';
    } else if (score >= 60) {
      status = 'Poor';
    } else {
      status = 'Critical';
    }

    return {
      score: Math.max(0, score),
      status: `${status} (${Math.max(0, score)}/100)`,
      criticalIssues,
      warnings,
    };
  }

  /**
   * Get color function for health status
   */
  private getHealthStatusColor(score: number) {
    if (score >= 90) return chalk.green.bold;
    if (score >= 80) return chalk.blue.bold;
    if (score >= 70) return chalk.yellow.bold;
    if (score >= 60) return chalk.magenta.bold;
    return chalk.red.bold;
  }
}
