/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Statistics Utilities
 * Provides functions to calculate knowledge base statistics
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

export interface KnowledgeBaseStats {
  totalFiles: number;
  totalLines: number;
  totalWords: number;
  estimatedTokens: number;
  conversationEntries: number;
  aicfFiles: number;
  aiFiles: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

/**
 * Get knowledge base statistics
 */
export async function getKnowledgeBaseStats(cwd: string): Promise<KnowledgeBaseStats> {
  const stats: KnowledgeBaseStats = {
    totalFiles: 0,
    totalLines: 0,
    totalWords: 0,
    estimatedTokens: 0,
    conversationEntries: 0,
    aicfFiles: 0,
    aiFiles: 0,
    oldestEntry: null,
    newestEntry: null,
  };

  const aicfDir = join(cwd, '.aicf');
  const aiDir = join(cwd, '.ai');

  // Process .aicf directory
  try {
    const aicfFiles = readdirSync(aicfDir);
    stats.aicfFiles = aicfFiles.length;

    for (const file of aicfFiles) {
      if (file.endsWith('.aicf')) {
        const filePath = join(aicfDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const words = content.split(/\s+/).filter((w) => w.length > 0).length;

        stats.totalFiles++;
        stats.totalLines += lines;
        stats.totalWords += words;
        stats.conversationEntries++;

        // Track timestamps
        const stat = statSync(filePath);
        const modified = stat.mtime.toISOString().split('T')[0] || null;
        if (modified && (!stats.oldestEntry || modified < stats.oldestEntry)) {
          stats.oldestEntry = modified;
        }
        if (modified && (!stats.newestEntry || modified > stats.newestEntry)) {
          stats.newestEntry = modified;
        }
      }
    }
  } catch {
    // .aicf directory doesn't exist yet
  }

  // Process .ai directory
  try {
    const aiFiles = readdirSync(aiDir);
    stats.aiFiles = aiFiles.length;

    for (const file of aiFiles) {
      if (file.endsWith('.md')) {
        const filePath = join(aiDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const words = content.split(/\s+/).filter((w) => w.length > 0).length;

        stats.totalFiles++;
        stats.totalLines += lines;
        stats.totalWords += words;

        // Track timestamps
        const stat = statSync(filePath);
        const modified = stat.mtime.toISOString().split('T')[0] || null;
        if (modified && (!stats.oldestEntry || modified < stats.oldestEntry)) {
          stats.oldestEntry = modified;
        }
        if (modified && (!stats.newestEntry || modified > stats.newestEntry)) {
          stats.newestEntry = modified;
        }
      }
    }
  } catch {
    // .ai directory doesn't exist yet
  }

  // Calculate estimated tokens (words × 1.33)
  stats.estimatedTokens = Math.round(stats.totalWords * 1.33);

  return stats;
}
