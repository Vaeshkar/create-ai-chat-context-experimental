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
});
