/**
 * WatcherConfigManager Tests
 * Phase 4.6: Watcher Configuration - October 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { WatcherConfigManager } from './WatcherConfigManager.js';

describe('WatcherConfigManager', () => {
  let testDir: string;
  let manager: WatcherConfigManager;

  beforeEach(() => {
    testDir = join(process.cwd(), '.test-watcher-config');
    mkdirSync(join(testDir, '.aicf'), { recursive: true });
    manager = new WatcherConfigManager(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('load', () => {
    it('should return error if config file does not exist', async () => {
      const result = await manager.load();
      expect(result.ok).toBe(false);
      expect(result.error.message).toContain('Watcher config file not found');
    });

    it('should load config from file', async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
          warp: { enabled: false, cachePath: '.cache/llm/warp', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');

      const result = await manager.load();
      expect(result.ok).toBe(true);
      expect(result.value.version).toBe('1.0');
      expect(result.value.platforms.augment).toBeDefined();
      expect(result.value.platforms.warp).toBeDefined();
    });
  });

  describe('getPlatformConfig', () => {
    beforeEach(async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
          warp: { enabled: false, cachePath: '.cache/llm/warp', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      await manager.load();
    });

    it('should get platform config', async () => {
      const result = manager.getPlatformConfig('augment');
      expect(result.ok).toBe(true);
      expect(result.value.enabled).toBe(true);
      expect(result.value.cachePath).toBe('.cache/llm/augment');
    });

    it('should return error for non-existent platform', async () => {
      const result = manager.getPlatformConfig('claude-desktop');
      expect(result.ok).toBe(false);
      expect(result.error.message).toContain('No config found');
    });
  });

  describe('isPlatformEnabled', () => {
    beforeEach(async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
          warp: { enabled: false, cachePath: '.cache/llm/warp', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      await manager.load();
    });

    it('should return true for enabled platform', () => {
      expect(manager.isPlatformEnabled('augment')).toBe(true);
    });

    it('should return false for disabled platform', () => {
      expect(manager.isPlatformEnabled('warp')).toBe(false);
    });

    it('should return false for non-existent platform', () => {
      expect(manager.isPlatformEnabled('claude-desktop')).toBe(false);
    });
  });

  describe('enablePlatform', () => {
    beforeEach(async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
          warp: { enabled: false, cachePath: '.cache/llm/warp', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      await manager.load();
    });

    it('should enable platform', async () => {
      const result = await manager.enablePlatform('warp');
      expect(result.ok).toBe(true);
      expect(manager.isPlatformEnabled('warp')).toBe(true);
    });

    it('should save to file', async () => {
      await manager.enablePlatform('warp');

      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const content = readFileSync(configFile, 'utf-8');
      const config = JSON.parse(content);
      expect(config.platforms.warp.enabled).toBe(true);
    });

    it('should update timestamp', async () => {
      const beforeUpdate = new Date();
      await manager.enablePlatform('warp');

      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const content = readFileSync(configFile, 'utf-8');
      const config = JSON.parse(content);
      expect(config.updated).toBeDefined();
      expect(new Date(config.updated).getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('disablePlatform', () => {
    beforeEach(async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
          warp: { enabled: true, cachePath: '.cache/llm/warp', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      await manager.load();
    });

    it('should disable platform', async () => {
      const result = await manager.disablePlatform('warp');
      expect(result.ok).toBe(true);
      expect(manager.isPlatformEnabled('warp')).toBe(false);
    });

    it('should save to file', async () => {
      await manager.disablePlatform('warp');

      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const content = readFileSync(configFile, 'utf-8');
      const config = JSON.parse(content);
      expect(config.platforms.warp.enabled).toBe(false);
    });
  });

  describe('updatePlatformLastChecked', () => {
    beforeEach(async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      await manager.load();
    });

    it('should update lastChecked timestamp', async () => {
      const result = await manager.updatePlatformLastChecked('augment');
      expect(result.ok).toBe(true);

      const config = manager.getPlatformConfig('augment');
      expect(config.value.lastChecked).toBeDefined();
    });

    it('should save to file', async () => {
      await manager.updatePlatformLastChecked('augment');

      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const content = readFileSync(configFile, 'utf-8');
      const config = JSON.parse(content);
      expect(config.platforms.augment.lastChecked).toBeDefined();
    });
  });

  describe('updatePlatformDataCount', () => {
    beforeEach(async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      await manager.load();
    });

    it('should update data count', async () => {
      const result = await manager.updatePlatformDataCount('augment', 42);
      expect(result.ok).toBe(true);

      const config = manager.getPlatformConfig('augment');
      expect(config.value.dataCount).toBe(42);
    });

    it('should save to file', async () => {
      await manager.updatePlatformDataCount('augment', 42);

      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const content = readFileSync(configFile, 'utf-8');
      const config = JSON.parse(content);
      expect(config.platforms.augment.dataCount).toBe(42);
    });
  });

  describe('getWatcherSettings', () => {
    beforeEach(async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      await manager.load();
    });

    it('should get watcher settings', () => {
      const result = manager.getWatcherSettings();
      expect(result.ok).toBe(true);
      expect(result.value.interval).toBe(5000);
      expect(result.value.verbose).toBe(false);
      expect(result.value.daemonMode).toBe(true);
    });
  });

  describe('updateWatcherSettings', () => {
    beforeEach(async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      await manager.load();
    });

    it('should update watcher settings', async () => {
      const result = await manager.updateWatcherSettings({ interval: 10000, verbose: true });
      expect(result.ok).toBe(true);

      const settings = manager.getWatcherSettings();
      expect(settings.value.interval).toBe(10000);
      expect(settings.value.verbose).toBe(true);
    });

    it('should save to file', async () => {
      await manager.updateWatcherSettings({ interval: 10000 });

      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const content = readFileSync(configFile, 'utf-8');
      const config = JSON.parse(content);
      expect(config.watcher.interval).toBe(10000);
    });
  });

  describe('getEnabledPlatforms', () => {
    beforeEach(async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
          warp: { enabled: false, cachePath: '.cache/llm/warp', checkInterval: 5000 },
          'claude-desktop': { enabled: true, cachePath: '.cache/llm/claude', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
      await manager.load();
    });

    it('should return only enabled platforms', () => {
      const enabled = manager.getEnabledPlatforms();
      expect(enabled).toContain('augment');
      expect(enabled).toContain('claude-desktop');
      expect(enabled).not.toContain('warp');
      expect(enabled.length).toBe(2);
    });
  });

  describe('integration', () => {
    it('should handle full workflow: load, enable, update, disable', async () => {
      const configFile = join(testDir, '.aicf', '.watcher-config.json');
      const config = {
        version: '1.0',
        platforms: {
          augment: { enabled: true, cachePath: '.cache/llm/augment', checkInterval: 5000 },
          warp: { enabled: false, cachePath: '.cache/llm/warp', checkInterval: 5000 },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      };
      require('fs').writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');

      // Load
      let result = await manager.load();
      expect(result.ok).toBe(true);

      // Enable warp
      result = await manager.enablePlatform('warp');
      expect(result.ok).toBe(true);
      expect(manager.isPlatformEnabled('warp')).toBe(true);

      // Update data count
      result = await manager.updatePlatformDataCount('warp', 10);
      expect(result.ok).toBe(true);

      // Update last checked
      result = await manager.updatePlatformLastChecked('warp');
      expect(result.ok).toBe(true);

      // Get enabled platforms
      const enabled = manager.getEnabledPlatforms();
      expect(enabled).toContain('augment');
      expect(enabled).toContain('warp');

      // Disable warp
      result = await manager.disablePlatform('warp');
      expect(result.ok).toBe(true);
      expect(manager.isPlatformEnabled('warp')).toBe(false);
    });
  });
});

