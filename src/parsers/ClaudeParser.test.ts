/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Claude Parser Tests
 * October 2025
 */

import { describe, it, expect } from 'vitest';
import { ClaudeParser } from './ClaudeParser.js';

describe('ClaudeParser', () => {
  const parser = new ClaudeParser();

  describe('parse()', () => {
    it('should parse valid Claude export JSON', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'Test Conversation',
        },
        chats: [
          {
            index: 0,
            type: 'prompt',
            message: [{ type: 'p', data: 'Hello Claude' }],
          },
          {
            index: 1,
            type: 'response',
            message: [{ type: 'p', data: 'Hello! How can I help?' }],
          },
        ],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].role).toBe('user');
        expect(result.value[0].content).toBe('Hello Claude');
        expect(result.value[1].role).toBe('assistant');
        expect(result.value[1].content).toBe('Hello! How can I help?');
      }
    });

    it('should handle code blocks', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'Code Example',
        },
        chats: [
          {
            index: 0,
            type: 'prompt',
            message: [{ type: 'p', data: 'Show me JavaScript' }],
          },
          {
            index: 1,
            type: 'response',
            message: [
              { type: 'p', data: 'Here is an example:' },
              {
                type: 'pre',
                language: 'javascript',
                data: 'console.log("Hello");',
              },
            ],
          },
        ],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[1].content).toContain('```javascript');
        expect(result.value[1].content).toContain('console.log');
      }
    });

    it('should handle multiple content blocks', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'Multi Block',
        },
        chats: [
          {
            index: 0,
            type: 'response',
            message: [
              { type: 'p', data: 'First paragraph' },
              { type: 'p', data: 'Second paragraph' },
              { type: 'pre', language: 'python', data: 'print("code")' },
            ],
          },
        ],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const content = result.value[0].content;
        expect(content).toContain('First paragraph');
        expect(content).toContain('Second paragraph');
        expect(content).toContain('```python');
      }
    });

    it('should generate conversation ID from title', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'My Test Conversation!',
        },
        chats: [
          {
            index: 0,
            type: 'prompt',
            message: [{ type: 'p', data: 'Test' }],
          },
        ],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].conversationId).toBe('my-test-conversation');
      }
    });

    it('should set platform metadata', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'Test',
        },
        chats: [
          {
            index: 0,
            type: 'prompt',
            message: [{ type: 'p', data: 'Test' }],
          },
        ],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata?.platform).toBe('claude');
        expect(result.value[0].metadata?.extractedFrom).toBe('claude-export');
      }
    });

    it('should reject invalid data', () => {
      const result = parser.parse(null);
      expect(result.ok).toBe(false);
    });

    it('should reject missing meta', () => {
      const result = parser.parse({ chats: [] });
      expect(result.ok).toBe(false);
    });

    it('should reject missing chats', () => {
      const result = parser.parse({
        meta: { exported_at: '2024-03-19 16:03:09', title: 'Test' },
      });
      expect(result.ok).toBe(false);
    });

    it('should skip malformed messages', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'Test',
        },
        chats: [
          {
            index: 0,
            type: 'prompt',
            message: [{ type: 'p', data: 'Valid' }],
          },
          {
            index: 1,
            type: 'response',
            // Missing message array
          },
          {
            index: 2,
            type: 'prompt',
            message: [{ type: 'p', data: 'Also valid' }],
          },
        ],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('should handle empty message blocks', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'Test',
        },
        chats: [
          {
            index: 0,
            type: 'prompt',
            message: [
              { type: 'p', data: 'Text' },
              { type: 'p' }, // No data
            ],
          },
        ],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].content).toBe('Text');
      }
    });

    it('should handle unknown block types', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'Test',
        },
        chats: [
          {
            index: 0,
            type: 'prompt',
            message: [
              { type: 'p', data: 'Text' },
              { type: 'unknown', data: 'Unknown content' },
            ],
          },
        ],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].content).toContain('Text');
        expect(result.value[0].content).toContain('Unknown content');
      }
    });

    it('should parse timestamp correctly', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'Test',
        },
        chats: [
          {
            index: 0,
            type: 'prompt',
            message: [{ type: 'p', data: 'Test' }],
          },
        ],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const timestamp = result.value[0].timestamp;
        // Should be ISO 8601 format
        expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });

    it('should handle empty chats array', () => {
      const data = {
        meta: {
          exported_at: '2024-03-19 16:03:09',
          title: 'Empty',
        },
        chats: [],
      };

      const result = parser.parse(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });
  });
});
