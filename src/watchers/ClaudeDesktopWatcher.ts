/**
 * Claude Desktop Watcher
 * Monitors Claude Desktop SQLite database for new conversations
 * Phase 5.5b: October 2025
 *
 * Watches ~/Library/Application Support/Claude/ for database changes
 * Automatically extracts messages and returns them for consolidation
 */

import { join } from 'path';
import { homedir } from 'os';
import { statSync, readdirSync, openSync, readSync, closeSync } from 'fs';
import type { Message } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { ClaudeDesktopParser } from '../parsers/ClaudeDesktopParser.js';
import { pathExists } from '../utils/FileSystemUtils.js';
import { handleError } from '../utils/ErrorUtils.js';

/**
 * Watch Claude Desktop for new conversations
 */
export class ClaudeDesktopWatcher {
  private parser = new ClaudeDesktopParser();
  private claudePath: string;
  private lastModified: Map<string, number> = new Map();

  constructor() {
    // Claude Desktop storage location
    this.claudePath = join(homedir(), 'Library', 'Application Support', 'Claude');
  }

  /**
   * Check if Claude Desktop is available on this system
   *
   * @returns true if ~/Library/Application Support/Claude exists
   */
  isAvailable(): boolean {
    return pathExists(this.claudePath);
  }

  /**
   * Get all messages from Claude Desktop database
   *
   * @returns Result with all messages from database
   */
  getAllMessages(): Result<Message[]> {
    try {
      const dbPath = this.findDatabase();

      if (!dbPath) {
        return Ok([]); // No database found
      }

      return this.parser.parse(dbPath);
    } catch (error) {
      return Err(handleError(error, 'Failed to get Claude Desktop messages'));
    }
  }

  /**
   * Get new messages since last check
   * Tracks database modification time to detect changes
   *
   * @returns Result with new messages
   */
  getNewMessages(): Result<Message[]> {
    try {
      const dbPath = this.findDatabase();

      if (!dbPath) {
        return Ok([]); // No database found
      }

      // Check if database has been modified
      const stats = statSync(dbPath);
      const currentModified = stats.mtimeMs;
      const lastModified = this.lastModified.get(dbPath) || 0;

      // Update last modified time
      this.lastModified.set(dbPath, currentModified);

      // If database hasn't changed, return empty
      if (currentModified === lastModified && lastModified > 0) {
        return Ok([]);
      }

      // Database has changed, parse it
      return this.parser.parse(dbPath);
    } catch (error) {
      return Err(handleError(error, 'Failed to get new Claude Desktop messages'));
    }
  }

  /**
   * Find Claude Desktop database file
   * Searches for common database names
   *
   * @returns Path to database file or null if not found
   */
  private findDatabase(): string | null {
    if (!pathExists(this.claudePath)) {
      return null;
    }

    // Common database file names
    const possibleNames = [
      'conversations.db',
      'claude.db',
      'chat.db',
      'messages.db',
      'app.db',
      'data.db',
    ];

    // Search for database files
    try {
      const files = readdirSync(this.claudePath);

      // First, check for known names
      for (const name of possibleNames) {
        if (files.includes(name)) {
          const fullPath = join(this.claudePath, name);
          if (this.isValidDatabase(fullPath)) {
            return fullPath;
          }
        }
      }

      // Then, search for any .db or .sqlite files
      for (const file of files) {
        if (file.endsWith('.db') || file.endsWith('.sqlite') || file.endsWith('.sqlite3')) {
          const fullPath = join(this.claudePath, file);
          if (this.isValidDatabase(fullPath)) {
            return fullPath;
          }
        }
      }
    } catch {
      // Ignore errors during search
    }

    return null;
  }

  /**
   * Check if a file is a valid SQLite database
   *
   * @param filePath - Path to file
   * @returns true if file is a valid SQLite database
   */
  private isValidDatabase(filePath: string): boolean {
    try {
      const stats = statSync(filePath);

      // Must be a file
      if (!stats.isFile()) {
        return false;
      }

      // Must be readable
      if (stats.size === 0) {
        return false;
      }

      // Check SQLite magic number (first 16 bytes should be "SQLite format 3\0")
      const buffer = Buffer.alloc(16);
      const fd = openSync(filePath, 'r');
      readSync(fd, buffer, 0, 16, 0);
      closeSync(fd);

      const header = buffer.toString('utf-8', 0, 13);
      return header === 'SQLite format';
    } catch {
      return false;
    }
  }

  /**
   * Get database file path
   * Useful for debugging and testing
   *
   * @returns Path to database file or null if not found
   */
  getDatabasePath(): string | null {
    return this.findDatabase();
  }

  /**
   * Get Claude Desktop storage path
   *
   * @returns Path to Claude Desktop storage directory
   */
  getStoragePath(): string {
    return this.claudePath;
  }
}
