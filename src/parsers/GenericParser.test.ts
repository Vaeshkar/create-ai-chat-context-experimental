/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * GenericParser Tests
 * Verify generic/unknown format parsing
 */

import { describe, it, expect } from 'vitest';
import { GenericParser } from './GenericParser.js';

describe('GenericParser', () => {
  const parser = new GenericParser();

  describe('parse', () => {
    it('should parse generic data into messages', () => {
      const rawData = `user: How do I implement a parser?
assistant: Here is a comprehensive guide.`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('should preserve full message content (NO TRUNCATION)', () => {
      const longMessage =
        'This is a very long message that contains comprehensive information about implementing a parser with full error handling, type safety, and extensive testing coverage for production use.';
      const rawData = `user: ${longMessage}`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((m) => m.content.includes('comprehensive'));
        expect(found).toBeDefined();
        if (found) {
          expect(found.content.length).toBeGreaterThan(100);
        }
      }
    });

    it('should handle empty data', () => {
      const result = parser.parse('', 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it('should handle whitespace-only data', () => {
      const result = parser.parse('   \n\t  ', 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('JSON format parsing', () => {
    it('should parse JSON array of messages', () => {
      const rawData = JSON.stringify([
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
      ]);

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
        expect(result.value[0].role).toBe('user');
        expect(result.value[1].role).toBe('assistant');
      }
    });

    it('should parse JSON with alternative field names', () => {
      const rawData = JSON.stringify([
        { type: 'user', message: 'Question' },
        { type: 'assistant', text: 'Answer' },
      ]);

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
      }
    });

    it('should parse single JSON object', () => {
      const rawData = JSON.stringify({
        role: 'user',
        content: 'Single message',
      });

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
      }
    });

    it('should filter out empty messages from JSON', () => {
      const rawData = JSON.stringify([
        { role: 'user', content: 'Message' },
        { role: 'assistant', content: '' },
      ]);

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
      }
    });
  });

  describe('line-based format parsing', () => {
    it('should parse "role: content" format', () => {
      const rawData = `user: How do I implement a parser?
assistant: Here is a comprehensive guide.`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
        expect(result.value[0].role).toBe('user');
        expect(result.value[1].role).toBe('assistant');
      }
    });

    it('should handle alternative role names', () => {
      const rawData = `human: Question?
ai: Answer.`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
        expect(result.value[0].role).toBe('user');
        expect(result.value[1].role).toBe('assistant');
      }
    });

    it('should skip empty lines', () => {
      const rawData = `user: First message

assistant: Second message

user: Third message`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(3);
      }
    });

    it('should filter out short messages', () => {
      const rawData = `user: Hi
assistant: This is a longer message with more content.`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.every((m) => m.content.length > 5)).toBe(true);
      }
    });
  });

  describe('markdown format parsing', () => {
    it('should parse markdown-style format', () => {
      const rawData = `## User
How do I implement a parser?

## Assistant
Here is a comprehensive guide.`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
        expect(result.value[0].role).toBe('user');
        expect(result.value[1].role).toBe('assistant');
      }
    });

    it('should handle alternative markdown headers', () => {
      const rawData = `## Human
Question?

## AI
Answer.`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
      }
    });

    it('should preserve multiline content in markdown', () => {
      const rawData = `## User
Line 1
Line 2
Line 3

## Assistant
Response`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].content).toContain('Line 1');
        expect(result.value[0].content).toContain('Line 2');
        expect(result.value[0].content).toContain('Line 3');
      }
    });
  });

  describe('fallback format parsing', () => {
    it('should treat plain text as single message', () => {
      const rawData = 'This is just plain text without any special format.';

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(1);
        expect(result.value[0].role).toBe('user');
        expect(result.value[0].content).toBe(rawData);
      }
    });

    it('should not treat short text as message', () => {
      const rawData = 'Hi';

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('format detection', () => {
    it('should detect JSON format', () => {
      const data = '[{"role": "user", "content": "test"}]';
      expect(parser.isGenericData(data)).toBe(true);
    });

    it('should detect line-based format', () => {
      const data = 'user: test message';
      expect(parser.isGenericData(data)).toBe(true);
    });

    it('should detect markdown format', () => {
      const data = '## User\ntest message';
      expect(parser.isGenericData(data)).toBe(true);
    });

    it('should detect plain text', () => {
      const data = 'This is plain text';
      expect(parser.isGenericData(data)).toBe(true);
    });

    it('should reject empty data', () => {
      expect(parser.isGenericData('')).toBe(false);
      expect(parser.isGenericData('   ')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle parsing gracefully', () => {
      const rawData = 'user: Test message';

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });
  });
});
