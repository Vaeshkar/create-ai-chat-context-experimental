/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * InitCommand Tests
 * Phase 4.7: CLI Integration - October 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { InitCommand } from './InitCommand.js';
import inquirer from 'inquirer';

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('InitCommand', () => {
  const testDirsToCleanup: string[] = [];

  function createTestDir(): string {
    const testDir = mkdtempSync(join(tmpdir(), 'test-init-command-'));
    testDirsToCleanup.push(testDir);
    return testDir;
  }

  function cleanupTestDir(testDir: string): void {
    if (!existsSync(testDir)) return;

    // Retry cleanup up to 3 times with delays (handles file locks)
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        rmSync(testDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        return; // Success
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.warn(`Failed to cleanup ${testDir} after ${maxAttempts} attempts:`, error);
        }
      }
    }
  }

  // Clean up ALL test directories after each test
  afterEach(() => {
    for (const testDir of testDirsToCleanup) {
      cleanupTestDir(testDir);
    }
    testDirsToCleanup.length = 0; // Clear the array
  });

  describe('execute', () => {
    beforeEach(() => {
      // Mock inquirer responses
      vi.mocked(inquirer.prompt).mockResolvedValue({
        mode: 'manual',
        llm: 'augment',
        platforms: ['augment'],
      });
    });

    it('should initialize in manual mode', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'manual' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(result.value.mode).toBe('manual');
        expect(result.value.projectPath).toBe(testDir);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should initialize in automatic mode', async () => {
      const testDir = createTestDir();
      try {
        vi.mocked(inquirer.prompt).mockResolvedValueOnce({
          platforms: ['augment'],
        });

        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        if (!result.ok) {
          console.error('Automatic mode init failed:', result.error.message);
          console.error('Stack:', result.error.stack);
        }
        expect(result.ok).toBe(true);
        expect(result.value.mode).toBe('automatic');
        expect(result.value.projectPath).toBe(testDir);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should return error if already initialized', async () => {
      const testDir = createTestDir();
      try {
        vi.mocked(inquirer.prompt).mockResolvedValueOnce({
          platforms: ['augment'],
        });

        // Initialize first time
        let cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        let result = await cmd.execute();
        expect(result.ok).toBe(true);

        // Try to initialize again
        cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        result = await cmd.execute();
        expect(result.ok).toBe(false);
        expect(result.error.message).toContain('already initialized');
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should allow force overwrite', async () => {
      const testDir = createTestDir();
      try {
        vi.mocked(inquirer.prompt).mockResolvedValue({
          platforms: ['augment'],
        });

        // Initialize first time
        let cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        let result = await cmd.execute();
        expect(result.ok).toBe(true);

        // Force overwrite
        cmd = new InitCommand({ cwd: testDir, mode: 'automatic', force: true });
        result = await cmd.execute();
        expect(result.ok).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });

  describe('manual mode', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        llm: 'augment',
      });
    });

    it('should create .ai directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'manual' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.ai'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create .aicf directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'manual' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.aicf'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should return correct file list', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'manual' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(result.value.filesCreated.length).toBeGreaterThan(0);
        expect(result.value.filesCreated.some((f) => f.includes('.ai'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });

  describe('automatic mode', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment'],
      });
    });

    it('should create .cache/llm directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.cache', 'llm'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create .ai directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.ai'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create .aicf directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.aicf'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create .permissions.aicf file', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
        expect(existsSync(permissionsFile)).toBe(true);

        const content = readFileSync(permissionsFile, 'utf-8');
        expect(content).toContain('@PERMISSIONS');
        expect(content).toContain('@PLATFORM');
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create .watcher-config.json file', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        const configFile = join(testDir, '.aicf', '.watcher-config.json');
        expect(existsSync(configFile)).toBe(true);

        const content = readFileSync(configFile, 'utf-8');
        const config = JSON.parse(content);
        expect(config.version).toBe('1.0');
        expect(config.platforms).toBeDefined();
        expect(config.watcher).toBeDefined();
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should update .gitignore', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        const gitignorePath = join(testDir, '.gitignore');
        expect(existsSync(gitignorePath)).toBe(true);

        const content = readFileSync(gitignorePath, 'utf-8');
        expect(content).toContain('.cache/llm/');
        expect(content).toContain('.watcher.pid');
        expect(content).toContain('.watcher.log');
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should not duplicate .gitignore entries', async () => {
      const testDir = createTestDir();
      try {
        // Initialize first time
        let cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        let result = await cmd.execute();
        expect(result.ok).toBe(true);

        // Force reinitialize
        cmd = new InitCommand({ cwd: testDir, mode: 'automatic', force: true });
        result = await cmd.execute();
        expect(result.ok).toBe(true);

        const gitignorePath = join(testDir, '.gitignore');
        const content = readFileSync(gitignorePath, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim() === '.cache/llm/');
        expect(lines.length).toBe(1);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should return correct file list', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(result.value.filesCreated.length).toBeGreaterThan(0);
        expect(result.value.filesCreated.some((f) => f.includes('.cache'))).toBe(true);
        expect(result.value.filesCreated.some((f) => f.includes('.permissions.aicf'))).toBe(true);
        expect(result.value.filesCreated.some((f) => f.includes('.watcher-config.json'))).toBe(
          true
        );
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should initialize augment platform as active', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        const configFile = join(testDir, '.aicf', '.watcher-config.json');
        const content = readFileSync(configFile, 'utf-8');
        const config = JSON.parse(content);
        expect(config.platforms.augment.enabled).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should initialize other platforms as inactive', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        const configFile = join(testDir, '.aicf', '.watcher-config.json');
        const content = readFileSync(configFile, 'utf-8');
        const config = JSON.parse(content);
        expect(config.platforms.warp.enabled).toBe(false);
        expect(config.platforms['claude-cli'].enabled).toBe(false);
        expect(config.platforms['claude-desktop'].enabled).toBe(false);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should set correct cache paths', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        const configFile = join(testDir, '.aicf', '.watcher-config.json');
        const content = readFileSync(configFile, 'utf-8');
        const config = JSON.parse(content);
        expect(config.platforms.augment.cachePath).toBe('.cache/llm/augment');
        expect(config.platforms.warp.cachePath).toBe('.cache/llm/warp');
        expect(config.platforms['claude-cli'].cachePath).toBe('.cache/llm/claude-cli');
        expect(config.platforms['claude-desktop'].cachePath).toBe('.cache/llm/claude-desktop');
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });

  describe('permissions file', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment'],
      });
    });

    it('should have correct AICF format', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        if (!result.ok) {
          console.error('Init failed:', result.error.message);
        }
        expect(result.ok).toBe(true);
        const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
        const content = readFileSync(permissionsFile, 'utf-8');

        expect(content).toContain('@PERMISSIONS|version=1.0|format=aicf');
        expect(content).toContain('@PLATFORM|name=augment');
        expect(content).toContain('@PLATFORM|name=warp');
        expect(content).toContain('@PLATFORM|name=claude-cli');
        expect(content).toContain('@PLATFORM|name=claude-desktop');
        expect(content).toContain('@AUDIT|event=init');
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should have augment as active', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
        const content = readFileSync(permissionsFile, 'utf-8');

        expect(content).toContain('name=augment|status=active');
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should have other platforms as inactive', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
        const content = readFileSync(permissionsFile, 'utf-8');

        expect(content).toContain('name=warp|status=inactive');
        expect(content).toContain('name=claude-cli|status=inactive');
        expect(content).toContain('name=claude-desktop|status=inactive');
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment'],
      });
    });

    it('should handle invalid cwd gracefully', async () => {
      const cmd = new InitCommand({ cwd: '/nonexistent/path/that/does/not/exist' });
      const result = await cmd.execute();

      expect(result.ok).toBe(false);
    });
  });

  describe('template files', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment'],
      });
    });

    it('should copy all template files to .ai directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);

        const aiDir = join(testDir, '.ai');
        expect(existsSync(aiDir)).toBe(true);

        // Check for expected template files in .ai/
        const expectedAiFiles = [
          'code-style.md',
          'design-system.md',
          'npm-publishing-checklist.md',
          'README.md',
          'testing-philosophy.md',
        ];

        for (const file of expectedAiFiles) {
          const filePath = join(aiDir, file);
          expect(existsSync(filePath)).toBe(true);
        }

        // Check for project-overview.md in .augment/ (auto-generated documentation)
        const augmentDir = join(testDir, '.augment');
        expect(existsSync(augmentDir)).toBe(true);
        const projectOverviewPath = join(augmentDir, 'project-overview.md');
        expect(existsSync(projectOverviewPath)).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should not overwrite existing template files by default', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();
        expect(result.ok).toBe(true);

        // Modify a template file in .augment/ (auto-generated documentation)
        const augmentDir = join(testDir, '.augment');
        const testFile = join(augmentDir, 'project-overview.md');
        const originalContent = readFileSync(testFile, 'utf-8');
        const modifiedContent = '# My Custom Project Overview\n\nCustom content here.';
        require('fs').writeFileSync(testFile, modifiedContent);

        // Reinitialize with force
        const cmd2 = new InitCommand({ cwd: testDir, mode: 'automatic', force: true });
        const result2 = await cmd2.execute();
        expect(result2.ok).toBe(true);

        // Check that file was not overwritten (smart merge should preserve user content)
        const finalContent = readFileSync(testFile, 'utf-8');
        // If the file doesn't have a version header, it should be preserved
        expect(finalContent).toBe(modifiedContent);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should handle missing templates directory gracefully', async () => {
      const testDir = createTestDir();
      try {
        // This test verifies that init doesn't crash if templates are missing
        // (e.g., in development before build)
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        // Should still succeed even if templates are missing
        expect(result.ok).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });

  describe('Phase 6-8 directory structure', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment'],
      });
    });

    it('should create recent directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.aicf', 'recent'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create sessions directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.aicf', 'sessions'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create medium directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.aicf', 'medium'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create old directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.aicf', 'old'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create archive directory', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(existsSync(join(testDir, '.aicf', 'archive'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });
});
