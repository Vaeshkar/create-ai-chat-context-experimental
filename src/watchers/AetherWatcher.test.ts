/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AetherWatcher } from './AetherWatcher.js';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('AetherWatcher', () => {
  let tempDir: string;
  let watcher: AetherWatcher | null = null;

  beforeEach(() => {
    // Create temp directory
    tempDir = join(process.cwd(), '.test-aether-watcher');
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
    mkdirSync(tempDir, { recursive: true });

    // Create required directories
    mkdirSync(join(tempDir, '.aicf', 'raw'), { recursive: true });
    mkdirSync(join(tempDir, '.lill', 'state'), { recursive: true });
  });

  afterEach(async () => {
    // CRITICAL: Stop watcher to prevent zombie processes
    if (watcher) {
      try {
        await watcher.stop();
      } catch (error) {
        // Ignore errors during cleanup
      }
      watcher = null;
    }

    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe('constructor', () => {
    it('should create AetherWatcher with default config', () => {
      watcher = new AetherWatcher({ cwd: tempDir });
      expect(watcher).toBeDefined();
    });

    it('should create AetherWatcher with custom config', () => {
      watcher = new AetherWatcher({
        cwd: tempDir,
        verbose: true,
        enablePrincipleWatcher: false,
        pollInterval: 10000,
      });
      expect(watcher).toBeDefined();
    });
  });

  describe('start()', () => {
    it('should start all watchers successfully', async () => {
      watcher = new AetherWatcher({ cwd: tempDir, verbose: false });
      const result = await watcher.start();

      expect(result.ok).toBe(true);

      const status = watcher.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.watchers.conversation).toBe(true);
      // principle watcher may be disabled if no API key
    });

    it('should not start if already running', async () => {
      watcher = new AetherWatcher({ cwd: tempDir, verbose: false });
      await watcher.start();

      const result = await watcher.start();
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('already running');
    });

    it('should disable PrincipleWatcher if no API key', async () => {
      // Remove API key
      const oldKey = process.env['ANTHROPIC_API_KEY'];
      delete process.env['ANTHROPIC_API_KEY'];

      watcher = new AetherWatcher({ cwd: tempDir, verbose: false });
      const result = await watcher.start();

      expect(result.ok).toBe(true);

      const status = watcher.getStatus();
      expect(status.watchers.principle).toBe(false);

      // Restore API key
      if (oldKey) {
        process.env['ANTHROPIC_API_KEY'] = oldKey;
      }
    });
  });

  describe('stop()', () => {
    it('should stop all watchers successfully', async () => {
      watcher = new AetherWatcher({ cwd: tempDir, verbose: false });
      await watcher.start();

      const result = await watcher.stop();
      expect(result.ok).toBe(true);

      const status = watcher.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should not fail if already stopped', async () => {
      watcher = new AetherWatcher({ cwd: tempDir, verbose: false });

      const result = await watcher.stop();
      expect(result.ok).toBe(true);
    });
  });

  describe('getStatus()', () => {
    it('should return correct status when stopped', () => {
      watcher = new AetherWatcher({ cwd: tempDir, verbose: false });
      const status = watcher.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.uptime).toBe(0);
      expect(status.errors).toEqual([]);
    });

    it('should return correct status when running', async () => {
      watcher = new AetherWatcher({ cwd: tempDir, verbose: false });
      await watcher.start();

      const status = watcher.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should track uptime correctly', async () => {
      watcher = new AetherWatcher({ cwd: tempDir, verbose: false });
      await watcher.start();

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const status = watcher.getStatus();
      expect(status.uptime).toBeGreaterThanOrEqual(1);
    });
  });

  describe('error handling', () => {
    it('should handle stop when not started', async () => {
      watcher = new AetherWatcher({ cwd: tempDir, verbose: false });

      const result = await watcher.stop();
      expect(result.ok).toBe(true);

      const status = watcher.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });
});
