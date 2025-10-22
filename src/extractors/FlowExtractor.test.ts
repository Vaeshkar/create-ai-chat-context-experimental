/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * FlowExtractor Tests
 * Verify conversation flow extraction
 */

import { describe, it, expect } from 'vitest';
import { FlowExtractor } from './FlowExtractor.js';
import type { Message } from '../types/index.js';

describe('FlowExtractor', () => {
  const extractor = new FlowExtractor();

  describe('extract flow', () => {
    it('should extract conversation flow from messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'How do I implement a parser?',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'Here is a comprehensive guide on implementing a parser with TypeScript.',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'user',
          content: 'What about error handling?',
        },
        {
          id: '4',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:03:00Z',
          role: 'assistant',
          content: 'Error handling is crucial for robustness.',
        },
      ];

      const result = extractor.extract(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sequence).toHaveLength(4);
        expect(result.value.turns).toBe(2);
        expect(result.value.dominantRole).toBe('balanced');
      }
    });

    it('should categorize messages by role and length', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Short',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'user',
          content:
            'This is a much longer user message that exceeds one hundred characters in length and continues with more text to ensure it is definitely over the threshold.',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'assistant',
          content: 'Short response',
        },
      ];

      const result = extractor.extract(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sequence[0]).toBe('user_short');
        expect(result.value.sequence[1]).toBe('user_long');
        expect(result.value.sequence[2]).toBe('assistant_short');
      }
    });

    it('should count conversation turns correctly', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'First question',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'First response',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'user',
          content: 'Second question',
        },
        {
          id: '4',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:03:00Z',
          role: 'assistant',
          content: 'Second response',
        },
        {
          id: '5',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:04:00Z',
          role: 'user',
          content: 'Third question',
        },
      ];

      const result = extractor.extract(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.turns).toBe(3);
      }
    });

    it('should handle empty messages array', () => {
      const result = extractor.extract([]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sequence).toHaveLength(0);
        expect(result.value.turns).toBe(0);
        expect(result.value.dominantRole).toBe('balanced');
      }
    });
  });

  describe('dominant role detection', () => {
    it('should detect user-dominant conversation', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Question 1',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'user',
          content: 'Question 2',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'user',
          content: 'Question 3',
        },
        {
          id: '4',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:03:00Z',
          role: 'assistant',
          content: 'Response',
        },
      ];

      const result = extractor.extract(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.dominantRole).toBe('user');
      }
    });

    it('should detect assistant-dominant conversation', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Question',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'Response 1',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'assistant',
          content: 'Response 2',
        },
        {
          id: '4',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:03:00Z',
          role: 'assistant',
          content: 'Response 3',
        },
      ];

      const result = extractor.extract(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.dominantRole).toBe('assistant');
      }
    });

    it('should detect balanced conversation', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Question 1',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'Response 1',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'user',
          content: 'Question 2',
        },
        {
          id: '4',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:03:00Z',
          role: 'assistant',
          content: 'Response 2',
        },
      ];

      const result = extractor.extract(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.dominantRole).toBe('balanced');
      }
    });

    it('should handle only user messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Question 1',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'user',
          content: 'Question 2',
        },
      ];

      const result = extractor.extract(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.dominantRole).toBe('user');
      }
    });

    it('should handle only assistant messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'assistant',
          content: 'Response 1',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'Response 2',
        },
      ];

      const result = extractor.extract(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.dominantRole).toBe('assistant');
      }
    });
  });

  describe('error handling', () => {
    it('should handle extraction gracefully', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Test message',
        },
      ];

      const result = extractor.extract(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sequence).toHaveLength(1);
      }
    });
  });
});
