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
import { existsSync, readdirSync, readFileSync, cpSync, rmSync } from 'fs';
import { homedir } from 'os';
import { tmpdir } from 'os';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface AugmentConversation {
  conversationId: string;
  workspaceId: string;
  workspaceName: string; // Added: workspace folder name for filtering
  rawData: string;
  timestamp: string;
  lastModified: string;
}

/**
 * Read Augment LevelDB files from VSCode workspace storage
 */
export class AugmentLevelDBReader {
  private vscodeStoragePath: string;
  private currentProjectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.vscodeStoragePath = join(
      homedir(),
      'Library/Application Support/Code/User/workspaceStorage'
    );
    this.currentProjectPath = projectPath;
  }

  /**
   * Get the current project's folder name
   * Used to automatically filter to this workspace's conversations
   */
  private getCurrentProjectName(): string {
    // Extract just the folder name from the project path
    return this.currentProjectPath.split('/').pop() || 'unknown';
  }

  /**
   * Find all Augment workspace directories with their names
   */
  private findAugmentWorkspaces(): Array<{ path: string; name: string }> {
    if (!existsSync(this.vscodeStoragePath)) {
      return [];
    }

    const workspaces: Array<{ path: string; name: string }> = [];
    const workspaceIds = readdirSync(this.vscodeStoragePath);

    for (const workspaceId of workspaceIds) {
      const augmentPath = join(
        this.vscodeStoragePath,
        workspaceId,
        'Augment.vscode-augment',
        'augment-kv-store'
      );

      if (existsSync(augmentPath)) {
        // Try to read workspace name from workspace.json
        const workspaceJsonPath = join(this.vscodeStoragePath, workspaceId, 'workspace.json');
        let workspaceName = workspaceId; // fallback to ID

        try {
          if (existsSync(workspaceJsonPath)) {
            const workspaceJson = JSON.parse(readFileSync(workspaceJsonPath, 'utf-8'));
            // Handle both single folder and multi-folder workspaces
            let folderPath: string | undefined;

            if (workspaceJson.folder) {
              // Single folder workspace: "folder": "file:///path/to/folder"
              folderPath = workspaceJson.folder;
            } else if (workspaceJson.folders && workspaceJson.folders.length > 0) {
              // Multi-folder workspace: "folders": [{"path": "/path/to/folder"}]
              folderPath = workspaceJson.folders[0].path;
            }

            if (folderPath) {
              // Remove file:// protocol if present
              folderPath = folderPath.replace(/^file:\/\//, '');
              // Extract just the folder name from the path
              workspaceName = folderPath.split('/').pop() || workspaceId;
            }
          }
        } catch {
          // Use workspaceId as fallback
        }

        workspaces.push({ path: augmentPath, name: workspaceName });
      }
    }

    return workspaces;
  }

  /**
   * Read all conversations from Augment LevelDB
   * Automatically filters to the current project's workspace
   * Optionally override with a different workspace name
   */
  async readAllConversations(filterWorkspaceName?: string): Promise<Result<AugmentConversation[]>> {
    try {
      const workspaces = this.findAugmentWorkspaces();

      if (workspaces.length === 0) {
        return Ok([]);
      }

      const conversations: AugmentConversation[] = [];
      // Use provided filter or default to current project name
      const targetWorkspace = filterWorkspaceName || this.getCurrentProjectName();

      for (const workspace of workspaces) {
        // FIX #2: Use exact workspace name match instead of .includes()
        // This prevents LILL-Core from matching LILL-Meta-Learner, etc.
        if (workspace.name !== targetWorkspace) {
          continue;
        }

        const pathParts = workspace.path.split('/');
        const workspaceId = pathParts[pathParts.length - 4] || 'unknown';
        const result = await this.readWorkspaceConversations(
          workspace.path,
          workspaceId,
          workspace.name
        );

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
   * Uses a copy of the database to avoid lock conflicts with VSCode
   */
  private async readWorkspaceConversations(
    workspacePath: string,
    workspaceId: string,
    workspaceName: string
  ): Promise<Result<AugmentConversation[]>> {
    let tempDbPath: string | null = null;

    try {
      // Create a temporary copy of the database to avoid lock conflicts
      tempDbPath = join(tmpdir(), `augment-leveldb-copy-${Date.now()}`);

      if (process.env['DEBUG_AUGMENT']) {
        console.error(`[DEBUG] Copying database from ${workspacePath} to ${tempDbPath}...`);
      }

      cpSync(workspacePath, tempDbPath, { recursive: true });

      if (process.env['DEBUG_AUGMENT']) {
        console.error(`[DEBUG] Database copied successfully`);
      }

      // Open the copied database (no lock conflicts)
      const db = new ClassicLevel(tempDbPath);

      try {
        if (process.env['DEBUG_AUGMENT']) {
          console.error(`[DEBUG] Opening copied database...`);
        }

        await db.open();

        if (process.env['DEBUG_AUGMENT']) {
          console.error(`[DEBUG] Database opened successfully`);
        }

        const conversations: AugmentConversation[] = [];
        const now = new Date().toISOString();
        let totalKeys = 0;

        try {
          // Group all keys by conversation ID
          const conversationMap = new Map<string, Array<{ key: string; value: string }>>();

          for await (const [key, value] of db.iterator()) {
            const keyStr = key.toString();
            const valueStr = value.toString();
            totalKeys++;

            // Look for conversation-related keys
            // Augment stores data with keys like:
            // - exchange:conversationId:messageId
            // - history:conversationId
            // - history-metadata:conversationId
            // - tooluse:conversationId:messageId;toolId
            // - metadata:conversationId
            if (
              keyStr.startsWith('exchange:') ||
              keyStr.startsWith('history:') ||
              keyStr.startsWith('history-metadata:') ||
              keyStr.startsWith('tooluse:') ||
              keyStr.startsWith('metadata:')
            ) {
              // Extract conversation ID from key
              const parts = keyStr.split(':');
              if (parts.length >= 2 && parts[1]) {
                const conversationId = parts[1]; // The actual conversation ID

                if (!conversationMap.has(conversationId)) {
                  conversationMap.set(conversationId, []);
                }
                const entries = conversationMap.get(conversationId);
                if (entries) {
                  entries.push({ key: keyStr, value: valueStr });
                }
              }
            }
          }

          // Convert grouped data into conversations
          for (const [conversationId, entries] of conversationMap.entries()) {
            // Parse exchange entries to extract messages
            const messages: Array<{ role: string; content: string; timestamp: string }> = [];

            for (const entry of entries) {
              if (entry.key.startsWith('exchange:')) {
                try {
                  const exchangeData = JSON.parse(entry.value);

                  // Extract user message from request_message
                  if (exchangeData.request_message) {
                    messages.push({
                      role: 'user',
                      content: exchangeData.request_message,
                      timestamp: exchangeData.timestamp || now,
                    });
                  }

                  // Extract assistant message from response_text
                  if (exchangeData.response_text) {
                    messages.push({
                      role: 'assistant',
                      content: exchangeData.response_text,
                      timestamp: exchangeData.timestamp || now,
                    });
                  }
                } catch (parseError) {
                  // Skip malformed exchange data
                  console.warn(`Failed to parse exchange data for ${entry.key}:`, parseError);
                }
              }
            }

            // Only add conversation if it has messages
            if (messages.length > 0) {
              // Sort messages by timestamp to get correct start/end dates
              messages.sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );

              conversations.push({
                conversationId,
                workspaceId,
                workspaceName,
                rawData: JSON.stringify(messages),
                timestamp: messages[0]?.timestamp || now,
                lastModified: messages[messages.length - 1]?.timestamp || now,
              });
            }
          }

          if (process.env['DEBUG_AUGMENT']) {
            console.error(
              `[DEBUG] Workspace ${workspaceName}: ${totalKeys} total keys, ${conversationMap.size} conversations`
            );
          }
        } finally {
          try {
            await db.close();
          } catch {
            // Ignore close errors
          }
        }

        return Ok(conversations);
      } catch (error) {
        return Err(
          error instanceof Error ? error : new Error(`Failed to read workspace: ${String(error)}`)
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (process.env['DEBUG_AUGMENT']) {
        console.error(`[DEBUG] Error reading workspace: ${errorMsg}`);
      }

      return Err(
        error instanceof Error ? error : new Error(`Failed to read workspace: ${String(error)}`)
      );
    } finally {
      // Clean up temporary database copy
      if (tempDbPath && existsSync(tempDbPath)) {
        try {
          rmSync(tempDbPath, { recursive: true, force: true });
          if (process.env['DEBUG_AUGMENT']) {
            console.error(`[DEBUG] Cleaned up temporary database at ${tempDbPath}`);
          }
        } catch (cleanupError) {
          console.warn(
            `Warning: Failed to clean up temporary database at ${tempDbPath}:`,
            cleanupError
          );
        }
      }
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
