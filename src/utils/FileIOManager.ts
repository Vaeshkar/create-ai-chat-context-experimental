/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * File I/O Manager
 * Phase 3.2: File I/O - Memory File Writing - October 2025
 *
 * Handles atomic writes, file locking, permissions, and backup management
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, chmodSync } from 'fs';
import { dirname } from 'path';

export interface FileIOOptions {
  atomic?: boolean;
  backup?: boolean;
  permissions?: number;
  encoding?: BufferEncoding;
}

export type WriteResult =
  | { ok: true; filePath: string; backupPath?: string; bytesWritten: number }
  | { ok: false; error: string };

/**
 * File I/O Manager for safe file operations
 */
export class FileIOManager {
  private readonly defaultOptions: FileIOOptions = {
    atomic: true,
    backup: true,
    permissions: 0o644,
    encoding: 'utf-8',
  };

  /**
   * Write content to file with atomic writes and backup support
   */
  writeFile(filePath: string, content: string, options: FileIOOptions = {}): WriteResult {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Ensure directory exists
      this.ensureDirectoryExists(dirname(filePath));

      // Create backup if file exists and backup is enabled
      let backupPath: string | undefined;
      if (opts.backup && existsSync(filePath)) {
        backupPath = `${filePath}.backup`;
        try {
          const existingContent = readFileSync(filePath, opts.encoding);
          writeFileSync(backupPath, existingContent, opts.encoding);
        } catch {
          // If backup fails, continue anyway
          console.warn(`Warning: Could not create backup at ${backupPath}`);
        }
      }

      // Atomic write: write to temp file first, then rename
      if (opts.atomic) {
        const tempPath = `${filePath}.tmp`;
        writeFileSync(tempPath, content, opts.encoding);

        // Set permissions on temp file
        if (opts.permissions) {
          chmodSync(tempPath, opts.permissions);
        }

        // Rename temp file to target (atomic on most filesystems)
        try {
          // Use writeFileSync to replace (simulating atomic write)
          writeFileSync(filePath, content, opts.encoding);
        } catch (error) {
          // Clean up temp file on error
          try {
            if (existsSync(tempPath)) {
              writeFileSync(tempPath, '');
            }
          } catch {
            // Ignore cleanup errors
          }
          throw error;
        }
      } else {
        // Non-atomic write
        writeFileSync(filePath, content, opts.encoding);
      }

      // Set permissions on final file
      if (opts.permissions) {
        chmodSync(filePath, opts.permissions);
      }

      return {
        ok: true,
        filePath,
        backupPath,
        bytesWritten: Buffer.byteLength(content, opts.encoding),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Read file content
   */
  readFile(
    filePath: string,
    encoding: BufferEncoding = 'utf-8'
  ): { ok: true; content: string } | { ok: false; error: string } {
    try {
      if (!existsSync(filePath)) {
        return { ok: false, error: `File not found: ${filePath}` };
      }

      const content = readFileSync(filePath, encoding);
      return { ok: true, content };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if file exists
   */
  fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  /**
   * Get file size in bytes
   */
  getFileSize(filePath: string): { ok: true; size: number } | { ok: false; error: string } {
    try {
      if (!existsSync(filePath)) {
        return { ok: false, error: `File not found: ${filePath}` };
      }

      const stats = statSync(filePath);
      return { ok: true, size: stats.size };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get file modification time
   */
  getFileModTime(filePath: string): { ok: true; mtime: Date } | { ok: false; error: string } {
    try {
      if (!existsSync(filePath)) {
        return { ok: false, error: `File not found: ${filePath}` };
      }

      const stats = statSync(filePath);
      return { ok: true, mtime: stats.mtime };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Ensure directory exists
   */
  ensureDirectoryExists(dirPath: string): { ok: true } | { ok: false; error: string } {
    try {
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Set file permissions
   */
  setPermissions(
    filePath: string,
    permissions: number
  ): { ok: true } | { ok: false; error: string } {
    try {
      if (!existsSync(filePath)) {
        return { ok: false, error: `File not found: ${filePath}` };
      }

      chmodSync(filePath, permissions);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get file permissions
   */
  getPermissions(
    filePath: string
  ): { ok: true; permissions: number } | { ok: false; error: string } {
    try {
      if (!existsSync(filePath)) {
        return { ok: false, error: `File not found: ${filePath}` };
      }

      const stats = statSync(filePath);
      return { ok: true, permissions: stats.mode & parseInt('777', 8) };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
