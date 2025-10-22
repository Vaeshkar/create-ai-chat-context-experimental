/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * StateExtractor Tests
 * Verify working state extraction
 */

import { describe, it, expect } from 'vitest';
import { StateExtractor } from './StateExtractor.js';
import type { Message, ConversationSummary } from '../types/index.js';

describe('StateExtractor', () => {
  const extractor = new StateExtractor();

  describe('extract from summary (PRIORITY 1)', () => {
    it('should extract working state from conversation summary', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: `Currently working on implementing the TypeScript parser.
We are blocked by the missing type definitions.
Next we should test the implementation.`,
        metrics: { totalMessages: 3, userMessages: 1, aiMessages: 2, totalCharacters: 200 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentTask).toContain('TypeScript parser');
        expect(result.value.blockers.length).toBeGreaterThan(0);
        expect(result.value.nextAction).toBeDefined();
      }
    });

    it('should extract blockers from summary', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: `We are blocked by missing dependencies.
There is an issue with the build system.
We cannot proceed without fixing the type errors.`,
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 150 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.blockers.length).toBeGreaterThan(0);
      }
    });

    it('should extract next action from summary', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: 'Next we should implement the parser. Then we will test it.',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 100 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nextAction).toContain('implement');
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
        expect(result.value.currentTask).toBeDefined();
        expect(result.value.blockers).toHaveLength(0);
        expect(result.value.nextAction).toBeDefined();
      }
    });
  });

  describe('extract from messages (PRIORITY 2)', () => {
    it('should extract working state from individual messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Currently working on implementing the parser.',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'We are blocked by missing type definitions.',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'user',
          content: 'Next we should test the implementation.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentTask).toBeDefined();
        expect(result.value.blockers.length).toBeGreaterThan(0);
        expect(result.value.nextAction).toBeDefined();
      }
    });

    it('should extract multiple blockers from messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content:
            'We are blocked by missing dependencies. There is an issue with the build system.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.blockers.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty messages array', () => {
      const result = extractor.extract([], null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentTask).toBeDefined();
        expect(result.value.blockers).toHaveLength(0);
        expect(result.value.nextAction).toBeDefined();
      }
    });

    it('should filter messages without state keywords', () => {
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
        expect(result.value.currentTask).toBeDefined();
      }
    });
  });

  describe('current task extraction', () => {
    it('should extract current task from content', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Currently working on implementing the TypeScript parser.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentTask).toContain('TypeScript parser');
      }
    });

    it('should extract task from "now working on" pattern', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Now working on the error handling system.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentTask).toContain('error handling');
      }
    });
  });

  describe('blocker extraction', () => {
    it('should extract blockers with "blocked by" pattern', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We are blocked by missing type definitions.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.blockers).toContain('missing type definitions');
      }
    });

    it('should extract blockers with "cannot" pattern', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We cannot proceed without fixing the build errors.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.blockers.length).toBeGreaterThan(0);
      }
    });

    it('should remove duplicate blockers', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content:
            'We are blocked by missing dependencies. We are blocked by missing dependencies.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.blockers.length).toBe(1);
      }
    });
  });

  describe('next action extraction', () => {
    it('should extract next action from "next" pattern', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Next we should test the implementation.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nextAction).toContain('test');
      }
    });

    it('should extract next action from "then" pattern', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Then we will review the code.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nextAction).toContain('review');
      }
    });

    it('should suggest next action based on context', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We just finished implementing the parser.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nextAction).toContain('Test');
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
          content: 'Currently working on message task.',
        },
      ];

      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: 'Currently working on summary task.',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 100 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentTask).toContain('summary');
      }
    });
  });

  describe('error handling', () => {
    it('should handle extraction gracefully', () => {
      const messages: Message[] = [];
      const summary: ConversationSummary = {
        userQueries: '',
        aiResponses: '',
        fullConversation: 'Currently working on a task.',
        metrics: { totalMessages: 1, userMessages: 0, aiMessages: 0, totalCharacters: 50 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentTask).toBeDefined();
      }
    });
  });
});
