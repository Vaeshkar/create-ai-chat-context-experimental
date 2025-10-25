/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-or-later).
 * See LICENSE file for details.
 */

/**
 * Claude Cache Writer
 * Phase 6: Cache-First Architecture
 *
 * Writes Claude Desktop/CLI conversation data to .cache/llm/claude/chunk-[number].json
 * This is the first step in the cache-first pipeline:
 * LLM Data → Cache → Consolidation Agent → .aicf/.ai/
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { ClaudeCliWatcher } from '../watchers/ClaudeCliWatcher.js';
import { ClaudeDesktopWatcher } from '../watchers/ClaudeDesktopWatcher.js';
import type { Message } from '../types/conversation.js';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface CacheWriteStats {
  totalMessages: number;
  newChunksWritten: number;
  chunksSkipped: number;
  cacheDirectory: string;
  timestamp: string;
}

/**
 * Writes Claude Desktop/CLI data to cache as chunk files
 */
export class ClaudeCacheWriter {
  private cliWatcher: ClaudeCliWatcher;
  private desktopWatcher: ClaudeDesktopWatcher;
  private cacheDir: string;
  private lastChunkNumber: number = 0;

  constructor(cwd: string = process.cwd()) {
    this.cliWatcher = new ClaudeCliWatcher();
    this.desktopWatcher = new ClaudeDesktopWatcher();
    this.cacheDir = join(cwd, '.cache', 'llm', 'claude', '.conversations');
  }

  /**
   * Write all Claude messages to cache
   */
  async write(): Promise<Result<CacheWriteStats>> {
    try {
      // Ensure cache directory exists
      const dirResult = this.ensureCacheDirectory();
      if (!dirResult.ok) {
        return dirResult;
      }

      // Get current highest chunk number
      this.lastChunkNumber = this.getHighestChunkNumber();

      let totalMessages = 0;
      let newChunksWritten = 0;
      let chunksSkipped = 0;

      // Collect from CLI
      if (this.cliWatcher.isAvailable()) {
        // Get all available projects
        const projectsResult = this.cliWatcher.getAvailableProjects();
        if (projectsResult.ok) {
          for (const projectPath of projectsResult.value) {
            const cliResult = this.cliWatcher.getProjectSessions(projectPath);
            if (cliResult.ok) {
              const messages = cliResult.value;
              totalMessages += messages.length;

              for (const msg of messages) {
                const chunkContent = this.formatAsChunk(msg, 'claude-cli');
                const chunkPath = join(this.cacheDir, `chunk-${this.lastChunkNumber + 1}.json`);

                if (this.chunkExists(chunkContent)) {
                  chunksSkipped++;
                  continue;
                }

                try {
                  writeFileSync(chunkPath, JSON.stringify(chunkContent, null, 2), 'utf-8');
                  newChunksWritten++;
                  this.lastChunkNumber++;
                } catch (error) {
                  console.error(`Failed to write chunk: ${chunkPath}`, error);
                }
              }
            }
          }
        }
      }

      // Collect from Desktop
      if (this.desktopWatcher.isAvailable()) {
        const desktopResult = this.desktopWatcher.getAllMessages();
        if (desktopResult.ok) {
          const messages = desktopResult.value;
          totalMessages += messages.length;

          for (const msg of messages) {
            const chunkContent = this.formatAsChunk(msg, 'claude-desktop');
            const chunkPath = join(this.cacheDir, `chunk-${this.lastChunkNumber + 1}.json`);

            if (this.chunkExists(chunkContent)) {
              chunksSkipped++;
              continue;
            }

            try {
              writeFileSync(chunkPath, JSON.stringify(chunkContent, null, 2), 'utf-8');
              newChunksWritten++;
              this.lastChunkNumber++;
            } catch (error) {
              console.error(`Failed to write chunk: ${chunkPath}`, error);
            }
          }
        }
      }

      return Ok({
        totalMessages,
        newChunksWritten,
        chunksSkipped,
        cacheDirectory: this.cacheDir,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Failed to write Claude cache: ${String(error)}`)
      );
    }
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDirectory(): Result<void> {
    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }
      return Ok(undefined);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error(`Failed to create cache directory: ${String(error)}`)
      );
    }
  }

  /**
   * Get the highest chunk number in cache
   */
  private getHighestChunkNumber(): number {
    if (!existsSync(this.cacheDir)) {
      return 0;
    }

    const files = readdirSync(this.cacheDir);
    const chunkNumbers = files
      .filter((f) => f.startsWith('chunk-') && f.endsWith('.json'))
      .map((f) => {
        const match = f.match(/chunk-(\d+)\.json/);
        return match && match[1] ? parseInt(match[1], 10) : 0;
      });

    return chunkNumbers.length > 0 ? Math.max(...chunkNumbers) : 0;
  }

  /**
   * Format Claude message as cache chunk
   */
  private formatAsChunk(
    msg: Message,
    source: 'claude-cli' | 'claude-desktop'
  ): Record<string, unknown> {
    return {
      chunkId: `chunk-${this.lastChunkNumber + 1}`,
      conversationId: msg.conversationId,
      messageId: msg.id,
      timestamp: msg.timestamp,
      source,
      role: msg.role,
      content: msg.content,
      contentHash: this.hashContent(msg.content),
      metadata: msg.metadata,
    };
  }

  /**
   * Simple content hash for deduplication
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if chunk with same content already exists
   */
  private chunkExists(chunkContent: Record<string, unknown>): boolean {
    if (!existsSync(this.cacheDir)) {
      return false;
    }

    const files = readdirSync(this.cacheDir);
    const contentHash = chunkContent['contentHash'] as string;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const filePath = join(this.cacheDir, file);
        const content = JSON.parse(readFileSync(filePath, 'utf-8'));
        if (content.contentHash === contentHash) {
          return true;
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return false;
  }

  /**
   * Get cache directory path
   */
  getCacheDir(): string {
    return this.cacheDir;
  }
}
