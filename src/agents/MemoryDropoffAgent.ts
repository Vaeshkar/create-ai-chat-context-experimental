/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Memory Dropoff Agent - Phase 7 (Updated for Phase 6.5 Session Files)
 *
 * @deprecated AICF format removed - this agent is no longer used
 * New pipeline: JSON → ConversationWatcher → QuadIndex → Snapshots
 *
 * Manages SESSION file lifecycle by age:
 * - 0-2 days (sessions/): FULL session data (template format)
 * - 2-7 days (medium/): SUMMARY format (key conversations only)
 * - 7-14 days (old/): KEY POINTS only (decisions, outcomes)
 * - 14+ days (archive/): SINGLE LINE per conversation
 *
 * Pipeline:
 * .aicf/sessions/{date}-session.aicf
 *         ↓ (2 days)
 * .aicf/medium/{date}-session.aicf (compressed)
 *         ↓ (7 days)
 * .aicf/old/{date}-session.aicf (more compressed)
 *         ↓ (14 days)
 * .aicf/archive/{date}-session.aicf (single line per conversation)
 *
 * Note: Works with session files from SessionConsolidationAgent (Phase 6.5)
 */

import { readdirSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Ok, Err } from '../types/result.js';
import type { Result } from '../types/result.js';

// @deprecated - AICFWriter removed with AICF format
// import { AICFWriter } from 'aicf-core';

export interface DropoffStats {
  sessionFiles: number;
  mediumFiles: number;
  oldFiles: number;
  archiveFiles: number;
  movedToMedium: number;
  movedToOld: number;
  movedToArchive: number;
  compressed: number;
  timestamp: string;
}

export interface SessionAge {
  filePath: string;
  fileName: string;
  sessionDate: string; // YYYY-MM-DD
  date: Date;
  ageInDays: number;
  currentFolder: 'sessions' | 'medium' | 'old' | 'archive';
  targetFolder: 'sessions' | 'medium' | 'old' | 'archive' | null;
}

export class MemoryDropoffAgent {
  private aicfDir: string;
  private sessionsDir: string;
  private mediumDir: string;
  private oldDir: string;
  private archiveDir: string;
  // @deprecated - AICFWriter removed with AICF format
  // private aicfWriter: AICFWriter;

  constructor(cwd: string = process.cwd()) {
    this.aicfDir = join(cwd, '.aicf');
    this.sessionsDir = join(this.aicfDir, 'sessions');
    this.mediumDir = join(this.aicfDir, 'medium');
    this.oldDir = join(this.aicfDir, 'old');
    this.archiveDir = join(this.aicfDir, 'archive');
    // @deprecated - AICFWriter removed with AICF format
    // this.aicfWriter = new AICFWriter(this.aicfDir);
  }

  /**
   * Run dropoff process: analyze ages, move files, compress content
   */
  async dropoff(): Promise<Result<DropoffStats>> {
    try {
      // Ensure all directories exist
      this.ensureDirectories();

      // Analyze all session files
      const sessions = this.analyzeAllSessions();

      // Move and compress files based on age
      let movedToMedium = 0;
      let movedToOld = 0;
      let movedToArchive = 0;
      let compressed = 0;

      for (const session of sessions) {
        if (session.targetFolder && session.targetFolder !== session.currentFolder) {
          const moveResult = await this.moveAndCompress(session);
          if (moveResult.ok) {
            compressed++;
            if (session.targetFolder === 'medium') movedToMedium++;
            if (session.targetFolder === 'old') movedToOld++;
            if (session.targetFolder === 'archive') movedToArchive++;
          }
        }
      }

      // Count files in each folder
      const stats: DropoffStats = {
        sessionFiles: this.countFiles(this.sessionsDir),
        mediumFiles: this.countFiles(this.mediumDir),
        oldFiles: this.countFiles(this.oldDir),
        archiveFiles: this.countFiles(this.archiveDir),
        movedToMedium,
        movedToOld,
        movedToArchive,
        compressed,
        timestamp: new Date().toISOString(),
      };

      return Ok(stats);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(`Dropoff failed: ${String(error)}`));
    }
  }

  /**
   * Analyze all session files across all folders
   */
  private analyzeAllSessions(): SessionAge[] {
    const sessions: SessionAge[] = [];
    const now = new Date();

    // Analyze sessions/
    const sessionFiles = this.getAicfFiles(this.sessionsDir);
    for (const fileName of sessionFiles) {
      const age = this.analyzeFile(fileName, 'sessions', now);
      if (age) sessions.push(age);
    }

    // Analyze medium/
    const mediumFiles = this.getAicfFiles(this.mediumDir);
    for (const fileName of mediumFiles) {
      const age = this.analyzeFile(fileName, 'medium', now);
      if (age) sessions.push(age);
    }

    // Analyze old/
    const oldFiles = this.getAicfFiles(this.oldDir);
    for (const fileName of oldFiles) {
      const age = this.analyzeFile(fileName, 'old', now);
      if (age) sessions.push(age);
    }

    // Analyze archive/
    const archiveFiles = this.getAicfFiles(this.archiveDir);
    for (const fileName of archiveFiles) {
      const age = this.analyzeFile(fileName, 'archive', now);
      if (age) sessions.push(age);
    }

    return sessions;
  }

  /**
   * Analyze a single session file and determine its age and target folder
   */
  private analyzeFile(
    fileName: string,
    currentFolder: 'sessions' | 'medium' | 'old' | 'archive',
    now: Date
  ): SessionAge | null {
    // Parse date from filename: {date}-session.aicf
    // Example: 2025-10-25-session.aicf
    const match = fileName.match(/^(\d{4}-\d{2}-\d{2})-session\.aicf$/);
    if (!match) return null;

    const dateStr = match[1];
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const ageInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    // Determine target folder based on age (SHORTER WINDOWS for Phase 6.5)
    // 0-2 days: sessions/ (FULL)
    // 2-7 days: medium/ (SUMMARY)
    // 7-14 days: old/ (KEY_POINTS)
    // 14+ days: archive/ (SINGLE_LINE)
    let targetFolder: 'sessions' | 'medium' | 'old' | 'archive' | null = null;
    if (ageInDays >= 14) {
      targetFolder = 'archive';
    } else if (ageInDays >= 7) {
      targetFolder = 'old';
    } else if (ageInDays >= 2) {
      targetFolder = 'medium';
    } else {
      targetFolder = 'sessions';
    }

    const folderPath = this.getFolderPath(currentFolder);

    return {
      filePath: join(folderPath, fileName),
      fileName,
      sessionDate: dateStr,
      date,
      ageInDays,
      currentFolder,
      targetFolder,
    };
  }

  /**
   * Move session file and compress content based on target folder
   * NOW USES aicf-core FOR ENTERPRISE-GRADE WRITES:
   * - Thread-safe file locking (prevents corruption)
   * - Atomic writes (all-or-nothing)
   * - Input validation (schema-based)
   * - PII redaction (if enabled)
   * - Error recovery (corrupted file detection)
   */
  private async moveAndCompress(session: SessionAge): Promise<Result<void>> {
    try {
      if (!session.targetFolder) return Ok(undefined);

      // Read original content (still using readFileSync for now)
      // TODO: Consider using aicf-core's reader for consistency
      const _content = readFileSync(session.filePath, 'utf-8');

      // Compress based on target folder
      // @deprecated - No longer used since AICF format removed
      // Compression logic disabled but kept for reference
      if (session.targetFolder === 'medium') {
        // _compressed = this.compressToSummary(content, session);
      } else if (session.targetFolder === 'old') {
        // _compressed = this.compressToKeyPoints(content, session);
      } else if (session.targetFolder === 'archive') {
        // _compressed = this.compressToSingleLine(content, session);
      } else {
        // _compressed = content; // No compression for sessions
      }

      // @deprecated - AICFWriter removed with AICF format
      // Build relative file path for aicf-core
      // const targetFolderName = session.targetFolder;
      // const fileName = `${targetFolderName}/${session.fileName}`;

      // Use aicf-core's appendLine for enterprise-grade writes
      // This gives us: thread-safe locking, validation, PII redaction, error recovery
      // const writeResult = await this.aicfWriter.appendLine(fileName, compressed);

      // if (!writeResult.ok) {
      //   return Err(new Error(`Failed to write compressed file: ${writeResult.error.message}`));
      // }

      // TODO: Implement new dropoff strategy using QuadIndex snapshots
      return Err(new Error('MemoryDropoffAgent is deprecated - AICF format removed'));

      // Delete original file (only if write was successful)
      const fs = await import('fs/promises');
      await fs.unlink(session.filePath);

      return Ok(undefined);
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Failed to move and compress: ${String(error)}`)
      );
    }
  }

  /**
   * Compress to SUMMARY format (2-7 days)
   * Keep: Only conversations with explicit decisions or actions
   * Remove: Conversations with "No explicit decisions" and "No explicit actions"
   * @deprecated - AICF format removed
   */
  // @ts-expect-error - Unused method (deprecated with AICF format)
  private compressToSummary(content: string, session: SessionAge): string {
    const lines = content.split('\n');
    const compressed: string[] = [];

    // Keep header
    compressed.push('@CONVERSATIONS');
    compressed.push('@SCHEMA');
    compressed.push('C#|TIMESTAMP|TITLE|SUMMARY|AI_MODEL|DECISIONS|ACTIONS|STATUS');
    compressed.push('');
    compressed.push('@DATA');

    // Filter conversations: keep only those with meaningful decisions or actions
    let inData = false;
    for (const line of lines) {
      if (line === '@DATA') {
        inData = true;
        continue;
      } else if (line.startsWith('@NOTES')) {
        inData = false;
      }

      if (inData && line.trim() && !line.startsWith('@')) {
        // Parse conversation line
        const parts = line.split('|');
        if (parts.length >= 8) {
          const decisions = parts[5] || '';
          const actions = parts[6] || '';

          // Keep only if has meaningful decisions OR actions
          if (
            (decisions && decisions !== 'No explicit decisions') ||
            (actions && actions !== 'No explicit actions')
          ) {
            compressed.push(line);
          }
        }
      }
    }

    // Add notes
    compressed.push('');
    compressed.push('@NOTES');
    compressed.push(`- Session: ${session.sessionDate}`);
    compressed.push(`- Compression: SUMMARY (filtered for meaningful conversations)`);
    compressed.push(`- Age: ${session.ageInDays} days`);

    return compressed.join('\n');
  }

  /**
   * Compress to KEY POINTS format (7-14 days)
   * Keep: Only DECISIONS and ACTIONS columns, remove TITLE and SUMMARY
   * @deprecated - AICF format removed
   */
  // @ts-expect-error - Unused method (deprecated with AICF format)
  private compressToKeyPoints(content: string, session: SessionAge): string {
    const lines = content.split('\n');
    const compressed: string[] = [];

    // Keep header with reduced schema
    compressed.push('@CONVERSATIONS');
    compressed.push('@SCHEMA');
    compressed.push('C#|TIMESTAMP|AI_MODEL|DECISIONS|ACTIONS|STATUS');
    compressed.push('');
    compressed.push('@DATA');

    // Extract only key fields
    let inData = false;
    for (const line of lines) {
      if (line === '@DATA') {
        inData = true;
        continue;
      } else if (line.startsWith('@NOTES')) {
        inData = false;
      }

      if (inData && line.trim() && !line.startsWith('@')) {
        // Parse conversation line
        const parts = line.split('|');
        if (parts.length >= 8) {
          const cNum = parts[0];
          const timestamp = parts[1];
          const aiModel = parts[4];
          const decisions = parts[5];
          const actions = parts[6];
          const status = parts[7];

          // Keep only if has meaningful decisions OR actions
          if (
            (decisions && decisions !== 'No explicit decisions') ||
            (actions && actions !== 'No explicit actions')
          ) {
            compressed.push(`${cNum}|${timestamp}|${aiModel}|${decisions}|${actions}|${status}`);
          }
        }
      }
    }

    // Add notes
    compressed.push('');
    compressed.push('@NOTES');
    compressed.push(`- Session: ${session.sessionDate}`);
    compressed.push(`- Compression: KEY_POINTS (decisions and actions only)`);
    compressed.push(`- Age: ${session.ageInDays} days`);

    return compressed.join('\n');
  }

  /**
   * Compress to SINGLE LINE format (14+ days)
   * Keep: Only one line per conversation with timestamp and summary
   * @deprecated - AICF format removed
   */
  // @ts-expect-error - Unused method (deprecated with AICF format)
  private compressToSingleLine(content: string, session: SessionAge): string {
    const lines = content.split('\n');
    const compressed: string[] = [];

    compressed.push(`@SESSION|${session.sessionDate}|Age: ${session.ageInDays} days`);
    compressed.push('');

    // Extract only conversations with meaningful content
    let inData = false;
    for (const line of lines) {
      if (line === '@DATA') {
        inData = true;
        continue;
      } else if (line.startsWith('@NOTES')) {
        inData = false;
      }

      if (inData && line.trim() && !line.startsWith('@')) {
        // Parse conversation line
        const parts = line.split('|');
        if (parts.length >= 8) {
          const timestamp = parts[1];
          const title = parts[2];
          const decisions = parts[5];
          const actions = parts[6];

          // Keep only if has meaningful decisions OR actions
          if (
            (decisions && decisions !== 'No explicit decisions') ||
            (actions && actions !== 'No explicit actions')
          ) {
            compressed.push(`${timestamp}|${title}`);
          }
        }
      }
    }

    return compressed.join('\n');
  }

  /**
   * Get folder path by name
   */
  private getFolderPath(folder: 'sessions' | 'medium' | 'old' | 'archive'): string {
    switch (folder) {
      case 'sessions':
        return this.sessionsDir;
      case 'medium':
        return this.mediumDir;
      case 'old':
        return this.oldDir;
      case 'archive':
        return this.archiveDir;
    }
  }

  /**
   * Get all .aicf files in a directory
   */
  private getAicfFiles(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).filter((f) => f.endsWith('.aicf'));
  }

  /**
   * Count files in a directory
   */
  private countFiles(dir: string): number {
    return this.getAicfFiles(dir).length;
  }

  /**
   * Ensure all directories exist
   */
  private ensureDirectories(): void {
    [this.sessionsDir, this.mediumDir, this.oldDir, this.archiveDir].forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }
}
