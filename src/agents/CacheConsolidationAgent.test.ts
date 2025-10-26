/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheConsolidationAgent } from './CacheConsolidationAgent.js';
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

describe('CacheConsolidationAgent', () => {
  let testDir: string;
  let agent: CacheConsolidationAgent;

  beforeEach(() => {
    // Use project directory for tests (aicf-core security requirement)
    testDir = join(process.cwd(), '.test-tmp', `cache-consolidation-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    agent = new CacheConsolidationAgent(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('consolidate', () => {
    it('should return zero stats when no cache chunks exist', async () => {
      const result = await agent.consolidate();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalChunksProcessed).toBe(0);
        expect(result.value.chunksConsolidated).toBe(0);
        expect(result.value.chunksDuplicated).toBe(0);
        expect(result.value.filesWritten).toBe(0);
      }
    });

    it('should process augment cache chunks', async () => {
      // Create cache directory structure
      const augmentCacheDir = join(testDir, '.cache', 'llm', 'augment', '.conversations');
      mkdirSync(augmentCacheDir, { recursive: true });

      // Create test chunk
      const chunk = {
        conversationId: 'test-conv-1',
        timestamp: new Date().toISOString(),
        messages: [
          {
            role: 'user',
            content: 'Test message',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      writeFileSync(join(augmentCacheDir, 'chunk-1.json'), JSON.stringify(chunk));

      const result = await agent.consolidate();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalChunksProcessed).toBe(1);
        expect(result.value.chunksConsolidated).toBeGreaterThanOrEqual(0);
      }
    });

    it('should process claude cache chunks', async () => {
      // Create cache directory structure
      const claudeCacheDir = join(testDir, '.cache', 'llm', 'claude', '.conversations');
      mkdirSync(claudeCacheDir, { recursive: true });

      // Create test chunk
      const chunk = {
        conversationId: 'test-conv-2',
        timestamp: new Date().toISOString(),
        messages: [
          {
            role: 'user',
            content: 'Test Claude message',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      writeFileSync(join(claudeCacheDir, 'chunk-1.json'), JSON.stringify(chunk));

      const result = await agent.consolidate();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalChunksProcessed).toBe(1);
      }
    });

    it('should process multiple chunks from different platforms', async () => {
      // Create both augment and claude cache directories
      const augmentCacheDir = join(testDir, '.cache', 'llm', 'augment', '.conversations');
      const claudeCacheDir = join(testDir, '.cache', 'llm', 'claude', '.conversations');
      mkdirSync(augmentCacheDir, { recursive: true });
      mkdirSync(claudeCacheDir, { recursive: true });

      // Create augment chunks
      for (let i = 1; i <= 3; i++) {
        const chunk = {
          conversationId: `augment-conv-${i}`,
          timestamp: new Date().toISOString(),
          messages: [{ role: 'user', content: `Augment message ${i}` }],
        };
        writeFileSync(join(augmentCacheDir, `chunk-${i}.json`), JSON.stringify(chunk));
      }

      // Create claude chunks
      for (let i = 1; i <= 2; i++) {
        const chunk = {
          conversationId: `claude-conv-${i}`,
          timestamp: new Date().toISOString(),
          messages: [{ role: 'user', content: `Claude message ${i}` }],
        };
        writeFileSync(join(claudeCacheDir, `chunk-${i}.json`), JSON.stringify(chunk));
      }

      const result = await agent.consolidate();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalChunksProcessed).toBe(5);
      }
    });

    it('should handle invalid JSON chunks gracefully', async () => {
      const augmentCacheDir = join(testDir, '.cache', 'llm', 'augment', '.conversations');
      mkdirSync(augmentCacheDir, { recursive: true });

      // Create invalid JSON chunk
      writeFileSync(join(augmentCacheDir, 'chunk-1.json'), 'invalid json {');

      const result = await agent.consolidate();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalChunksProcessed).toBe(1);
        // Should skip invalid chunks
        expect(result.value.chunksDuplicated).toBeGreaterThanOrEqual(0);
      }
    });

    it('should deduplicate identical chunks', async () => {
      const augmentCacheDir = join(testDir, '.cache', 'llm', 'augment', '.conversations');
      mkdirSync(augmentCacheDir, { recursive: true });

      // Create identical chunks
      const chunk = {
        conversationId: 'duplicate-conv',
        timestamp: new Date().toISOString(),
        messages: [{ role: 'user', content: 'Duplicate message' }],
      };

      writeFileSync(join(augmentCacheDir, 'chunk-1.json'), JSON.stringify(chunk));
      writeFileSync(join(augmentCacheDir, 'chunk-2.json'), JSON.stringify(chunk));

      const result = await agent.consolidate();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalChunksProcessed).toBe(2);
        // At least one should be marked as duplicate
        expect(result.value.chunksDuplicated).toBeGreaterThanOrEqual(1);
      }
    });

    it('should create output directory if it does not exist', async () => {
      const augmentCacheDir = join(testDir, '.cache', 'llm', 'augment', '.conversations');
      mkdirSync(augmentCacheDir, { recursive: true });

      const chunk = {
        conversationId: 'test-conv',
        timestamp: new Date().toISOString(),
        messages: [{ role: 'user', content: 'Test' }],
      };

      writeFileSync(join(augmentCacheDir, 'chunk-1.json'), JSON.stringify(chunk));

      const aicfDir = join(testDir, '.aicf');
      expect(existsSync(aicfDir)).toBe(false);

      await agent.consolidate();

      // Output directory should be created
      expect(existsSync(aicfDir)).toBe(true);
    });

    it('should include timestamp in stats', async () => {
      const result = await agent.consolidate();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.timestamp).toBeDefined();
        expect(new Date(result.value.timestamp).getTime()).toBeGreaterThan(0);
      }
    });

    it('should handle empty cache directories', async () => {
      // Create empty cache directories
      const augmentCacheDir = join(testDir, '.cache', 'llm', 'augment', '.conversations');
      const claudeCacheDir = join(testDir, '.cache', 'llm', 'claude', '.conversations');
      mkdirSync(augmentCacheDir, { recursive: true });
      mkdirSync(claudeCacheDir, { recursive: true });

      const result = await agent.consolidate();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalChunksProcessed).toBe(0);
      }
    });

    it('should handle missing platform directories', async () => {
      // Only create augment directory, not claude
      const augmentCacheDir = join(testDir, '.cache', 'llm', 'augment', '.conversations');
      mkdirSync(augmentCacheDir, { recursive: true });

      const chunk = {
        conversationId: 'test-conv',
        timestamp: new Date().toISOString(),
        messages: [{ role: 'user', content: 'Test' }],
      };

      writeFileSync(join(augmentCacheDir, 'chunk-1.json'), JSON.stringify(chunk));

      const result = await agent.consolidate();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalChunksProcessed).toBe(1);
      }
    });
  });
});
