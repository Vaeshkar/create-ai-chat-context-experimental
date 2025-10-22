/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * IntentExtractor Tests
 * Verify user intent extraction with NO TRUNCATION
 */

import { describe, it, expect } from 'vitest';
import { IntentExtractor } from './IntentExtractor.js';
import type { Message, ConversationSummary } from '../types/index.js';

describe('IntentExtractor', () => {
  const extractor = new IntentExtractor();

  describe('extract from summary (PRIORITY 1)', () => {
    it('should extract user intents from conversation summary with full content', () => {
      const summary: ConversationSummary = {
        userQueries: `[User 1] How do I implement a TypeScript parser for conversation data?

[User 2] What are the best practices for error handling in TypeScript?`,
        aiResponses: '[AI 1] response...',
        fullConversation: 'full...',
        metrics: { totalMessages: 2, userMessages: 2, aiMessages: 1, totalCharacters: 100 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].intent).toBe(
          'How do I implement a TypeScript parser for conversation data?'
        );
        expect(result.value[0].inferredFrom).toBe('conversation_summary');
        expect(result.value[0].confidence).toBe('high');
        expect(result.value[1].intent).toBe(
          'What are the best practices for error handling in TypeScript?'
        );
      }
    });

    it('should preserve full intent content (NO TRUNCATION)', () => {
      const longQuery =
        'This is a very long user query that contains detailed information about what the user wants to accomplish. It includes multiple sentences and complex requirements that should not be truncated under any circumstances.';
      const summary: ConversationSummary = {
        userQueries: `[User 1] ${longQuery}`,
        aiResponses: '[AI 1] response...',
        fullConversation: 'full...',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 1, totalCharacters: 200 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].intent).toBe(longQuery);
        expect(result.value[0].intent.length).toBeGreaterThan(100);
      }
    });

    it('should handle empty user queries in summary', () => {
      const summary: ConversationSummary = {
        userQueries: '',
        aiResponses: '[AI 1] response...',
        fullConversation: 'full...',
        metrics: { totalMessages: 1, userMessages: 0, aiMessages: 1, totalCharacters: 50 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it('should extract multiple user intents with correct metadata', () => {
      const summary: ConversationSummary = {
        userQueries: `[User 1] First question?

[User 2] Second question?

[User 3] Third question?`,
        aiResponses: '[AI 1] response...',
        fullConversation: 'full...',
        metrics: { totalMessages: 3, userMessages: 3, aiMessages: 1, totalCharacters: 100 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0].messageIndex).toBe(1);
        expect(result.value[1].messageIndex).toBe(2);
        expect(result.value[2].messageIndex).toBe(3);
      }
    });
  });

  describe('extract from messages (PRIORITY 2)', () => {
    it('should extract intents from individual messages when summary is null', () => {
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
          content: 'Here is how...',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'user',
          content: 'What about error handling?',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].intent).toBe('How do I implement a parser?');
        expect(result.value[0].inferredFrom).toBe('individual_message');
        expect(result.value[0].confidence).toBe('medium');
        expect(result.value[1].intent).toBe('What about error handling?');
      }
    });

    it('should preserve full intent content from messages (NO TRUNCATION)', () => {
      const longQuery =
        'This is a comprehensive question about implementing TypeScript parsers with full error handling, type safety, and comprehensive testing. It should not be truncated.';
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: longQuery,
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].intent).toBe(longQuery);
        expect(result.value[0].intent.length).toBeGreaterThan(100);
      }
    });

    it('should filter out non-user messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'User question',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'AI response',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'system',
          content: 'System message',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].intent).toBe('User question');
      }
    });

    it('should handle empty messages array', () => {
      const result = extractor.extract([], null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('priority handling', () => {
    it('should prefer summary over messages (PRIORITY 1)', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Message intent',
        },
      ];

      const summary: ConversationSummary = {
        userQueries: '[User 1] Summary intent',
        aiResponses: '[AI 1] response...',
        fullConversation: 'full...',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 1, totalCharacters: 50 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].intent).toBe('Summary intent');
        expect(result.value[0].inferredFrom).toBe('conversation_summary');
      }
    });

    it('should fallback to messages when summary is empty', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Message intent',
        },
      ];

      const summary: ConversationSummary = {
        userQueries: '',
        aiResponses: '',
        fullConversation: '',
        metrics: { totalMessages: 0, userMessages: 0, aiMessages: 0, totalCharacters: 0 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].intent).toBe('Message intent');
        expect(result.value[0].inferredFrom).toBe('individual_message');
      }
    });
  });

  describe('error handling', () => {
    it('should handle extraction gracefully', () => {
      const extractor = new IntentExtractor();
      const messages: Message[] = [];
      const summary: ConversationSummary = {
        userQueries: '[User 1] Test query',
        aiResponses: '',
        fullConversation: '',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 20 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });
  });
});
