/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * WatcherLogger Tests
 * Phase 3.3: Watcher Integration - October 2025
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WatcherLogger } from './WatcherLogger.js';

describe('WatcherLogger', () => {
  let logger: WatcherLogger;

  beforeEach(() => {
    logger = new WatcherLogger({
      verbose: false,
      logLevel: 'debug',
      maxEntries: 100,
    });
  });

  describe('logging methods', () => {
    it('should log debug message', () => {
      logger.debug('Debug message');

      const entries = logger.getEntries('debug');
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe('Debug message');
    });

    it('should log info message', () => {
      logger.info('Info message');

      const entries = logger.getEntries('info');
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe('Info message');
    });

    it('should log success message', () => {
      logger.success('Success message');

      const entries = logger.getEntries('success');
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe('Success message');
    });

    it('should log warning message', () => {
      logger.warning('Warning message');

      const entries = logger.getEntries('warning');
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe('Warning message');
    });

    it('should log error message', () => {
      logger.error('Error message');

      const entries = logger.getEntries('error');
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe('Error message');
    });

    it('should log with context', () => {
      logger.info('Message with context', { key: 'value', count: 42 });

      const entries = logger.getEntries('info');
      expect(entries[0].context).toEqual({ key: 'value', count: 42 });
    });
  });

  describe('getEntries', () => {
    it('should return all entries', () => {
      logger.info('Message 1');
      logger.warning('Message 2');
      logger.error('Message 3');

      const entries = logger.getEntries();
      expect(entries.length).toBe(3);
    });

    it('should filter entries by level', () => {
      logger.info('Info 1');
      logger.info('Info 2');
      logger.warning('Warning 1');

      const infoEntries = logger.getEntries('info');
      expect(infoEntries.length).toBe(2);
      expect(infoEntries.every((e) => e.level === 'info')).toBe(true);
    });
  });

  describe('getRecent', () => {
    it('should return recent entries', () => {
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }

      const recent = logger.getRecent(5);
      expect(recent.length).toBe(5);
      expect(recent[4].message).toBe('Message 9');
    });

    it('should filter recent entries by level', () => {
      logger.info('Info 1');
      logger.warning('Warning 1');
      logger.info('Info 2');
      logger.warning('Warning 2');

      const recentWarnings = logger.getRecent(2, 'warning');
      expect(recentWarnings.length).toBe(2);
      expect(recentWarnings.every((e) => e.level === 'warning')).toBe(true);
    });
  });

  describe('getSince', () => {
    it('should return entries since timestamp', () => {
      logger.info('Message 1');
      const timestamp = new Date();
      logger.info('Message 2');
      logger.info('Message 3');

      const entries = logger.getSince(timestamp);
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter entries by level', () => {
      logger.info('Info 1');
      const timestamp = new Date();
      logger.info('Info 2');
      logger.warning('Warning 1');

      const entries = logger.getSince(timestamp, 'info');
      expect(entries.every((e) => e.level === 'info')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return log statistics', () => {
      logger.debug('Debug');
      logger.info('Info 1');
      logger.info('Info 2');
      logger.warning('Warning');
      logger.error('Error');

      const stats = logger.getStats();
      expect(stats.debug).toBe(1);
      expect(stats.info).toBe(2);
      expect(stats.warning).toBe(1);
      expect(stats.error).toBe(1);
      expect(stats.success).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      logger.info('Message 1');
      logger.info('Message 2');

      expect(logger.getCount()).toBe(2);

      logger.clear();

      expect(logger.getCount()).toBe(0);
    });
  });

  describe('setVerbose', () => {
    it('should set verbose mode', () => {
      logger.setVerbose(true);
      logger.info('Message');

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('setLogLevel', () => {
    it('should filter by log level', () => {
      logger.setLogLevel('warning');

      logger.debug('Debug');
      logger.info('Info');
      logger.warning('Warning');
      logger.error('Error');

      const entries = logger.getEntries();
      expect(entries.length).toBe(2);
      expect(entries.every((e) => e.level === 'warning' || e.level === 'error')).toBe(true);
    });
  });

  describe('format', () => {
    it('should format entries as string', () => {
      logger.info('Message 1');
      logger.warning('Message 2');

      const formatted = logger.format();
      expect(formatted).toContain('Message 1');
      expect(formatted).toContain('Message 2');
      expect(formatted).toContain('INFO');
      expect(formatted).toContain('WARNING');
    });

    it('should format specific entries', () => {
      logger.info('Message 1');
      logger.warning('Message 2');

      const entries = logger.getEntries('info');
      const formatted = logger.format(entries);

      expect(formatted).toContain('Message 1');
      expect(formatted).not.toContain('Message 2');
    });
  });

  describe('getCount', () => {
    it('should return entry count', () => {
      expect(logger.getCount()).toBe(0);

      logger.info('Message 1');
      expect(logger.getCount()).toBe(1);

      logger.info('Message 2');
      expect(logger.getCount()).toBe(2);
    });
  });

  describe('max entries', () => {
    it('should trim entries when exceeding max', () => {
      const smallLogger = new WatcherLogger({ maxEntries: 5 });

      for (let i = 0; i < 10; i++) {
        smallLogger.info(`Message ${i}`);
      }

      expect(smallLogger.getCount()).toBe(5);
      expect(smallLogger.getEntries()[0].message).toBe('Message 5');
    });
  });

  describe('log level priority', () => {
    it('should respect log level priority', () => {
      logger.setLogLevel('error');

      logger.debug('Debug');
      logger.info('Info');
      logger.success('Success');
      logger.warning('Warning');
      logger.error('Error');

      const entries = logger.getEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].level).toBe('error');
    });
  });
});
