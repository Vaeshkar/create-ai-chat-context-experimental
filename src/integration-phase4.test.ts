/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Phase 4 Integration Tests
 * End-to-End testing for InitCommand, PermissionManager, WatcherConfigManager
 * October 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { InitCommand } from './commands/InitCommand.js';
import { PermissionManager } from './core/PermissionManager.js';
import { WatcherConfigManager } from './core/WatcherConfigManager.js';
import inquirer from 'inquirer';

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('Phase 4 Integration Tests', () => {
  let testDirCounter = 0;

  function createTestDir(): string {
    const testDir = join(process.cwd(), `.test-phase4-${testDirCounter++}`);
    mkdirSync(testDir, { recursive: true });
    return testDir;
  }

  function cleanupTestDir(testDir: string): void {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  }

  describe('Manual Mode Workflow', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        llm: 'augment',
      });
    });

    it('should initialize project in manual mode', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'manual' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(result.value.mode).toBe('manual');
        expect(existsSync(join(testDir, '.ai'))).toBe(true);
        expect(existsSync(join(testDir, '.aicf'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create proper directory structure for manual mode', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'manual' });
        await cmd.execute();

        // Verify directory structure
        expect(existsSync(join(testDir, '.ai'))).toBe(true);
        expect(existsSync(join(testDir, '.aicf'))).toBe(true);

        // Manual mode doesn't create .gitignore (that's handled by create-ai-chat-context)
        // But automatic mode should
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });

  describe('Automatic Mode Workflow', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment'],
      });
    });

    it('should initialize project in automatic mode', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const result = await cmd.execute();

        expect(result.ok).toBe(true);
        expect(result.value.mode).toBe('automatic');
        expect(existsSync(join(testDir, '.cache', 'llm'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create all required files in automatic mode', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        await cmd.execute();

        // Verify all files exist
        expect(existsSync(join(testDir, '.ai'))).toBe(true);
        expect(existsSync(join(testDir, '.aicf'))).toBe(true);
        expect(existsSync(join(testDir, '.cache', 'llm'))).toBe(true);
        expect(existsSync(join(testDir, '.aicf', '.permissions.aicf'))).toBe(true);
        expect(existsSync(join(testDir, '.aicf', '.watcher-config.json'))).toBe(true);
        expect(existsSync(join(testDir, '.gitignore'))).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should initialize PermissionManager after automatic init', async () => {
      const testDir = createTestDir();
      try {
        // Initialize project
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        await cmd.execute();

        // Load permissions
        const permMgr = new PermissionManager(testDir);
        const loadResult = await permMgr.load();

        expect(loadResult.ok).toBe(true);
        expect(permMgr.isEnabled('augment')).toBe(true);
        expect(permMgr.isEnabled('warp')).toBe(false);
        expect(permMgr.isEnabled('claude-desktop')).toBe(false);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should initialize WatcherConfigManager after automatic init', async () => {
      const testDir = createTestDir();
      try {
        // Initialize project
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        await cmd.execute();

        // Load config
        const configMgr = new WatcherConfigManager(testDir);
        const loadResult = await configMgr.load();

        expect(loadResult.ok).toBe(true);
        expect(configMgr.isPlatformEnabled('augment')).toBe(true);
        expect(configMgr.isPlatformEnabled('warp')).toBe(false);

        const settings = configMgr.getWatcherSettings();
        expect(settings.ok).toBe(true);
        expect(settings.value.interval).toBe(300000); // 5 minutes
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });

  describe('Permission Management Workflow', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment'],
      });
    });

    it('should grant and revoke permissions', async () => {
      const testDir = createTestDir();
      try {
        // Initialize
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        await cmd.execute();

        const permMgr = new PermissionManager(testDir);
        await permMgr.load();

        // Grant permission to warp
        let result = await permMgr.grantPermission('warp', 'explicit');
        expect(result.ok).toBe(true);
        expect(permMgr.isEnabled('warp')).toBe(true);

        // Revoke permission
        result = await permMgr.revokePermission('warp');
        expect(result.ok).toBe(true);
        expect(permMgr.isEnabled('warp')).toBe(false);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should track audit log for permission changes', async () => {
      const testDir = createTestDir();
      try {
        // Initialize
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        await cmd.execute();

        const permMgr = new PermissionManager(testDir);
        await permMgr.load();

        // Grant permission
        await permMgr.grantPermission('warp', 'explicit');

        // Reload and verify audit entry exists
        const permMgr2 = new PermissionManager(testDir);
        const loadResult = await permMgr2.load();
        expect(loadResult.ok).toBe(true);

        // Verify permissions file has audit entries
        const permFile = readFileSync(join(testDir, '.aicf', '.permissions.aicf'), 'utf-8');
        expect(permFile).toContain('@AUDIT');
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });

  describe('Watcher Configuration Workflow', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment'],
      });
    });

    it('should enable/disable platforms via config manager', async () => {
      const testDir = createTestDir();
      try {
        // Initialize
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        await cmd.execute();

        const configMgr = new WatcherConfigManager(testDir);
        await configMgr.load();

        // Enable warp
        let result = await configMgr.enablePlatform('warp');
        expect(result.ok).toBe(true);
        expect(configMgr.isPlatformEnabled('warp')).toBe(true);

        // Disable warp
        result = await configMgr.disablePlatform('warp');
        expect(result.ok).toBe(true);
        expect(configMgr.isPlatformEnabled('warp')).toBe(false);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should update platform metadata', async () => {
      const testDir = createTestDir();
      try {
        // Initialize
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        await cmd.execute();

        const configMgr = new WatcherConfigManager(testDir);
        await configMgr.load();

        // Update last checked
        let result = await configMgr.updatePlatformLastChecked('augment');
        expect(result.ok).toBe(true);

        // Update data count
        result = await configMgr.updatePlatformDataCount('augment', 42);
        expect(result.ok).toBe(true);

        // Verify updates persisted
        const configMgr2 = new WatcherConfigManager(testDir);
        await configMgr2.load();
        const config = configMgr2.getPlatformConfig('augment');
        expect(config.value.dataCount).toBe(42);
        expect(config.value.lastChecked).toBeDefined();
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should get list of enabled platforms', async () => {
      const testDir = createTestDir();
      try {
        // Initialize
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        await cmd.execute();

        const configMgr = new WatcherConfigManager(testDir);
        await configMgr.load();

        // Initially only augment is enabled
        let enabled = configMgr.getEnabledPlatforms();
        expect(enabled).toContain('augment');
        expect(enabled).not.toContain('warp');

        // Enable warp
        await configMgr.enablePlatform('warp');
        enabled = configMgr.getEnabledPlatforms();
        expect(enabled).toContain('augment');
        expect(enabled).toContain('warp');
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });

  describe('Full Initialization Workflow', () => {
    beforeEach(() => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        platforms: ['augment'],
      });
    });

    it('should complete full automatic mode setup', async () => {
      const testDir = createTestDir();
      try {
        // Step 1: Initialize
        const cmd = new InitCommand({ cwd: testDir, mode: 'automatic' });
        const initResult = await cmd.execute();
        expect(initResult.ok).toBe(true);

        // Step 2: Load permissions
        const permMgr = new PermissionManager(testDir);
        const permResult = await permMgr.load();
        expect(permResult.ok).toBe(true);

        // Step 3: Load config
        const configMgr = new WatcherConfigManager(testDir);
        const configResult = await configMgr.load();
        expect(configResult.ok).toBe(true);

        // Step 4: Verify state
        expect(permMgr.isEnabled('augment')).toBe(true);
        expect(configMgr.isPlatformEnabled('augment')).toBe(true);

        // Step 5: Make changes
        await permMgr.grantPermission('warp', 'explicit');
        await configMgr.enablePlatform('warp');

        // Step 6: Verify persistence
        const permMgr2 = new PermissionManager(testDir);
        const configMgr2 = new WatcherConfigManager(testDir);
        await permMgr2.load();
        await configMgr2.load();

        expect(permMgr2.isEnabled('warp')).toBe(true);
        expect(configMgr2.isPlatformEnabled('warp')).toBe(true);
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });
});
