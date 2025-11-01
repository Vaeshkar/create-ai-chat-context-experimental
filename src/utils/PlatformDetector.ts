/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Platform Detector
 * Auto-detects available LLM platforms on the system
 * Phase 6: November 2025
 */

import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { AugmentLevelDBReader } from '../readers/AugmentLevelDBReader.js';
import { ClaudeCliWatcher } from '../watchers/ClaudeCliWatcher.js';
import { ClaudeDesktopWatcher } from '../watchers/ClaudeDesktopWatcher.js';

export interface PlatformDetectionResult {
  platform: string;
  available: boolean;
  path?: string;
  conversationCount?: number;
  databaseCount?: number;
  size?: string;
}

export interface PlatformDetectionSummary {
  platforms: PlatformDetectionResult[];
  totalConversations: number;
  totalSize: string;
}

/**
 * Platform Detector - Auto-detect available LLM platforms
 */
export class PlatformDetector {
  /**
   * Detect all available platforms
   */
  async detectAll(): Promise<PlatformDetectionSummary> {
    const platforms: PlatformDetectionResult[] = [];

    // Detect Augment
    platforms.push(await this.detectAugment());

    // Detect Claude Desktop
    platforms.push(await this.detectClaudeDesktop());

    // Detect Claude CLI
    platforms.push(await this.detectClaudeCli());

    // Detect Warp (future)
    platforms.push(await this.detectWarp());

    // Calculate totals
    const totalConversations = platforms.reduce((sum, p) => sum + (p.conversationCount || 0), 0);

    // Calculate total size (simplified - just sum up estimated sizes)
    const totalSizeBytes = platforms.reduce((sum, p) => {
      if (!p.size) return sum;
      const match = p.size.match(/(\d+\.?\d*)\s*(GB|MB|KB)/);
      if (!match || !match[1] || !match[2]) return sum;
      const value = parseFloat(match[1]);
      const unit = match[2];
      if (unit === 'GB') return sum + value * 1024 * 1024 * 1024;
      if (unit === 'MB') return sum + value * 1024 * 1024;
      if (unit === 'KB') return sum + value * 1024;
      return sum;
    }, 0);

    const totalSize = this.formatBytes(totalSizeBytes);

    return {
      platforms,
      totalConversations,
      totalSize,
    };
  }

  /**
   * Detect Augment platform
   */
  private async detectAugment(): Promise<PlatformDetectionResult> {
    try {
      const reader = new AugmentLevelDBReader();
      const available = reader.isAvailable();

      if (!available) {
        return {
          platform: 'augment',
          available: false,
        };
      }

      // Get workspace count and estimate conversations
      const workspaces = reader['findAugmentWorkspaces'](); // Access private method for detection
      const databaseCount = workspaces.length;

      // Estimate: ~1000 conversations per workspace (rough estimate)
      const conversationCount = databaseCount * 1000;

      // Estimate size: ~700 MB per workspace (rough estimate)
      const sizeBytes = databaseCount * 700 * 1024 * 1024;
      const size = this.formatBytes(sizeBytes);

      return {
        platform: 'augment',
        available: true,
        path: reader.getStoragePath(),
        conversationCount,
        databaseCount,
        size,
      };
    } catch {
      return {
        platform: 'augment',
        available: false,
      };
    }
  }

  /**
   * Detect Claude Desktop platform
   */
  private async detectClaudeDesktop(): Promise<PlatformDetectionResult> {
    try {
      const watcher = new ClaudeDesktopWatcher();
      const available = watcher.isAvailable();

      if (!available) {
        return {
          platform: 'claude-desktop',
          available: false,
        };
      }

      const path = join(homedir(), 'Library', 'Application Support', 'Claude');

      // TODO: Implement conversation counting for Claude Desktop
      // For now, just mark as available with 1 database
      return {
        platform: 'claude-desktop',
        available: true,
        path,
        conversationCount: 0, // Unknown for now
        databaseCount: 1,
        size: 'Unknown',
      };
    } catch {
      return {
        platform: 'claude-desktop',
        available: false,
      };
    }
  }

  /**
   * Detect Claude CLI platform
   */
  private async detectClaudeCli(): Promise<PlatformDetectionResult> {
    try {
      const watcher = new ClaudeCliWatcher();
      const available = watcher.isAvailable();

      if (!available) {
        return {
          platform: 'claude-cli',
          available: false,
        };
      }

      const path = join(homedir(), '.claude', 'projects');
      const projectsResult = watcher.getAvailableProjects();

      if (!projectsResult.ok) {
        return {
          platform: 'claude-cli',
          available: true,
          path,
          conversationCount: 0,
          databaseCount: 0,
          size: '0 MB',
        };
      }

      const projects = projectsResult.value;
      let totalSessions = 0;

      // Count sessions across all projects
      for (const project of projects) {
        const sessionCountResult = watcher.getSessionCount(project);
        if (sessionCountResult.ok) {
          totalSessions += sessionCountResult.value;
        }
      }

      // Estimate size: ~50 KB per session (JSONL files are small)
      const sizeBytes = totalSessions * 50 * 1024;
      const size = this.formatBytes(sizeBytes);

      return {
        platform: 'claude-cli',
        available: true,
        path,
        conversationCount: totalSessions,
        databaseCount: projects.length,
        size,
      };
    } catch {
      return {
        platform: 'claude-cli',
        available: false,
      };
    }
  }

  /**
   * Detect Warp platform (future)
   */
  private async detectWarp(): Promise<PlatformDetectionResult> {
    try {
      const warpPath = join(homedir(), 'Library', 'Application Support', 'warp-terminal');
      const available = existsSync(warpPath);

      if (!available) {
        return {
          platform: 'warp',
          available: false,
        };
      }

      // TODO: Implement Warp conversation detection
      return {
        platform: 'warp',
        available: true,
        path: warpPath,
        conversationCount: 0, // Not implemented yet
        databaseCount: 0,
        size: 'Unknown',
      };
    } catch {
      return {
        platform: 'warp',
        available: false,
      };
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}
