/**
 * Watcher Config Manager
 * Phase 4.6: Watcher Configuration - October 2025
 *
 * Manages watcher configuration and platform settings
 * Reads/writes .aicf/.watcher-config.json file
 */

import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Result, Ok, Err } from '../types/result.js';

export type PlatformName = 'augment' | 'warp' | 'claude-desktop' | 'copilot' | 'chatgpt';

export interface PlatformConfig {
  enabled: boolean;
  cachePath: string;
  checkInterval: number;
  lastChecked?: string;
  dataCount?: number;
}

export interface WatcherSettings {
  interval: number;
  verbose: boolean;
  daemonMode: boolean;
  pidFile: string;
  logFile: string;
}

export interface WatcherConfigData {
  version: string;
  platforms: Record<PlatformName, PlatformConfig>;
  watcher: WatcherSettings;
  created: string;
  updated?: string;
}

/**
 * Watcher Config Manager for managing platform settings and watcher configuration
 */
export class WatcherConfigManager {
  private configFile: string;
  private data: WatcherConfigData | null = null;

  constructor(projectPath: string = process.cwd()) {
    this.configFile = join(projectPath, '.aicf', '.watcher-config.json');
  }

  /**
   * Load configuration from file
   */
  async load(): Promise<Result<WatcherConfigData>> {
    try {
      if (!existsSync(this.configFile)) {
        return Err(new Error('Watcher config file not found'));
      }

      const content = readFileSync(this.configFile, 'utf-8');
      this.data = JSON.parse(content) as WatcherConfigData;

      return Ok(this.data);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get platform configuration
   */
  getPlatformConfig(platform: PlatformName): Result<PlatformConfig> {
    if (!this.data) {
      return Err(new Error('Config not loaded'));
    }

    const config = this.data.platforms[platform];
    if (!config) {
      return Err(new Error(`No config found for platform: ${platform}`));
    }

    return Ok(config);
  }

  /**
   * Check if platform is enabled
   */
  isPlatformEnabled(platform: PlatformName): boolean {
    const result = this.getPlatformConfig(platform);
    if (!result.ok) return false;
    return result.value.enabled;
  }

  /**
   * Enable platform
   */
  async enablePlatform(platform: PlatformName): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('Config not loaded'));
      }

      if (this.data.platforms[platform]) {
        this.data.platforms[platform].enabled = true;
        this.data.updated = new Date().toISOString();
        await this.save();
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Disable platform
   */
  async disablePlatform(platform: PlatformName): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('Config not loaded'));
      }

      if (this.data.platforms[platform]) {
        this.data.platforms[platform].enabled = false;
        this.data.updated = new Date().toISOString();
        await this.save();
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Update platform last checked timestamp
   */
  async updatePlatformLastChecked(platform: PlatformName): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('Config not loaded'));
      }

      if (this.data.platforms[platform]) {
        this.data.platforms[platform].lastChecked = new Date().toISOString();
        this.data.updated = new Date().toISOString();
        await this.save();
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Update platform data count
   */
  async updatePlatformDataCount(platform: PlatformName, count: number): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('Config not loaded'));
      }

      if (this.data.platforms[platform]) {
        this.data.platforms[platform].dataCount = count;
        this.data.updated = new Date().toISOString();
        await this.save();
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get watcher settings
   */
  getWatcherSettings(): Result<WatcherSettings> {
    if (!this.data) {
      return Err(new Error('Config not loaded'));
    }

    return Ok(this.data.watcher);
  }

  /**
   * Update watcher settings
   */
  async updateWatcherSettings(settings: Partial<WatcherSettings>): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('Config not loaded'));
      }

      this.data.watcher = {
        ...this.data.watcher,
        ...settings,
      };
      this.data.updated = new Date().toISOString();
      await this.save();

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get all enabled platforms
   */
  getEnabledPlatforms(): PlatformName[] {
    if (!this.data) {
      return [];
    }

    return Object.entries(this.data.platforms)
      .filter(([, config]) => config.enabled)
      .map(([name]) => name as PlatformName);
  }

  /**
   * Save configuration to file
   */
  private async save(): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('No data to save'));
      }

      const content = JSON.stringify(this.data, null, 2);
      writeFileSync(this.configFile, content, 'utf-8');

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
