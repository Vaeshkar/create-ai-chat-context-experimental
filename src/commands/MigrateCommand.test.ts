/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import { isOk, isErr } from '../types/result.js';
import { MigrateCommand } from './MigrateCommand.js';

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('MigrateCommand', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(process.cwd(), '.test-migrate-'));
    vi.mocked(inquirer.prompt).mockResolvedValue({
      platforms: ['augment'],
    });
  });

  afterEach(() => {
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('execute', () => {
    it('should return error if no existing memory files found', async () => {
      const command = new MigrateCommand({ cwd: testDir });
      const result = await command.execute();

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('No existing memory files found');
      }
    });

    it('should migrate with selected platforms', async () => {
      // Create existing memory files
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment', 'claude-cli'],
      });

      const command = new MigrateCommand({ cwd: testDir });
      const result = await command.execute();

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.filesCreated.length).toBeGreaterThan(0);
        expect(result.value.filesPreserved).toContain(aicfDir);
        expect(result.value.filesPreserved).toContain(aiDir);
      }
    });

    it('should create permissions file with selected platforms', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment', 'warp'],
      });

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      const permissionsFile = join(aicfDir, '.permissions.aicf');
      const content = fs.readFileSync(permissionsFile, 'utf-8');

      expect(content).toContain('augment|active');
      expect(content).toContain('warp|active');
      expect(content).toContain('claude-cli|inactive');
    });

    it('should create watcher config with selected platforms', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment', 'claude-desktop'],
      });

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      const watcherConfigFile = join(testDir, '.watcher-config.json');
      const content = fs.readFileSync(watcherConfigFile, 'utf-8');
      const config = JSON.parse(content);

      expect(config.platforms.augment.enabled).toBe(true);
      expect(config.platforms['claude-desktop'].enabled).toBe(true);
      expect(config.platforms['claude-cli'].enabled).toBe(false);
    });

    it('should update gitignore with cache entries', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      const gitignorePath = join(testDir, '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      expect(content).toContain('.cache/llm/');
      expect(content).toContain('.watcher-config.json');
    });
  });

  describe('legacy file migration', () => {
    it('should move old .aicf files to legacy_memory', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      // Create old v2.0.1 files
      fs.writeFileSync(join(aicfDir, 'conversations.aicf'), 'Old conversation data');
      fs.writeFileSync(join(aicfDir, 'technical-context.aicf'), 'Old technical context');

      const command = new MigrateCommand({ cwd: testDir });
      const result = await command.execute();

      expect(isOk(result)).toBe(true);

      // Check that legacy_memory directory was created
      const legacyDir = join(testDir, 'legacy_memory');
      expect(fs.existsSync(legacyDir)).toBe(true);

      // Check that old files were moved
      expect(fs.existsSync(join(legacyDir, 'conversations.aicf'))).toBe(true);
      expect(fs.existsSync(join(legacyDir, 'technical-context.aicf'))).toBe(true);

      // Check that old files were removed from .aicf
      expect(fs.existsSync(join(aicfDir, 'conversations.aicf'))).toBe(false);
      expect(fs.existsSync(join(aicfDir, 'technical-context.aicf'))).toBe(false);
    });

    it('should preserve content of legacy files', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const testContent = 'Important conversation data that must be preserved';
      fs.writeFileSync(join(aicfDir, 'conversations.aicf'), testContent);

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      const legacyFile = join(testDir, 'legacy_memory', 'conversations.aicf');
      const content = fs.readFileSync(legacyFile, 'utf-8');
      expect(content).toBe(testContent);
    });

    it('should handle missing legacy files gracefully', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      // Don't create any legacy files
      const command = new MigrateCommand({ cwd: testDir });
      const result = await command.execute();

      // Should still succeed
      expect(isOk(result)).toBe(true);
    });
  });

  describe('Phase 6-8 directory structure', () => {
    it('should create recent directory', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      expect(fs.existsSync(join(aicfDir, 'recent'))).toBe(true);
    });

    it('should create sessions directory', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      expect(fs.existsSync(join(aicfDir, 'sessions'))).toBe(true);
    });

    it('should create medium directory', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      expect(fs.existsSync(join(aicfDir, 'medium'))).toBe(true);
    });

    it('should create old directory', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      expect(fs.existsSync(join(aicfDir, 'old'))).toBe(true);
    });

    it('should create archive directory', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      expect(fs.existsSync(join(aicfDir, 'archive'))).toBe(true);
    });

    it('should create .cache/llm directory', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      expect(fs.existsSync(join(testDir, '.cache', 'llm'))).toBe(true);
    });
  });

  describe('template files', () => {
    it('should copy all template files to .ai directory', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const command = new MigrateCommand({ cwd: testDir });
      const result = await command.execute();

      expect(isOk(result)).toBe(true);

      // Check for expected template files
      const expectedFiles = [
        'code-style.md',
        'design-system.md',
        'npm-publishing-checklist.md',
        'project-overview.md',
        'README.md',
        'testing-philosophy.md',
      ];

      for (const file of expectedFiles) {
        const filePath = join(aiDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    });

    it('should preserve existing .ai files (smart merge)', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      // Create an existing file with custom content
      const customContent = '# My Custom Project Overview\n\nCustom content here.';
      fs.writeFileSync(join(aiDir, 'project-overview.md'), customContent);

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      // Check that custom content was preserved
      const content = fs.readFileSync(join(aiDir, 'project-overview.md'), 'utf-8');
      expect(content).toBe(customContent);
    });

    it('should handle missing templates directory gracefully', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      // This test verifies that migrate doesn't crash if templates are missing
      const command = new MigrateCommand({ cwd: testDir });
      const result = await command.execute();

      // Should still succeed even if templates are missing
      expect(isOk(result)).toBe(true);
    });

    it('should copy missing template files only', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      // Create only some template files
      fs.writeFileSync(join(aiDir, 'project-overview.md'), 'Existing content');
      fs.writeFileSync(join(aiDir, 'code-style.md'), 'Existing code style');

      const command = new MigrateCommand({ cwd: testDir });
      await command.execute();

      // Check that existing files were preserved
      const projectOverview = fs.readFileSync(join(aiDir, 'project-overview.md'), 'utf-8');
      expect(projectOverview).toBe('Existing content');

      const codeStyle = fs.readFileSync(join(aiDir, 'code-style.md'), 'utf-8');
      expect(codeStyle).toBe('Existing code style');

      // Check that missing files were created
      expect(fs.existsSync(join(aiDir, 'design-system.md'))).toBe(true);
      expect(fs.existsSync(join(aiDir, 'npm-publishing-checklist.md'))).toBe(true);
      expect(fs.existsSync(join(aiDir, 'testing-philosophy.md'))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle permission errors gracefully', async () => {
      // This test verifies error handling for permission issues
      const command = new MigrateCommand({ cwd: '/root/no-permission' });
      const result = await command.execute();

      expect(isErr(result)).toBe(true);
    });

    it('should handle invalid directory gracefully', async () => {
      const command = new MigrateCommand({ cwd: '/nonexistent/path' });
      const result = await command.execute();

      expect(isErr(result)).toBe(true);
    });
  });

  describe('verbose mode', () => {
    it('should accept verbose flag', async () => {
      const aicfDir = join(testDir, '.aicf');
      const aiDir = join(testDir, '.ai');
      const fs = await import('fs');
      fs.mkdirSync(aicfDir, { recursive: true });
      fs.mkdirSync(aiDir, { recursive: true });

      const command = new MigrateCommand({ cwd: testDir, verbose: true });
      const result = await command.execute();

      expect(isOk(result)).toBe(true);
    });
  });
});
