/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Daemon Manager - Manages background watcher daemon lifecycle
 * Handles PID file, process management, and daemon status tracking
 */

import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface DaemonStatus {
  running: boolean;
  pid?: number;
  startTime?: Date;
  uptime?: string;
  lastSync?: Date;
  platforms?: string[];
}

export interface DaemonInfo {
  pid: number;
  startTime: Date;
  lastSync?: Date;
}

export class DaemonManager {
  private pidFilePath: string;
  private watcherConfigPath: string;

  constructor(projectPath: string) {
    this.pidFilePath = join(projectPath, '.aicf', '.watcher.pid');
    this.watcherConfigPath = join(projectPath, '.watcher-config.json');
  }

  /**
   * Write PID file with daemon information
   */
  writePidFile(pid: number): Result<void> {
    try {
      const info: DaemonInfo = {
        pid,
        startTime: new Date(),
      };
      writeFileSync(this.pidFilePath, JSON.stringify(info, null, 2));
      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Read PID file and return daemon information
   */
  readPidFile(): Result<DaemonInfo> {
    try {
      if (!existsSync(this.pidFilePath)) {
        return Err(new Error('PID file not found'));
      }

      const content = readFileSync(this.pidFilePath, 'utf-8');
      const info = JSON.parse(content) as DaemonInfo;

      // Convert ISO string back to Date
      info.startTime = new Date(info.startTime);
      if (info.lastSync) {
        info.lastSync = new Date(info.lastSync);
      }

      return Ok(info);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Delete PID file
   */
  deletePidFile(): Result<void> {
    try {
      if (existsSync(this.pidFilePath)) {
        unlinkSync(this.pidFilePath);
      }
      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if process is running
   */
  isProcessRunning(pid: number): boolean {
    try {
      // Send signal 0 to check if process exists
      // This doesn't actually send a signal, just checks if we can
      process.kill(pid, 0);
      return true;
    } catch {
      // Process doesn't exist or we don't have permission
      return false;
    }
  }

  /**
   * Get daemon status
   */
  getStatus(): Result<DaemonStatus> {
    try {
      const pidResult = this.readPidFile();

      if (!pidResult.ok) {
        // No PID file - daemon not running
        return Ok({
          running: false,
        });
      }

      const info = pidResult.value;
      const running = this.isProcessRunning(info.pid);

      if (!running) {
        // PID file exists but process is dead - clean up stale PID file
        this.deletePidFile();
        return Ok({
          running: false,
        });
      }

      // Calculate uptime
      const uptimeMs = Date.now() - info.startTime.getTime();
      const uptime = this.formatUptime(uptimeMs);

      // Get enabled platforms from watcher config
      const platforms = this.getEnabledPlatforms();

      return Ok({
        running: true,
        pid: info.pid,
        startTime: info.startTime,
        uptime,
        lastSync: info.lastSync,
        platforms,
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Stop daemon by PID
   */
  stopDaemon(): Result<void> {
    try {
      const pidResult = this.readPidFile();

      if (!pidResult.ok) {
        return Err(new Error('No daemon running (PID file not found)'));
      }

      const info = pidResult.value;

      if (!this.isProcessRunning(info.pid)) {
        // Process already dead - clean up PID file
        this.deletePidFile();
        return Err(new Error('Daemon not running (stale PID file removed)'));
      }

      // Send SIGTERM to gracefully stop the process
      process.kill(info.pid, 'SIGTERM');

      // Wait a bit for graceful shutdown
      const maxWait = 5000; // 5 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < maxWait) {
        if (!this.isProcessRunning(info.pid)) {
          // Process stopped - clean up PID file
          this.deletePidFile();
          return Ok(undefined);
        }
        // Sleep for 100ms
        const sleepMs = 100;
        const start = Date.now();
        while (Date.now() - start < sleepMs) {
          // Busy wait
        }
      }

      // Process didn't stop gracefully - force kill
      process.kill(info.pid, 'SIGKILL');
      this.deletePidFile();

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Update last sync time in PID file
   */
  updateLastSync(): Result<void> {
    try {
      const pidResult = this.readPidFile();

      if (!pidResult.ok) {
        return Err(new Error('PID file not found'));
      }

      const info = pidResult.value;
      info.lastSync = new Date();

      writeFileSync(this.pidFilePath, JSON.stringify(info, null, 2));
      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get enabled platforms from watcher config
   */
  private getEnabledPlatforms(): string[] {
    try {
      if (!existsSync(this.watcherConfigPath)) {
        return [];
      }

      const content = readFileSync(this.watcherConfigPath, 'utf-8');
      const config = JSON.parse(content);

      const platforms: string[] = [];
      for (const [platform, settings] of Object.entries(config.platforms || {})) {
        if ((settings as { enabled: boolean }).enabled) {
          platforms.push(platform);
        }
      }

      return platforms;
    } catch {
      return [];
    }
  }
}
