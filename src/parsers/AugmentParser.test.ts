/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * AugmentParser Tests
 * Verify Augment LevelDB format parsing
 */

import { describe, it, expect } from 'vitest';
import { AugmentParser } from './AugmentParser.js';

describe('AugmentParser', () => {
  const parser = new AugmentParser();

  describe('parse', () => {
    it('should parse Augment data into messages', () => {
      const rawData = `
        "request_message": "How do I implement a parser?"
        "response_text": "Here is a comprehensive guide on implementing a parser."
      `;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value.some((m) => m.role === 'user')).toBe(true);
        expect(result.value.some((m) => m.role === 'assistant')).toBe(true);
      }
    });

    it('should preserve full message content (NO TRUNCATION)', () => {
      const longMessage =
        'This is a very long message that contains comprehensive information about implementing a parser with full error handling, type safety, and extensive testing coverage for production use.';
      const rawData = `"request_message": "${longMessage}"`;

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

    it('should extract multiple user requests', () => {
      const rawData = `
        "request_message": "First question?"
        "request_message": "Second question?"
        "request_message": "Third question?"
      `;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const userMessages = result.value.filter((m) => m.role === 'user');
        expect(userMessages.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should extract multiple AI responses', () => {
      const rawData = `
        "response_text": "This is the first response with enough content"
        "response_text": "This is the second response with enough content"
        "response_text": "This is the third response with enough content"
      `;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const assistantMessages = result.value.filter((m) => m.role === 'assistant');
        expect(assistantMessages.length).toBeGreaterThanOrEqual(3);
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

    it('should filter out short messages', () => {
      const rawData = `
        "request_message": "Hi"
        "request_message": "This is a longer message with more content."
      `;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.every((m) => m.content.length > 5)).toBe(true);
      }
    });

    it('should set correct conversation ID', () => {
      const rawData = `"request_message": "Test message"`;
      const convId = 'my-conversation-id';

      const result = parser.parse(rawData, convId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.every((m) => m.conversationId === convId)).toBe(true);
      }
    });

    it('should set correct role for messages', () => {
      const rawData = `
        "request_message": "This is a user message with enough content"
        "response_text": "This is an assistant message with enough content"
      `;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const userMsg = result.value.find((m) => m.role === 'user');
        const assistantMsg = result.value.find((m) => m.role === 'assistant');
        expect(userMsg?.role).toBe('user');
        expect(assistantMsg?.role).toBe('assistant');
      }
    });
  });

  describe('message cleaning', () => {
    it('should unescape newlines', () => {
      const rawData = `"request_message": "Line 1\\nLine 2\\nLine 3"`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].content).toContain('\n');
      }
    });

    it('should unescape tabs', () => {
      const rawData = `"request_message": "Column1\\tColumn2\\tColumn3"`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].content).toContain('\t');
      }
    });

    it('should unescape quotes', () => {
      const rawData = `"request_message": "He said \\"Hello\\" to everyone in the meeting today"`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0].content).toContain('"');
      }
    });

    it('should trim whitespace', () => {
      const rawData = `"request_message": "   Message with spaces   "`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].content).toBe('Message with spaces');
      }
    });
  });

  describe('format detection', () => {
    it('should detect Augment data with request_message', () => {
      const data = '"request_message": "test"';
      expect(parser.isAugmentData(data)).toBe(true);
    });

    it('should detect Augment data with response_text', () => {
      const data = '"response_text": "test"';
      expect(parser.isAugmentData(data)).toBe(true);
    });

    it('should detect Augment data with conversationId', () => {
      const data = '"conversationId": "test"';
      expect(parser.isAugmentData(data)).toBe(true);
    });

    it('should reject non-Augment data', () => {
      const data = 'some random text without augment markers';
      expect(parser.isAugmentData(data)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle parsing gracefully', () => {
      const rawData = `"request_message": "This is a test message with enough content"`;

      const result = parser.parse(rawData, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });
  });
});
