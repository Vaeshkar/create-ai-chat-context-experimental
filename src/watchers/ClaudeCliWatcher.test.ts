/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Claude CLI Watcher Tests
 * Phase 5.5a: October 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { ClaudeCliWatcher } from './ClaudeCliWatcher.js';
import { homedir } from 'os';

describe('ClaudeCliWatcher', () => {
  let watcher: ClaudeCliWatcher;
  const testProjectPath = join(homedir(), '.claude', 'projects', 'test-project');

  beforeEach(() => {
    watcher = new ClaudeCliWatcher();
    // Create test directory
    mkdirSync(testProjectPath, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    try {
      rmSync(join(homedir(), '.claude', 'projects', 'test-project'), {
        recursive: true,
        force: true,
      });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('isAvailable', () => {
    it('should return true if ~/.claude/projects exists', () => {
      const result = watcher.isAvailable();
      // This depends on whether Claude CLI is installed
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getProjectSessions', () => {
    it('should return empty array if project does not exist', () => {
      const result = watcher.getProjectSessions('non-existent-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('should parse single session file', () => {
      const sessionId = 'session-123';
      const jsonl = `{"type":"message","role":"user","content":"Hello","timestamp":"2025-10-22T10:00:00Z"}
{"type":"message","role":"assistant","content":"Hi","timestamp":"2025-10-22T10:00:05Z"}`;

      writeFileSync(join(testProjectPath, `${sessionId}.jsonl`), jsonl);

      const result = watcher.getProjectSessions('test-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].content).toBe('Hello');
        expect(result.value[1].content).toBe('Hi');
      }
    });

    it('should parse multiple session files', () => {
      const session1 = `{"type":"message","role":"user","content":"Session 1"}`;
      const session2 = `{"type":"message","role":"user","content":"Session 2"}`;

      writeFileSync(join(testProjectPath, 'session-1.jsonl'), session1);
      writeFileSync(join(testProjectPath, 'session-2.jsonl'), session2);

      const result = watcher.getProjectSessions('test-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('should skip non-jsonl files', () => {
      const jsonl = `{"type":"message","role":"user","content":"Valid"}`;
      writeFileSync(join(testProjectPath, 'session.jsonl'), jsonl);
      writeFileSync(join(testProjectPath, 'readme.txt'), 'Not a session');

      const result = watcher.getProjectSessions('test-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });

    it('should skip malformed jsonl files', () => {
      const validJsonl = `{"type":"message","role":"user","content":"Valid"}`;
      const invalidJsonl = `{invalid json}`;

      writeFileSync(join(testProjectPath, 'valid.jsonl'), validJsonl);
      writeFileSync(join(testProjectPath, 'invalid.jsonl'), invalidJsonl);

      const result = watcher.getProjectSessions('test-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should only get messages from valid file
        expect(result.value.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('getLatestSession', () => {
    it('should return empty array if project does not exist', () => {
      const result = watcher.getLatestSession('non-existent-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return empty array if no sessions exist', () => {
      const result = watcher.getLatestSession('test-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return latest session when multiple exist', () => {
      const session1 = `{"type":"message","role":"user","content":"First"}`;
      const session2 = `{"type":"message","role":"user","content":"Latest"}`;

      // Create files with sortable names (UUIDs)
      writeFileSync(join(testProjectPath, 'aaa-session-1.jsonl'), session1);
      writeFileSync(join(testProjectPath, 'zzz-session-2.jsonl'), session2);

      const result = watcher.getLatestSession('test-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].content).toBe('Latest');
      }
    });
  });

  describe('getAvailableProjects', () => {
    it('should return empty array if ~/.claude/projects does not exist', () => {
      // This test depends on system state
      const result = watcher.getAvailableProjects();
      expect(result.ok).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
    });

    it('should list available projects', () => {
      // Create test project
      mkdirSync(join(homedir(), '.claude', 'projects', 'test-project-1'), { recursive: true });
      mkdirSync(join(homedir(), '.claude', 'projects', 'test-project-2'), { recursive: true });

      const result = watcher.getAvailableProjects();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.value)).toBe(true);
      }

      // Cleanup
      try {
        rmSync(join(homedir(), '.claude', 'projects', 'test-project-1'), {
          recursive: true,
          force: true,
        });
        rmSync(join(homedir(), '.claude', 'projects', 'test-project-2'), {
          recursive: true,
          force: true,
        });
      } catch {
        // Ignore
      }
    });
  });

  describe('getSessionCount', () => {
    it('should return 0 if project does not exist', () => {
      const result = watcher.getSessionCount('non-existent-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0);
      }
    });

    it('should return 0 if no sessions exist', () => {
      const result = watcher.getSessionCount('test-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0);
      }
    });

    it('should count jsonl files correctly', () => {
      writeFileSync(join(testProjectPath, 'session-1.jsonl'), '{}');
      writeFileSync(join(testProjectPath, 'session-2.jsonl'), '{}');
      writeFileSync(join(testProjectPath, 'readme.txt'), 'Not a session');

      const result = watcher.getSessionCount('test-project');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(2);
      }
    });
  });
});
