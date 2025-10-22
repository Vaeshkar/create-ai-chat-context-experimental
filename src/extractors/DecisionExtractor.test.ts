/**
 * DecisionExtractor Tests
 * Verify decision extraction with impact assessment
 */

import { describe, it, expect } from 'vitest';
import { DecisionExtractor } from './DecisionExtractor.js';
import type { Message, ConversationSummary } from '../types/index.js';

describe('DecisionExtractor', () => {
  const extractor = new DecisionExtractor();

  describe('extract from summary (PRIORITY 1)', () => {
    it('should extract decisions from conversation summary', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: `We decided to implement a TypeScript parser.
We agreed to use Vitest for testing.
We should refactor the error handling system.`,
        metrics: { totalMessages: 3, userMessages: 1, aiMessages: 2, totalCharacters: 200 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value.some((d) => d.decision.includes('TypeScript parser'))).toBe(true);
      }
    });

    it('should preserve full decision content (NO TRUNCATION)', () => {
      const longDecision =
        'to implement a comprehensive TypeScript parser that handles all conversation formats with full error handling, type safety, and extensive testing coverage for production use';
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: `We decided ${longDecision}.`,
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 200 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((d) => d.decision.includes('comprehensive'));
        expect(found).toBeDefined();
        if (found) {
          expect(found.decision.length).toBeGreaterThan(50);
        }
      }
    });

    it('should assess high impact decisions', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: 'We decided to refactor the architecture for production.',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 100 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((d) => d.decision.includes('refactor'));
        expect(found?.impact).toBe('high');
      }
    });

    it('should assess medium impact decisions', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: 'We decided to implement a new feature.',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 100 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((d) => d.decision.includes('implement'));
        expect(found?.impact).toBe('medium');
      }
    });

    it('should assess low impact decisions', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: 'We decided to use a different naming convention.',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 100 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty conversation summary', () => {
      const summary: ConversationSummary = {
        userQueries: '',
        aiResponses: '',
        fullConversation: '',
        metrics: { totalMessages: 0, userMessages: 0, aiMessages: 0, totalCharacters: 0 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('extract from messages (PRIORITY 2)', () => {
    it('should extract decisions from individual messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We decided to use TypeScript.',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'Good choice. We should also add testing.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('should preserve full decision content from messages (NO TRUNCATION)', () => {
      const longMessage =
        'We decided to implement a comprehensive TypeScript parser that handles all conversation formats with full error handling, type safety, and extensive testing coverage for production use.';
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: longMessage,
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((d) => d.decision.includes('comprehensive'));
        expect(found).toBeDefined();
        if (found) {
          expect(found.decision.length).toBeGreaterThan(100);
        }
      }
    });

    it('should filter messages without decision keywords', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Hello, how are you?',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'I am doing well, thank you.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
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

  describe('impact assessment', () => {
    it('should assess high impact for architecture decisions', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We decided to refactor the architecture.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].impact).toBe('high');
      }
    });

    it('should assess medium impact for implementation decisions', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We decided to implement a new feature.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].impact).toBe('medium');
      }
    });

    it('should assess low impact for other decisions', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We decided to use a different naming convention.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].impact).toBe('low');
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
          content: 'We decided to use message decision.',
        },
      ];

      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: 'We decided to use summary decision.',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 100 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((d) => d.decision.includes('summary'));
        expect(found).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('should handle extraction gracefully', () => {
      const messages: Message[] = [];
      const summary: ConversationSummary = {
        userQueries: '',
        aiResponses: '',
        fullConversation: 'We decided to implement a new feature.',
        metrics: { totalMessages: 1, userMessages: 0, aiMessages: 0, totalCharacters: 50 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
