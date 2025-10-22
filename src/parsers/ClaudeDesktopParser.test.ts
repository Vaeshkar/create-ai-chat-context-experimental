/**
 * Claude Desktop Parser Tests
 * Phase 5.5b: October 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ClaudeDesktopParser } from './ClaudeDesktopParser.js';

describe('ClaudeDesktopParser', () => {
  let parser: ClaudeDesktopParser;
  let testDbPath: string;
  let db: Database.Database;

  beforeEach(() => {
    parser = new ClaudeDesktopParser();
    testDbPath = join(tmpdir(), `test-claude-${Date.now()}.db`);

    // Create test database
    db = new Database(testDbPath);

    // Create conversations table
    db.exec(`
      CREATE TABLE conversations (
        id TEXT PRIMARY KEY,
        uuid TEXT,
        title TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // Create messages table
    db.exec(`
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        role TEXT,
        content TEXT,
        created_at TEXT,
        updated_at TEXT,
        metadata TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      )
    `);
  });

  afterEach(() => {
    try {
      db.close();
      rmSync(testDbPath, { force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Valid database parsing', () => {
    it('should parse empty database', () => {
      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('should parse single conversation with messages', () => {
      const conversationId = 'conv-1';

      // Insert conversation
      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, 'Test Conversation');

      // Insert messages
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-1', conversationId, 'user', 'Hello', '2025-10-22T10:00:00Z');

      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-2', conversationId, 'assistant', 'Hi there!', '2025-10-22T10:00:05Z');

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].role).toBe('user');
        expect(result.value[0].content).toBe('Hello');
        expect(result.value[1].role).toBe('assistant');
        expect(result.value[1].content).toBe('Hi there!');
      }
    });

    it('should parse multiple conversations', () => {
      // Insert conversations
      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run('conv-1', 'Conv 1');
      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run('conv-2', 'Conv 2');

      // Insert messages for conv-1
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-1', 'conv-1', 'user', 'Message 1', '2025-10-22T10:00:00Z');

      // Insert messages for conv-2
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-2', 'conv-2', 'user', 'Message 2', '2025-10-22T10:00:05Z');

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('should preserve message order', () => {
      const conversationId = 'conv-1';

      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, 'Test');

      // Insert messages in order
      for (let i = 0; i < 5; i++) {
        db.prepare(
          'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(`msg-${i}`, conversationId, 'user', `Message ${i}`, `2025-10-22T10:00:0${i}Z`);
      }

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(5);
        for (let i = 0; i < 5; i++) {
          expect(result.value[i].content).toBe(`Message ${i}`);
        }
      }
    });

    it('should set correct platform metadata', () => {
      const conversationId = 'conv-1';

      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, 'Test');
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-1', conversationId, 'user', 'Test', '2025-10-22T10:00:00Z');

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata?.extractedFrom).toBe('claude-desktop-sqlite');
        expect(result.value[0].metadata?.platform).toBe('claude-desktop');
        expect(result.value[0].metadata?.messageType).toBe('user_request');
      }
    });

    it('should handle empty content', () => {
      const conversationId = 'conv-1';

      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, 'Test');

      // Insert message with empty content
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-1', conversationId, 'user', '', '2025-10-22T10:00:00Z');

      // Insert message with content
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-2', conversationId, 'assistant', 'Response', '2025-10-22T10:00:05Z');

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should skip empty message
        expect(result.value).toHaveLength(1);
        expect(result.value[0].content).toBe('Response');
      }
    });

    it('should handle whitespace-only content', () => {
      const conversationId = 'conv-1';

      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, 'Test');

      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-1', conversationId, 'user', '   ', '2025-10-22T10:00:00Z');

      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-2', conversationId, 'assistant', 'Valid', '2025-10-22T10:00:05Z');

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should skip whitespace-only message
        expect(result.value).toHaveLength(1);
      }
    });
  });

  describe('Error handling', () => {
    it('should reject non-existent database', () => {
      const result = parser.parse('/non/existent/path.db');
      expect(result.ok).toBe(false);
    });

    it('should handle database without conversations table', () => {
      // Create database without conversations table
      const emptyDb = new Database(testDbPath);
      emptyDb.close();

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('should handle database without messages table', () => {
      // Create database with only conversations table
      db.exec('DROP TABLE messages');

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('Message ID generation', () => {
    it('should use message id if provided', () => {
      const conversationId = 'conv-1';

      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, 'Test');
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('custom-id-123', conversationId, 'user', 'Test', '2025-10-22T10:00:00Z');

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].id).toBe('custom-id-123');
      }
    });

    it('should generate ID if not provided', () => {
      const conversationId = 'conv-1';

      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, 'Test');

      // Insert message without id (will be NULL)
      db.prepare(
        'INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)'
      ).run(conversationId, 'user', 'Test', '2025-10-22T10:00:00Z');

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].id).toMatch(/claude-desktop-/);
      }
    });
  });

  describe('Timestamp handling', () => {
    it('should use provided timestamp', () => {
      const conversationId = 'conv-1';
      const timestamp = '2025-10-22T10:00:00Z';

      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, 'Test');
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run('msg-1', conversationId, 'user', 'Test', timestamp);

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].timestamp).toBe(timestamp);
      }
    });

    it('should generate timestamp if not provided', () => {
      const conversationId = 'conv-1';

      db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(conversationId, 'Test');
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
      ).run('msg-1', conversationId, 'user', 'Test');

      const result = parser.parse(testDbPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should be a valid ISO timestamp
        expect(result.value[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });
});

