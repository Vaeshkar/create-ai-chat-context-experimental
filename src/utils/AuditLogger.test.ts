/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuditLogger } from './AuditLogger.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

describe('AuditLogger', () => {
  const testDir = join(process.cwd(), '.test-audit');
  let logger: AuditLogger;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(join(testDir, '.lill'), { recursive: true });
    logger = new AuditLogger(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('logViolation', () => {
    it('should log a violation to audit log', async () => {
      await logger.logViolation('protected-ai-files', '.ai/code-style.md', 'write');

      const entries = await logger.readEntries();
      expect(entries.length).toBe(1);
      expect(entries[0]?.level).toBe('VIOLATION');
      expect(entries[0]?.rule).toBe('protected-ai-files');
      expect(entries[0]?.path).toBe('.ai/code-style.md');
      expect(entries[0]?.operation).toBe('write');
      expect(entries[0]?.stack).toBeDefined();
    });

    it('should log violation with message', async () => {
      await logger.logViolation(
        'protected-ai-files',
        '.ai/code-style.md',
        'write',
        'Attempted to write to protected file'
      );

      const entries = await logger.readEntries();
      expect(entries[0]?.message).toBe('Attempted to write to protected file');
    });
  });

  describe('logCompliance', () => {
    it('should log compliance to audit log', async () => {
      await logger.logCompliance('lill-format-only', '.lill/raw/conversation.json', 'write');

      const entries = await logger.readEntries();
      expect(entries.length).toBe(1);
      expect(entries[0]?.level).toBe('COMPLIANT');
      expect(entries[0]?.rule).toBe('lill-format-only');
      expect(entries[0]?.path).toBe('.lill/raw/conversation.json');
      expect(entries[0]?.operation).toBe('write');
    });
  });

  describe('logWarning', () => {
    it('should log warning to audit log', async () => {
      await logger.logWarning(
        'lill-format-only',
        '.lill/raw/file.txt',
        'write',
        'Unusual file extension'
      );

      const entries = await logger.readEntries();
      expect(entries.length).toBe(1);
      expect(entries[0]?.level).toBe('WARNING');
      expect(entries[0]?.rule).toBe('lill-format-only');
      expect(entries[0]?.message).toBe('Unusual file extension');
    });
  });

  describe('readEntries', () => {
    it('should return empty array if no log file exists', async () => {
      const entries = await logger.readEntries();
      expect(entries).toEqual([]);
    });

    it('should read all entries from log file', async () => {
      await logger.logViolation('rule1', 'path1', 'write');
      await logger.logCompliance('rule2', 'path2', 'read');
      await logger.logWarning('rule3', 'path3', 'delete', 'warning message');

      const entries = await logger.readEntries();
      expect(entries.length).toBe(3);
      expect(entries[0]?.level).toBe('VIOLATION');
      expect(entries[1]?.level).toBe('COMPLIANT');
      expect(entries[2]?.level).toBe('WARNING');
    });
  });

  describe('getViolations', () => {
    it('should return only violations', async () => {
      await logger.logViolation('rule1', 'path1', 'write');
      await logger.logCompliance('rule2', 'path2', 'read');
      await logger.logViolation('rule3', 'path3', 'write');

      const violations = await logger.getViolations();
      expect(violations.length).toBe(2);
      expect(violations[0]?.level).toBe('VIOLATION');
      expect(violations[1]?.level).toBe('VIOLATION');
    });

    it('should filter violations by date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await logger.logViolation('rule1', 'path1', 'write');

      const violations = await logger.getViolations(yesterday);
      expect(violations.length).toBe(1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const futureViolations = await logger.getViolations(tomorrow);
      expect(futureViolations.length).toBe(0);
    });
  });

  describe('getCompliance', () => {
    it('should return only compliance entries', async () => {
      await logger.logViolation('rule1', 'path1', 'write');
      await logger.logCompliance('rule2', 'path2', 'read');
      await logger.logCompliance('rule3', 'path3', 'write');

      const compliance = await logger.getCompliance();
      expect(compliance.length).toBe(2);
      expect(compliance[0]?.level).toBe('COMPLIANT');
      expect(compliance[1]?.level).toBe('COMPLIANT');
    });
  });

  describe('getComplianceRate', () => {
    it('should return 1.0 for no operations', async () => {
      const rate = await logger.getComplianceRate();
      expect(rate).toBe(1.0);
    });

    it('should calculate compliance rate correctly', async () => {
      await logger.logCompliance('rule1', 'path1', 'write');
      await logger.logCompliance('rule2', 'path2', 'write');
      await logger.logCompliance('rule3', 'path3', 'write');
      await logger.logViolation('rule4', 'path4', 'write');

      const rate = await logger.getComplianceRate();
      expect(rate).toBe(0.75); // 3 compliant / 4 total = 0.75
    });

    it('should return 0.0 for all violations', async () => {
      await logger.logViolation('rule1', 'path1', 'write');
      await logger.logViolation('rule2', 'path2', 'write');

      const rate = await logger.getComplianceRate();
      expect(rate).toBe(0.0);
    });

    it('should return 1.0 for all compliance', async () => {
      await logger.logCompliance('rule1', 'path1', 'write');
      await logger.logCompliance('rule2', 'path2', 'write');

      const rate = await logger.getComplianceRate();
      expect(rate).toBe(1.0);
    });
  });

  describe('clear', () => {
    it('should delete audit log file', async () => {
      await logger.logViolation('rule1', 'path1', 'write');

      const logPath = logger.getLogPath();
      expect(existsSync(logPath)).toBe(true);

      await logger.clear();
      expect(existsSync(logPath)).toBe(false);
    });
  });

  describe('getLogPath', () => {
    it('should return correct log path', () => {
      const logPath = logger.getLogPath();
      expect(logPath).toBe(join(testDir, '.lill', '.audit.log'));
    });
  });
});
