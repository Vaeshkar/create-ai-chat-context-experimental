/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Daemon Controller - Unified management for Watcher + Guardian
 * Phase 6: November 2025
 *
 * Manages both AETHER Watcher and Guardian as background daemons
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface DaemonStatus {
  watcher: {
    running: boolean;
    pid?: number;
    uptime?: number;
    lastHeartbeat?: number;
  };
  guardian: {
    running: boolean;
    pid?: number;
    uptime?: number;
  };
}

export interface StartOptions {
  cwd: string;
  verbose?: boolean;
  watcherOnly?: boolean;
  guardianOnly?: boolean;
}

/**
 * Unified daemon controller for Watcher + Guardian
 */
export class DaemonController {
  private cwd: string;
  private watcherPidFile: string;
  private guardianPidFile: string;
  private healthFile: string;
  private logFile: string;

  constructor(cwd: string) {
    this.cwd = cwd;
    this.watcherPidFile = join(cwd, '.aether-watcher.pid');
    this.guardianPidFile = join(cwd, '.aether-guardian.pid');
    this.healthFile = join(cwd, '.aether-health.json');
    this.logFile = join(cwd, '.lill', '.aether.log');
  }

  /**
   * Start both watcher and guardian as background daemons
   */
  async start(
    options: StartOptions
  ): Promise<Result<{ watcherPid?: number; guardianPid?: number }>> {
    try {
      const result: { watcherPid?: number; guardianPid?: number } = {};

      // Start watcher (unless guardianOnly)
      if (!options.guardianOnly) {
        const watcherResult = await this.startWatcher(options);
        if (!watcherResult.ok) {
          return watcherResult;
        }
        result.watcherPid = watcherResult.value;
      }

      // Start guardian (unless watcherOnly)
      if (!options.watcherOnly) {
        const guardianResult = await this.startGuardian(options);
        if (!guardianResult.ok) {
          // If watcher started but guardian failed, stop watcher
          if (result.watcherPid) {
            await this.stopWatcher();
          }
          return guardianResult;
        }
        result.guardianPid = guardianResult.value;
      }

      return Ok(result);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Start watcher daemon
   */
  private async startWatcher(options: StartOptions): Promise<Result<number>> {
    try {
      // Check if already running
      const existingPid = this.readPidFile(this.watcherPidFile);
      if (existingPid && this.isProcessRunning(existingPid)) {
        return Err(new Error(`Watcher already running (PID: ${existingPid})`));
      }

      // Clear stale PID file before starting
      this.deletePidFile(this.watcherPidFile);

      // Build command
      // Try to find CLI in common locations
      const devCliPath = join(this.cwd, 'packages', 'aice', 'src', 'cli.ts');
      const prodCliPath = join(this.cwd, 'packages', 'aice', 'dist', 'esm', 'cli.js');
      const installedCliPath = join(this.cwd, 'node_modules', '.bin', 'aether');

      let command: string;
      let commandArgs: string[];

      if (existsSync(devCliPath)) {
        // Development mode: use tsx with full path
        command = 'npx';
        commandArgs = ['tsx', devCliPath, 'watch', '--dir', options.cwd];
      } else if (existsSync(prodCliPath)) {
        // Production mode: use node with full path
        command = 'node';
        commandArgs = [prodCliPath, 'watch', '--dir', options.cwd];
      } else if (existsSync(installedCliPath)) {
        // Installed mode: use aether command
        command = installedCliPath;
        commandArgs = ['watch', '--dir', options.cwd];
      } else {
        return Err(
          new Error(
            `CLI not found. Tried:\n  ${devCliPath}\n  ${prodCliPath}\n  ${installedCliPath}`
          )
        );
      }

      if (options.verbose) {
        commandArgs.push('--verbose');
      }

      const child = spawn(command, commandArgs, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: options.cwd,
        env: { ...process.env, AETHER_DAEMON: 'true' },
      });

      // Redirect output to log file
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          this.appendLog(`[WATCHER] ${data.toString()}`);
        });
      }
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          this.appendLog(`[WATCHER ERROR] ${data.toString()}`);
        });
      }

      // Unref so parent can exit
      child.unref();

      // Save PID
      this.writePidFile(this.watcherPidFile, child.pid!);

      // Wait a moment to ensure it started
      await this.sleep(1000);

      // Verify it's still running
      if (!this.isProcessRunning(child.pid!)) {
        return Err(new Error('Watcher failed to start'));
      }

      return Ok(child.pid!);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Start guardian daemon
   */
  private async startGuardian(options: StartOptions): Promise<Result<number>> {
    try {
      // Check if already running
      const existingPid = this.readPidFile(this.guardianPidFile);
      if (existingPid && this.isProcessRunning(existingPid)) {
        return Err(new Error(`Guardian already running (PID: ${existingPid})`));
      }

      // Clear stale PID file before starting
      this.deletePidFile(this.guardianPidFile);

      // Check if aether-guardian package exists
      const guardianTsPath = join(this.cwd, 'packages', 'aether-guardian', 'src', 'cli.ts');
      const guardianJsPath = join(this.cwd, 'packages', 'aether-guardian', 'dist', 'cli.js');

      let command: string;
      let commandArgs: string[];

      if (existsSync(guardianTsPath)) {
        // Development mode: use tsx
        command = 'npx';
        commandArgs = ['tsx', guardianTsPath, 'start'];
      } else if (existsSync(guardianJsPath)) {
        // Production mode: use node
        command = 'node';
        commandArgs = [guardianJsPath, 'start'];
      } else {
        return Err(new Error(`Guardian not found at ${guardianTsPath} or ${guardianJsPath}`));
      }

      const child = spawn(command, commandArgs, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: options.cwd,
        env: { ...process.env, AETHER_DAEMON: 'true' },
      });

      // Redirect output to log file
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          this.appendLog(`[GUARDIAN] ${data.toString()}`);
        });
      }
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          this.appendLog(`[GUARDIAN ERROR] ${data.toString()}`);
        });
      }

      // Unref so parent can exit
      child.unref();

      // Wait a moment to ensure it started (and passed its own PID check)
      await this.sleep(2000);

      // Verify it's still running
      if (!this.isProcessRunning(child.pid!)) {
        return Err(new Error('Guardian failed to start'));
      }

      // Save PID (after Guardian has started and passed its own checks)
      this.writePidFile(this.guardianPidFile, child.pid!);

      return Ok(child.pid!);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Stop both watcher and guardian
   */
  async stop(): Promise<Result<void>> {
    try {
      const errors: string[] = [];

      // Stop watcher
      const watcherResult = await this.stopWatcher();
      if (!watcherResult.ok) {
        errors.push(`Watcher: ${watcherResult.error.message}`);
      }

      // Stop guardian
      const guardianResult = await this.stopGuardian();
      if (!guardianResult.ok) {
        errors.push(`Guardian: ${guardianResult.error.message}`);
      }

      if (errors.length > 0) {
        return Err(new Error(errors.join('; ')));
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Stop watcher daemon
   */
  private async stopWatcher(): Promise<Result<void>> {
    try {
      const pid = this.readPidFile(this.watcherPidFile);
      if (!pid) {
        return Err(new Error('Watcher not running (no PID file)'));
      }

      if (!this.isProcessRunning(pid)) {
        // Clean up stale PID file
        this.deletePidFile(this.watcherPidFile);
        return Err(new Error('Watcher not running (stale PID)'));
      }

      // Send SIGTERM
      process.kill(pid, 'SIGTERM');

      // Wait for graceful shutdown
      await this.sleep(2000);

      // Force kill if still running
      if (this.isProcessRunning(pid)) {
        process.kill(pid, 'SIGKILL');
        await this.sleep(500);
      }

      // Clean up PID file
      this.deletePidFile(this.watcherPidFile);

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Stop guardian daemon
   */
  private async stopGuardian(): Promise<Result<void>> {
    try {
      const pid = this.readPidFile(this.guardianPidFile);
      if (!pid) {
        return Err(new Error('Guardian not running (no PID file)'));
      }

      if (!this.isProcessRunning(pid)) {
        // Clean up stale PID file
        this.deletePidFile(this.guardianPidFile);
        return Err(new Error('Guardian not running (stale PID)'));
      }

      // Send SIGTERM
      process.kill(pid, 'SIGTERM');

      // Wait for graceful shutdown
      await this.sleep(2000);

      // Force kill if still running
      if (this.isProcessRunning(pid)) {
        process.kill(pid, 'SIGKILL');
        await this.sleep(500);
      }

      // Clean up PID file
      this.deletePidFile(this.guardianPidFile);

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get status of both daemons
   */
  getStatus(): DaemonStatus {
    const status: DaemonStatus = {
      watcher: { running: false },
      guardian: { running: false },
    };

    // Check watcher
    const watcherPid = this.readPidFile(this.watcherPidFile);
    if (watcherPid && this.isProcessRunning(watcherPid)) {
      status.watcher.running = true;
      status.watcher.pid = watcherPid;

      // Get uptime from health file
      if (existsSync(this.healthFile)) {
        try {
          const health = JSON.parse(readFileSync(this.healthFile, 'utf-8'));
          status.watcher.uptime = health.uptime;
          status.watcher.lastHeartbeat = health.lastHeartbeat;
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Check guardian
    const guardianPid = this.readPidFile(this.guardianPidFile);
    if (guardianPid && this.isProcessRunning(guardianPid)) {
      status.guardian.running = true;
      status.guardian.pid = guardianPid;
      // TODO: Add guardian uptime tracking
    }

    return status;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private readPidFile(path: string): number | null {
    try {
      const content = readFileSync(path, 'utf-8');
      return parseInt(content.trim(), 10);
    } catch {
      return null;
    }
  }

  private writePidFile(path: string, pid: number): void {
    writeFileSync(path, pid.toString(), 'utf-8');
  }

  private deletePidFile(path: string): void {
    try {
      unlinkSync(path);
    } catch {
      // Ignore errors
    }
  }

  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  private appendLog(message: string): void {
    try {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] ${message}`;
      writeFileSync(this.logFile, line, { flag: 'a' });
    } catch {
      // Ignore log errors
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
