import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadConfig, saveConfig, getConfigValue, setConfigValue, getConfigPath } from './Config';

const TEST_DIR = path.join(process.cwd(), '.test-config');

describe('Config', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('getConfigPath', () => {
    it('should return correct config path', () => {
      const configPath = getConfigPath(TEST_DIR);
      expect(configPath).toBe(path.join(TEST_DIR, '.ai/config.json'));
    });
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', async () => {
      const config = await loadConfig(TEST_DIR);
      expect(config).toEqual({
        preferredModel: null,
        showAllModels: false,
        useAiNativeFormat: false,
      });
    });

    it('should load existing config', async () => {
      const testConfig = {
        preferredModel: 'gpt-4',
        showAllModels: true,
        useAiNativeFormat: true,
      };

      const configPath = getConfigPath(TEST_DIR);
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, testConfig);

      const config = await loadConfig(TEST_DIR);
      expect(config).toEqual(testConfig);
    });

    it('should merge loaded config with defaults', async () => {
      const partialConfig = { preferredModel: 'claude-3' };

      const configPath = getConfigPath(TEST_DIR);
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, partialConfig);

      const config = await loadConfig(TEST_DIR);
      expect(config.preferredModel).toBe('claude-3');
      expect(config.showAllModels).toBe(false);
      expect(config.useAiNativeFormat).toBe(false);
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', async () => {
      const testConfig = {
        preferredModel: 'gpt-4',
        showAllModels: true,
      };

      const saved = await saveConfig(testConfig, TEST_DIR);
      expect(saved.preferredModel).toBe('gpt-4');
      expect(saved.showAllModels).toBe(true);

      const configPath = getConfigPath(TEST_DIR);
      const fileContent = await fs.readJson(configPath);
      expect(fileContent.preferredModel).toBe('gpt-4');
    });

    it('should merge with existing config', async () => {
      const initialConfig = {
        preferredModel: 'gpt-4',
        showAllModels: true,
        useAiNativeFormat: false,
      };

      const configPath = getConfigPath(TEST_DIR);
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, initialConfig);

      const updateConfig = { useAiNativeFormat: true };
      const saved = await saveConfig(updateConfig, TEST_DIR);

      expect(saved.preferredModel).toBe('gpt-4');
      expect(saved.showAllModels).toBe(true);
      expect(saved.useAiNativeFormat).toBe(true);
    });
  });

  describe('getConfigValue', () => {
    it('should get specific config value', async () => {
      const testConfig = {
        preferredModel: 'claude-3',
        showAllModels: false,
        useAiNativeFormat: true,
      };

      const configPath = getConfigPath(TEST_DIR);
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, testConfig);

      const value = await getConfigValue('preferredModel', TEST_DIR);
      expect(value).toBe('claude-3');
    });
  });

  describe('setConfigValue', () => {
    it('should set specific config value', async () => {
      await setConfigValue('preferredModel', 'gpt-4', TEST_DIR);

      const value = await getConfigValue('preferredModel', TEST_DIR);
      expect(value).toBe('gpt-4');
    });

    it('should preserve other config values', async () => {
      await saveConfig({ showAllModels: true }, TEST_DIR);
      await setConfigValue('preferredModel', 'claude-3', TEST_DIR);

      const showAllModels = await getConfigValue('showAllModels', TEST_DIR);
      expect(showAllModels).toBe(true);
    });
  });
});

