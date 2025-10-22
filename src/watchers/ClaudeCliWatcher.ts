/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Claude CLI Watcher
 * Monitors Claude Code (CLI) JSONL files for new conversations
 * Phase 5.5a: October 2025
 *
 * Watches ~/.claude/projects/{project}/ for new .jsonl session files
 * Automatically extracts messages and returns them for consolidation
 */

import { join } from 'path';
import { homedir } from 'os';
import type { Message } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { ClaudeCliParser } from '../parsers/ClaudeCliParser.js';
import {
  listFiles,
  listFilesByExtension,
  readFile,
  getLatestFile,
  pathExists,
} from '../utils/FileSystemUtils.js';
import { handleError } from '../utils/ErrorUtils.js';

/**
 * Watch Claude CLI for new sessions
 */
export class ClaudeCliWatcher {
  private parser = new ClaudeCliParser();
  private projectsPath: string;

  constructor() {
    // Expand ~ to home directory
    this.projectsPath = join(homedir(), '.claude', 'projects');
  }

  /**
   * Check if Claude CLI is available on this system
   *
   * @returns true if ~/.claude/projects exists
   */
  isAvailable(): boolean {
    return pathExists(this.projectsPath);
  }

  /**
   * Get all sessions for a specific project
   *
   * @param projectPath - Sanitized project path (e.g., "-home-user-create-ai-chat-context-experimental")
   * @returns Result with all messages from all sessions
   */
  getProjectSessions(projectPath: string): Result<Message[]> {
    try {
      const fullPath = join(this.projectsPath, projectPath);

      if (!pathExists(fullPath)) {
        return Ok([]); // Project not found, return empty
      }

      const allMessages: Message[] = [];
      const filesResult = listFilesByExtension(fullPath, '.jsonl');

      if (!filesResult.ok) {
        return Ok([]); // No files found
      }

      for (const file of filesResult.value) {
        const filePath = join(fullPath, file);
        const sessionId = file.replace('.jsonl', '');

        try {
          const contentResult = readFile(filePath);
          if (!contentResult.ok) {
            continue;
          }

          const result = this.parser.parse(contentResult.value, sessionId);
          if (result.ok) {
            allMessages.push(...result.value);
          }
        } catch {
          // Skip files that can't be read
          continue;
        }
      }

      return Ok(allMessages);
    } catch (error) {
      return Err(handleError(error, 'Failed to get Claude CLI project sessions'));
    }
  }

  /**
   * Get the latest session for a specific project
   *
   * @param projectPath - Sanitized project path
   * @returns Result with messages from latest session
   */
  getLatestSession(projectPath: string): Result<Message[]> {
    try {
      const fullPath = join(this.projectsPath, projectPath);

      if (!pathExists(fullPath)) {
        return Ok([]); // Project not found, return empty
      }

      const latestFileResult = getLatestFile(fullPath, '.jsonl');
      if (!latestFileResult.ok || !latestFileResult.value) {
        return Ok([]); // No sessions found
      }

      const latestFile = latestFileResult.value;
      const filePath = join(fullPath, latestFile);
      const sessionId = latestFile.replace('.jsonl', '');

      const contentResult = readFile(filePath);
      if (!contentResult.ok) {
        return Err(contentResult.error);
      }

      return this.parser.parse(contentResult.value, sessionId);
    } catch (error) {
      return Err(handleError(error, 'Failed to get latest Claude CLI session'));
    }
  }

  /**
   * Get all available projects
   *
   * @returns Result with array of project paths
   */
  getAvailableProjects(): Result<string[]> {
    try {
      if (!pathExists(this.projectsPath)) {
        return Ok([]);
      }

      const filesResult = listFiles(this.projectsPath);
      if (!filesResult.ok) {
        return Ok([]);
      }

      const projects = filesResult.value.filter((item) => {
        const fullPath = join(this.projectsPath, item);
        return pathExists(fullPath);
      });

      return Ok(projects);
    } catch (error) {
      return Err(handleError(error, 'Failed to get available Claude CLI projects'));
    }
  }

  /**
   * Get session count for a project
   *
   * @param projectPath - Sanitized project path
   * @returns Result with number of sessions
   */
  getSessionCount(projectPath: string): Result<number> {
    try {
      const fullPath = join(this.projectsPath, projectPath);

      if (!pathExists(fullPath)) {
        return Ok(0);
      }

      const filesResult = listFilesByExtension(fullPath, '.jsonl');
      if (!filesResult.ok) {
        return Ok(0);
      }

      return Ok(filesResult.value.length);
    } catch (error) {
      return Err(handleError(error, 'Failed to get Claude CLI session count'));
    }
  }
}
