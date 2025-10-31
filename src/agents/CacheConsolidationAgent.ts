/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-or-later).
 * See LICENSE file for details.
 */

/**
 * Cache Consolidation Agent
 * Phase 6: Cache-First Architecture
 *
 * Reads all chunk files from .cache/llm/[platform]/chunk-[number].json
 * Consolidates, deduplicates, and writes to .aicf/ and .ai/ files
 *
 * Pipeline:
 * .cache/llm/augment/chunk-N.json
 * .cache/llm/claude/chunk-N.json
 *         |
 *    Consolidation Agent
 *         |
 * .aicf/[conversationId].aicf
 * .ai/[conversationId].md
 */

import { readdirSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { ConversationOrchestrator } from '../orchestrators/ConversationOrchestrator.js';
import { MemoryFileWriter } from '../writers/MemoryFileWriter.js';
import { AgentRouter } from './AgentRouter.js';
import { MessageBuilder } from '../utils/MessageBuilder.js';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface ConsolidationStats {
  totalChunksProcessed: number;
  chunksConsolidated: number;
  chunksDuplicated: number;
  filesWritten: number;
  timestamp: string;
}

/**
 * Consolidates cache chunks into unified memory files
 */
export class CacheConsolidationAgent {
  private orchestrator: ConversationOrchestrator;
  private memoryWriter: MemoryFileWriter;
  private router: AgentRouter;
  private cacheDir: string;
  private outputDir: string;
  private processedHashes: Set<string> = new Set();

  constructor(cwd: string = process.cwd()) {
    this.orchestrator = new ConversationOrchestrator();
    this.memoryWriter = new MemoryFileWriter(cwd);
    this.router = new AgentRouter();
    this.cacheDir = join(cwd, '.cache', 'llm');
    this.outputDir = join(cwd, '.aicf');
  }

  /**
   * Consolidate all cache chunks
   */
  async consolidate(): Promise<Result<ConsolidationStats>> {
    try {
      const stats: ConsolidationStats = {
        totalChunksProcessed: 0,
        chunksConsolidated: 0,
        chunksDuplicated: 0,
        filesWritten: 0,
        timestamp: new Date().toISOString(),
      };

      // Find all chunk files across all platforms
      const chunkFiles = this.findAllChunks();
      stats.totalChunksProcessed = chunkFiles.length;

      if (chunkFiles.length === 0) {
        return Ok(stats);
      }

      // Process each chunk
      for (const chunkPath of chunkFiles) {
        const processResult = await this.processChunk(chunkPath);

        if (processResult.ok) {
          stats.chunksConsolidated++;
          stats.filesWritten += processResult.value;
        } else {
          stats.chunksDuplicated++;
        }
      }

      return Ok(stats);
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Consolidation failed: ${String(error)}`)
      );
    }
  }

  /**
   * Find all chunk files across all platforms
   */
  private findAllChunks(): string[] {
    const chunks: string[] = [];

    if (!existsSync(this.cacheDir)) {
      return chunks;
    }

    // Look in each platform directory
    const platforms = readdirSync(this.cacheDir);

    for (const platform of platforms) {
      const platformPath = join(this.cacheDir, platform);
      const conversationsPath = join(platformPath, '.conversations');

      if (!existsSync(conversationsPath)) {
        continue;
      }

      const files = readdirSync(conversationsPath);
      for (const file of files) {
        if (file.startsWith('chunk-') && file.endsWith('.json')) {
          chunks.push(join(conversationsPath, file));
        }
      }
    }

    return chunks;
  }

  /**
   * Process a single chunk file
   */
  private async processChunk(chunkPath: string): Promise<Result<number>> {
    try {
      const content = readFileSync(chunkPath, 'utf-8');
      const chunk = JSON.parse(content);

      // Check for duplicates
      const contentHash = chunk.contentHash as string;
      if (this.processedHashes.has(contentHash)) {
        return Err(new Error('Duplicate chunk'));
      }

      this.processedHashes.add(contentHash);

      // Extract conversation data
      const conversationId = chunk.conversationId || chunk.chunkId;
      const source = chunk.source || 'unknown';

      // Extract ORIGINAL conversation timestamp from rawData (CRITICAL for historical conversations)
      let conversationTimestamp = chunk.timestamp || new Date().toISOString();
      if (chunk.rawData) {
        try {
          const rawData =
            typeof chunk.rawData === 'string' ? JSON.parse(chunk.rawData) : chunk.rawData;
          if (rawData.timestamp) {
            conversationTimestamp = rawData.timestamp;
          }
        } catch {
          // If parsing fails, use chunk timestamp
        }
      }

      // Create conversation object for orchestrator
      const conversation = {
        id: conversationId,
        messages: this.extractMessages(chunk),
        timestamp: conversationTimestamp,
        source,
      };

      // Analyze with orchestrator
      // Pass chunk.rawData (the messages array) instead of the entire chunk JSON
      const analysisResult = this.orchestrator.analyze(conversation, chunk.rawData);

      if (!analysisResult.ok) {
        return Err(new Error('Analysis failed'));
      }

      // Route content
      const contentTypes = this.router.classifyContent(chunk);
      for (const contentType of contentTypes) {
        const routed = this.router.routeContent(contentType, chunk, chunk.chunkId);
        if (routed) {
          // Content is routed, could be used for specialized file writing
        }
      }

      // Write AICF v3.1 format to multiple semantic files
      // NOW USES aicf-core v2.2.0 bridge for AICF v3.1 format
      // - Writes to sessions.aicf, conversations.aicf, decisions.aicf, memories.aicf
      // - Preserves original conversation timestamp
      // - Enterprise-grade file operations (thread-safe, validated, PII redaction)
      const writeResult = await this.memoryWriter.writeAICF(
        conversationId,
        analysisResult.value,
        this.outputDir.replace('/.aicf', ''),
        conversation.timestamp
      );

      if (!writeResult.ok) {
        return Err(
          new Error(`Failed to write AICF file for ${conversationId}: ${writeResult.error.message}`)
        );
      }

      // Delete chunk file after successful processing
      try {
        unlinkSync(chunkPath);
      } catch (deleteError) {
        // Log but don't fail if chunk deletion fails
        console.warn(`Warning: Failed to delete chunk file ${chunkPath}:`, deleteError);
      }

      return Ok(1); // 1 file written (AICF only)
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Failed to process chunk: ${String(error)}`)
      );
    }
  }

  /**
   * Extract messages from chunk
   */
  private extractMessages(chunk: Record<string, unknown>) {
    const messages = [];
    const conversationId = (chunk['conversationId'] || chunk['chunkId'] || 'unknown') as string;

    // Handle Augment chunks
    if (chunk['source'] === 'augment-leveldb' && chunk['rawData']) {
      try {
        const rawData = JSON.parse(chunk['rawData'] as string);
        if (Array.isArray(rawData)) {
          for (let i = 0; i < rawData.length; i++) {
            const item = rawData[i];
            if (item.role && item.content) {
              const msg = MessageBuilder.create({
                conversationId,
                role: item.role as 'user' | 'assistant',
                content: item.content,
                timestamp: item.timestamp || new Date().toISOString(),
                prefix: 'augment',
                index: i,
              });
              messages.push(msg);
            }
          }
        }
      } catch {
        // If rawData is not JSON, treat it as a single message
        const msg = MessageBuilder.create({
          conversationId,
          role: 'assistant',
          content: chunk['rawData'] as string,
          timestamp: new Date().toISOString(),
          prefix: 'augment',
        });
        messages.push(msg);
      }
    }

    // Handle Claude chunks
    if (
      (chunk['source'] === 'claude-cli' || chunk['source'] === 'claude-desktop') &&
      chunk['content']
    ) {
      const msg = MessageBuilder.create({
        conversationId,
        role: chunk['role'] as 'user' | 'assistant',
        content: chunk['content'] as string,
        timestamp: (chunk['timestamp'] as string) || new Date().toISOString(),
        prefix: chunk['source'] as string,
      });
      messages.push(msg);
    }

    return messages;
  }

  /**
   * Get consolidation stats
   */
  getStats(): ConsolidationStats {
    return {
      totalChunksProcessed: 0,
      chunksConsolidated: 0,
      chunksDuplicated: 0,
      filesWritten: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
