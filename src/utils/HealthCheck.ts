/**
 * Health Check System (Task 4c)
 * Monitors watcher health and provides heartbeat
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface HealthCheckConfig {
  cwd: string;
  heartbeatInterval: number; // milliseconds
  healthFile: string;
}

export interface HealthStatus {
  isAlive: boolean;
  lastHeartbeat: number; // timestamp
  pid: number;
  uptime: number; // milliseconds
  stats: {
    principles: number;
    relationships: number;
    hypotheticals: number;
    rejected: number;
  };
  memory?: {
    heapUsed: number; // bytes
    heapTotal: number; // bytes
    external: number; // bytes (C++ objects bound to JS)
    rss: number; // bytes (Resident Set Size - total memory allocated)
    heapUsedMB: number; // MB (human-readable)
    heapTotalMB: number; // MB (human-readable)
    rssMB: number; // MB (human-readable)
  };
  lock?: {
    readers: number;
    writers: number;
    writeRequests: number;
    readQueueLength: number;
    writeQueueLength: number;
  };
}

/**
 * Health Check System
 * Writes heartbeat to file every N seconds
 * Allows external monitoring of watcher health
 */
export class HealthCheck {
  private config: HealthCheckConfig;
  private timer?: NodeJS.Timeout;
  private startTime: number;
  private stats: HealthStatus['stats'];
  private lockStats?: HealthStatus['lock'];

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = {
      cwd: config.cwd || process.cwd(),
      heartbeatInterval: config.heartbeatInterval || 30000, // 30 seconds
      healthFile: config.healthFile || '.aether-health.json',
    };
    this.startTime = Date.now();
    this.stats = {
      principles: 0,
      relationships: 0,
      hypotheticals: 0,
      rejected: 0,
    };
  }

  /**
   * Start heartbeat
   */
  start(): void {
    // Write initial heartbeat
    this.writeHeartbeat();

    // Start periodic heartbeat
    this.timer = setInterval(() => {
      this.writeHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    // Write final heartbeat with isAlive=false
    this.writeHeartbeat(false);
  }

  /**
   * Update stats
   */
  updateStats(stats: Partial<HealthStatus['stats']>): void {
    this.stats = { ...this.stats, ...stats };
  }

  /**
   * Update lock stats (from QuadIndex)
   */
  updateLockStats(lockStats: HealthStatus['lock']): void {
    this.lockStats = lockStats;
  }

  /**
   * Write heartbeat to file
   */
  private writeHeartbeat(isAlive = true): void {
    // Get memory usage
    const memUsage = process.memoryUsage();
    const memory: HealthStatus['memory'] = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapUsedMB: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMB: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
    };

    const healthStatus: HealthStatus = {
      isAlive,
      lastHeartbeat: Date.now(),
      pid: process.pid,
      uptime: Date.now() - this.startTime,
      stats: this.stats,
      memory,
      lock: this.lockStats,
    };

    const healthFilePath = join(this.config.cwd, this.config.healthFile);

    try {
      writeFileSync(healthFilePath, JSON.stringify(healthStatus, null, 2), 'utf-8');
    } catch {
      // Ignore write errors (don't crash watcher)
    }
  }

  /**
   * Read health status from file
   */
  static readHealth(cwd: string, healthFile = '.aether-health.json'): HealthStatus | null {
    const healthFilePath = join(cwd, healthFile);

    if (!existsSync(healthFilePath)) {
      return null;
    }

    try {
      const content = readFileSync(healthFilePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Check if watcher is alive
   * Returns true if heartbeat is recent (< 2x heartbeat interval)
   */
  static isAlive(cwd: string, healthFile = '.aether-health.json', maxAge = 60000): boolean {
    const health = HealthCheck.readHealth(cwd, healthFile);

    if (!health) {
      return false;
    }

    if (!health.isAlive) {
      return false;
    }

    const age = Date.now() - health.lastHeartbeat;
    return age < maxAge;
  }
}
