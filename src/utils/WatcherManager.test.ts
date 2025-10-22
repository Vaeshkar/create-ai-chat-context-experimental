/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * WatcherManager Tests
 * Phase 3.3: Watcher Integration - October 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { WatcherManager } from './WatcherManager.js';

describe('WatcherManager', () => {
  let tempDir: string;
  let pidFile: string;
  let logFile: string;
  let manager: WatcherManager;

  beforeEach(() => {
    tempDir = join(process.cwd(), '.test-watcher-manager');
    pidFile = join(tempDir, 'test.pid');
    logFile = join(tempDir, 'test.log');
    mkdirSync(tempDir, { recursive: true });

    manager = new WatcherManager({
      pidFile,
      logFile,
      verbose: false,
    });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe('initialize', () => {
    it('should initialize watcher', () => {
      const result = manager.initialize();

      expect(result.ok).toBe(true);
      expect(existsSync(pidFile)).toBe(true);
    });

    it('should write PID to file', () => {
      manager.initialize();

      const pidContent = readFileSync(pidFile, 'utf-8');
      expect(pidContent).toBe(String(process.pid));
    });

    it('should set start time', () => {
      manager.initialize();
      const status = manager.getStatus();

      expect(status.startTime).toBeDefined();
      expect(status.startTime).toBeInstanceOf(Date);
    });
  });

  describe('cleanup', () => {
    it('should cleanup watcher', () => {
      manager.initialize();
      const result = manager.cleanup();

      expect(result.ok).toBe(true);
      expect(existsSync(pidFile)).toBe(false);
    });

    it('should handle cleanup when PID file does not exist', () => {
      const result = manager.cleanup();

      expect(result.ok).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should return watcher status', () => {
      manager.initialize();
      const status = manager.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.pid).toBe(process.pid);
      expect(status.startTime).toBeDefined();
      expect(status.processedCount).toBe(0);
      expect(status.errorCount).toBe(0);
    });

    it('should calculate uptime', () => {
      manager.initialize();
      const status = manager.getStatus();

      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should track processed count', () => {
      manager.initialize();
      manager.recordSuccess();
      manager.recordSuccess();

      const status = manager.getStatus();
      expect(status.processedCount).toBe(2);
    });

    it('should track error count', () => {
      manager.initialize();
      manager.recordError('Test error 1');
      manager.recordError('Test error 2');

      const status = manager.getStatus();
      expect(status.errorCount).toBe(2);
    });
  });

  describe('isProcessRunning', () => {
    it('should return true when process is running', () => {
      manager.initialize();

      expect(manager.isProcessRunning()).toBe(true);
    });

    it('should return false when PID file does not exist', () => {
      expect(manager.isProcessRunning()).toBe(false);
    });

    it('should return false when PID does not match', () => {
      writeFileSync(pidFile, '99999', 'utf-8');

      expect(manager.isProcessRunning()).toBe(false);
    });
  });

  describe('recordSuccess', () => {
    it('should increment processed count', () => {
      manager.initialize();
      manager.recordSuccess();

      const status = manager.getStatus();
      expect(status.processedCount).toBe(1);
    });

    it('should record multiple successes', () => {
      manager.initialize();
      manager.recordSuccess();
      manager.recordSuccess();
      manager.recordSuccess();

      const status = manager.getStatus();
      expect(status.processedCount).toBe(3);
    });
  });

  describe('recordError', () => {
    it('should increment error count', () => {
      manager.initialize();
      manager.recordError('Test error');

      const status = manager.getStatus();
      expect(status.errorCount).toBe(1);
    });

    it('should record multiple errors', () => {
      manager.initialize();
      manager.recordError('Error 1');
      manager.recordError('Error 2');

      const status = manager.getStatus();
      expect(status.errorCount).toBe(2);
    });
  });

  describe('getLogContent', () => {
    it('should return empty content when log file does not exist', () => {
      const result = manager.getLogContent();

      expect(result.ok).toBe(true);
      if (result.ok && 'content' in result) {
        expect(result.content).toBe('');
      }
    });

    it('should return log content', () => {
      manager.initialize();
      manager.recordSuccess();

      const result = manager.getLogContent();

      expect(result.ok).toBe(true);
      if (result.ok && 'content' in result) {
        expect(result.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('clearLog', () => {
    it('should clear log file', () => {
      manager.initialize();
      manager.recordSuccess();

      let result = manager.getLogContent();
      if (result.ok && 'content' in result) {
        expect(result.content.length).toBeGreaterThan(0);
      }

      manager.clearLog();

      result = manager.getLogContent();
      if (result.ok && 'content' in result) {
        // After clear, there will be a "Log file cleared" entry
        expect(result.content).toContain('Log file cleared');
      }
    });
  });

  describe('getPidFilePath', () => {
    it('should return PID file path', () => {
      expect(manager.getPidFilePath()).toBe(pidFile);
    });
  });

  describe('getLogFilePath', () => {
    it('should return log file path', () => {
      expect(manager.getLogFilePath()).toBe(logFile);
    });
  });

  describe('setVerbose', () => {
    it('should set verbose mode', () => {
      manager.setVerbose(true);
      manager.initialize();
      manager.recordSuccess();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
