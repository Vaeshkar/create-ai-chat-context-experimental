/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Augment LevelDB Reader
 * Phase 5.5a: Read Augment VSCode Extension LevelDB files
 *
 * Reads conversation data from Augment's LevelDB storage
 * Location: ~/Library/Application Support/Code/User/workspaceStorage/[workspace-id]/Augment.vscode-augment/augment-kv-store/
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { homedir } from 'os';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface AugmentConversation {
  conversationId: string;
  workspaceId: string;
  rawData: string;
  timestamp: string;
  lastModified: string;
}

/**
 * Read Augment LevelDB files from VSCode workspace storage
 */
export class AugmentLevelDBReader {
  private vscodeStoragePath: string;

  constructor() {
    this.vscodeStoragePath = join(
      homedir(),
      'Library/Application Support/Code/User/workspaceStorage'
    );
  }

  /**
   * Find all Augment workspace directories
   */
  private findAugmentWorkspaces(): string[] {
    if (!existsSync(this.vscodeStoragePath)) {
      return [];
    }

    const workspaces: string[] = [];
    const workspaceIds = readdirSync(this.vscodeStoragePath);

    for (const workspaceId of workspaceIds) {
      const augmentPath = join(
        this.vscodeStoragePath,
        workspaceId,
        'Augment.vscode-augment',
        'augment-kv-store'
      );

      if (existsSync(augmentPath)) {
        workspaces.push(augmentPath);
      }
    }

    return workspaces;
  }

  /**
   * Read all conversations from Augment LevelDB
   */
  async readAllConversations(): Promise<Result<AugmentConversation[]>> {
    try {
      const workspaces = this.findAugmentWorkspaces();

      if (workspaces.length === 0) {
        return Ok([]);
      }

      const conversations: AugmentConversation[] = [];

      for (const workspacePath of workspaces) {
        const pathParts = workspacePath.split('/');
        const workspaceId = pathParts[pathParts.length - 4] || 'unknown';
        const result = await this.readWorkspaceConversations(workspacePath, workspaceId);

        if (result.ok) {
          conversations.push(...result.value);
        }
      }

      return Ok(conversations);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error
          : new Error(`Failed to read Augment conversations: ${String(error)}`)
      );
    }
  }

  /**
   * Read conversations from a specific workspace
   */
  private async readWorkspaceConversations(
    workspacePath: string,
    workspaceId: string
  ): Promise<Result<AugmentConversation[]>> {
    try {
      const db = new ClassicLevel(workspacePath);

      // Add timeout to prevent hanging on locked databases
      const openPromise = db.open();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database open timeout')), 5000)
      );

      try {
        await Promise.race([openPromise, timeoutPromise]);
      } catch {
        // Database is likely locked or inaccessible, return empty
        return Ok([]);
      }

      const conversations: AugmentConversation[] = [];
      const now = new Date().toISOString();

      try {
        for await (const [key, value] of db.iterator()) {
          const keyStr = key.toString();
          const valueStr = value.toString();

          // Look for conversation-related keys
          if (
            keyStr.includes('conversation') ||
            keyStr.includes('message') ||
            keyStr.includes('request') ||
            keyStr.includes('response')
          ) {
            conversations.push({
              conversationId: keyStr,
              workspaceId,
              rawData: valueStr,
              timestamp: now,
              lastModified: now,
            });
          }
        }
      } finally {
        try {
          await db.close();
        } catch {
          // Ignore close errors
        }
      }

      return Ok(conversations);
    } catch {
      // Return empty array instead of error to allow graceful degradation
      return Ok([]);
    }
  }

  /**
   * Check if Augment data is available
   */
  isAvailable(): boolean {
    return this.findAugmentWorkspaces().length > 0;
  }

  /**
   * Get Augment storage path
   */
  getStoragePath(): string {
    return this.vscodeStoragePath;
  }
}
