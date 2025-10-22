/**
 * Claude CLI Watcher
 * Monitors Claude Code (CLI) JSONL files for new conversations
 * Phase 5.5a: October 2025
 *
 * Watches ~/.claude/projects/{project}/ for new .jsonl session files
 * Automatically extracts messages and returns them for consolidation
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Message } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { ClaudeCliParser } from '../parsers/ClaudeCliParser.js';

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
    return existsSync(this.projectsPath);
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

      if (!existsSync(fullPath)) {
        return Ok([]); // Project not found, return empty
      }

      const allMessages: Message[] = [];
      const files = readdirSync(fullPath);
      const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

      for (const file of jsonlFiles) {
        const filePath = join(fullPath, file);
        const sessionId = file.replace('.jsonl', '');

        try {
          const content = readFileSync(filePath, 'utf-8');
          const result = this.parser.parse(content, sessionId);

          if (result.ok) {
            allMessages.push(...result.value);
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }

      return Ok(allMessages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new Error(`Failed to get Claude CLI project sessions: ${message}`));
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

      if (!existsSync(fullPath)) {
        return Ok([]); // Project not found, return empty
      }

      const files = readdirSync(fullPath);
      const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

      if (jsonlFiles.length === 0) {
        return Ok([]); // No sessions found
      }

      // Get most recent file (alphabetically sorted, UUIDs are sortable)
      const latestFile = jsonlFiles.sort().pop()!;
      const filePath = join(fullPath, latestFile);
      const sessionId = latestFile.replace('.jsonl', '');

      const content = readFileSync(filePath, 'utf-8');
      return this.parser.parse(content, sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new Error(`Failed to get latest Claude CLI session: ${message}`));
    }
  }

  /**
   * Get all available projects
   *
   * @returns Result with array of project paths
   */
  getAvailableProjects(): Result<string[]> {
    try {
      if (!existsSync(this.projectsPath)) {
        return Ok([]);
      }

      const items = readdirSync(this.projectsPath);
      const projects = items.filter((item) => {
        const fullPath = join(this.projectsPath, item);
        // Check if it's a directory
        try {
          return existsSync(fullPath);
        } catch {
          return false;
        }
      });

      return Ok(projects);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new Error(`Failed to get available Claude CLI projects: ${message}`));
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

      if (!existsSync(fullPath)) {
        return Ok(0);
      }

      const files = readdirSync(fullPath);
      const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

      return Ok(jsonlFiles.length);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new Error(`Failed to get Claude CLI session count: ${message}`));
    }
  }
}
