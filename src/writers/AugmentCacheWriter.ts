/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-or-later).
 * See LICENSE file for details.
 */

/**
 * Augment Cache Writer
 * Phase 6: Cache-First Architecture
 *
 * Writes Augment conversation data to .cache/llm/augment/chunk-[number].json
 * This is the first step in the cache-first pipeline:
 * LLM Data → Cache → Consolidation Agent → .aicf/.ai/
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { AugmentLevelDBReader, type AugmentConversation } from '../readers/AugmentLevelDBReader.js';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface CacheWriteStats {
  totalConversations: number;
  newChunksWritten: number;
  chunksSkipped: number;
  cacheDirectory: string;
  timestamp: string;
}

/**
 * Writes Augment LevelDB data to cache as chunk files
 */
export class AugmentCacheWriter {
  private reader: AugmentLevelDBReader;
  private cacheDir: string;
  private lastChunkNumber: number = 0;

  constructor(cwd: string = process.cwd()) {
    this.reader = new AugmentLevelDBReader();
    this.cacheDir = join(cwd, '.cache', 'llm', 'augment', '.conversations');
  }

  /**
   * Write all Augment conversations to cache
   */
  async write(): Promise<Result<CacheWriteStats>> {
    try {
      // Ensure cache directory exists
      const dirResult = this.ensureCacheDirectory();
      if (!dirResult.ok) {
        return dirResult;
      }

      // Read all conversations from Augment LevelDB
      const readResult = await this.reader.readAllConversations();
      if (!readResult.ok) {
        return Err(new Error('Failed to read Augment conversations'));
      }

      const conversations = readResult.value;
      if (conversations.length === 0) {
        return Ok({
          totalConversations: 0,
          newChunksWritten: 0,
          chunksSkipped: 0,
          cacheDirectory: this.cacheDir,
          timestamp: new Date().toISOString(),
        });
      }

      // Get current highest chunk number
      this.lastChunkNumber = this.getHighestChunkNumber();

      // Write each conversation as a chunk
      let newChunksWritten = 0;
      let chunksSkipped = 0;

      for (const conv of conversations) {
        const chunkContent = this.formatAsChunk(conv);
        const chunkPath = join(this.cacheDir, `chunk-${this.lastChunkNumber + 1}.json`);

        // Check if chunk already exists (by content hash)
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

      return Ok({
        totalConversations: conversations.length,
        newChunksWritten,
        chunksSkipped,
        cacheDirectory: this.cacheDir,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error(`Failed to write Augment cache: ${String(error)}`)
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
   * Format Augment conversation as cache chunk
   */
  private formatAsChunk(conv: AugmentConversation): Record<string, unknown> {
    return {
      chunkId: `chunk-${this.lastChunkNumber + 1}`,
      conversationId: conv.conversationId,
      workspaceId: conv.workspaceId,
      timestamp: conv.timestamp,
      lastModified: conv.lastModified,
      source: 'augment-leveldb',
      rawData: conv.rawData,
      contentHash: this.hashContent(conv.rawData),
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
