/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuditCommand } from './AuditCommand.js';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('AuditCommand', () => {
  let testDir: string;
  let originalConsoleLog: typeof console.log;
  let consoleOutput: string[];

  beforeEach(() => {
    // Create temp directory
    testDir = join(tmpdir(), `aether-audit-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Mock console.log to capture output
    consoleOutput = [];
    originalConsoleLog = console.log;
    console.log = vi.fn((...args: unknown[]) => {
      consoleOutput.push(args.map((arg) => String(arg)).join(' '));
    });
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;

    // Clean up
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Basic Audit', () => {
    it('should show no violations when audit log is empty', async () => {
      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run();

      const output = consoleOutput.join('\n');
      expect(output).toContain('No rule violations found');
      expect(output).toContain('Compliance Rate: 100.0%');
    });

    it('should detect file violations in .ai/ directory', async () => {
      // Create .ai/ directory with a .json file (violation)
      const aiDir = join(testDir, '.ai');
      mkdirSync(aiDir, { recursive: true });
      writeFileSync(join(aiDir, 'test.json'), '{}');

      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run();

      const output = consoleOutput.join('\n');
      expect(output).toContain('Found 1 violation');
      expect(output).toContain('protected-ai-files');
      expect(output).toContain('.ai/test.json');
    });

    it('should detect planning docs in root', async () => {
      // Create planning doc in root (violation)
      writeFileSync(join(testDir, 'CLEANUP-PLAN.md'), '# Cleanup');

      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run();

      const output = consoleOutput.join('\n');
      expect(output).toContain('Found 1 violation');
      expect(output).toContain('no-root-clutter');
      expect(output).toContain('CLEANUP-PLAN.md');
    });
  });

  describe('Detailed Report', () => {
    it('should show detailed report with --report flag', async () => {
      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run({ report: true });

      const output = consoleOutput.join('\n');
      expect(output).toContain('AETHER RULE COMPLIANCE REPORT');
      expect(output).toContain('SUMMARY');
      expect(output).toContain('Total Operations:');
      expect(output).toContain('Compliance Rate:');
    });

    it('should group violations by rule in report', async () => {
      // Create multiple violations
      const aiDir = join(testDir, '.ai');
      mkdirSync(aiDir, { recursive: true });
      writeFileSync(join(aiDir, 'test1.json'), '{}');
      writeFileSync(join(aiDir, 'test2.json'), '{}');
      writeFileSync(join(testDir, 'CLEANUP-PLAN.md'), '# Cleanup');

      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run({ report: true });

      const output = consoleOutput.join('\n');
      expect(output).toContain('VIOLATIONS BY RULE');
      expect(output).toContain('protected-ai-files');
      expect(output).toContain('2 violation(s)');
      expect(output).toContain('no-root-clutter');
      expect(output).toContain('1 violation(s)');
    });

    it('should show recommendations in report', async () => {
      // Create violation
      const aiDir = join(testDir, '.ai');
      mkdirSync(aiDir, { recursive: true });
      writeFileSync(join(aiDir, 'test.json'), '{}');

      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run({ report: true });

      const output = consoleOutput.join('\n');
      expect(output).toContain('RECOMMENDATIONS');
      expect(output).toContain('Remove files from .ai/ directory');
      expect(output).toContain('rm .ai/test.json');
    });

    it('should set exit code 1 when violations found in report mode', async () => {
      // Create violation
      writeFileSync(join(testDir, 'CLEANUP-PLAN.md'), '# Cleanup');

      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run({ report: true });

      expect(process.exitCode).toBe(1);

      // Reset exit code
      process.exitCode = 0;
    });
  });

  describe('JSON Output', () => {
    it('should output JSON with --json flag', async () => {
      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run({ json: true });

      const output = consoleOutput.join('\n');
      const json = JSON.parse(output);

      expect(json).toHaveProperty('logViolations');
      expect(json).toHaveProperty('fileViolations');
      expect(json).toHaveProperty('compliance');
      expect(json).toHaveProperty('complianceRate');
      expect(json).toHaveProperty('violationsByRule');
      expect(json).toHaveProperty('totalOperations');
      expect(json).toHaveProperty('timestamp');
    });

    it('should include violations in JSON output', async () => {
      // Create violation
      const aiDir = join(testDir, '.ai');
      mkdirSync(aiDir, { recursive: true });
      writeFileSync(join(aiDir, 'test.json'), '{}');

      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run({ json: true });

      const output = consoleOutput.join('\n');
      const json = JSON.parse(output);

      expect(json.fileViolations).toHaveLength(1);
      expect(json.fileViolations[0].rule).toBe('protected-ai-files');
      expect(json.fileViolations[0].path).toBe('.ai/test.json');
      expect(json.violationsByRule['protected-ai-files']).toBe(1);
    });

    it('should calculate compliance rate correctly in JSON', async () => {
      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run({ json: true });

      const output = consoleOutput.join('\n');
      const json = JSON.parse(output);

      expect(json.complianceRate).toBe(1); // 100% when no violations
    });
  });

  describe('Utility Methods', () => {
    it('should clear audit log', async () => {
      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.clear();

      const output = consoleOutput.join('\n');
      expect(output).toContain('Audit log cleared');
    });

    it('should show audit log path', () => {
      const cmd = new AuditCommand({ cwd: testDir });
      cmd.showLogPath();

      const output = consoleOutput.join('\n');
      expect(output).toContain('Audit log:');
      expect(output).toContain('.lill/.audit.log');
    });
  });

  describe('Filtering', () => {
    it('should filter violations by date with --since', async () => {
      // This test would require creating violations with specific timestamps
      // For now, just verify the command accepts the option
      const cmd = new AuditCommand({ cwd: testDir });
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago

      await cmd.run({ since });

      const output = consoleOutput.join('\n');
      expect(output).toContain('No rule violations found');
    });
  });

  describe('Multiple Violations', () => {
    it('should detect multiple violations of same rule', async () => {
      // Create multiple .json files in .ai/
      const aiDir = join(testDir, '.ai');
      mkdirSync(aiDir, { recursive: true });
      writeFileSync(join(aiDir, 'test1.json'), '{}');
      writeFileSync(join(aiDir, 'test2.json'), '{}');
      writeFileSync(join(aiDir, 'test3.json'), '{}');

      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run();

      const output = consoleOutput.join('\n');
      expect(output).toContain('Found 3 violation');
    });

    it('should detect violations of different rules', async () => {
      // Create violations of different rules
      const aiDir = join(testDir, '.ai');
      mkdirSync(aiDir, { recursive: true });
      writeFileSync(join(aiDir, 'test.json'), '{}');
      writeFileSync(join(testDir, 'SESSION-1.md'), '# Session');
      writeFileSync(join(testDir, 'PHASE-1-COMPLETE.md'), '# Complete');

      const cmd = new AuditCommand({ cwd: testDir });
      await cmd.run();

      const output = consoleOutput.join('\n');
      expect(output).toContain('Found 3 violation');
      expect(output).toContain('protected-ai-files');
      expect(output).toContain('no-root-clutter');
    });
  });
});
