/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * TechnicalWorkExtractor Tests
 * Verify technical work extraction with NO TRUNCATION
 */

import { describe, it, expect } from 'vitest';
import { TechnicalWorkExtractor } from './TechnicalWorkExtractor.js';
import type { Message, ConversationSummary } from '../types/index.js';

describe('TechnicalWorkExtractor', () => {
  const extractor = new TechnicalWorkExtractor();

  describe('extract from summary (PRIORITY 1)', () => {
    it('should extract technical work from conversation summary', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: `We need to implement a TypeScript parser for conversation data.
We should also refactor the error handling system.
Let's build a comprehensive test suite.`,
        metrics: { totalMessages: 3, userMessages: 1, aiMessages: 2, totalCharacters: 200 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value.some((w) => w.work.includes('TypeScript parser'))).toBe(true);
      }
    });

    it('should preserve full work item content (NO TRUNCATION)', () => {
      const longWorkItem =
        'a comprehensive TypeScript parser that handles all conversation formats with full error handling, type safety, and extensive testing coverage';
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: `We need to implement ${longWorkItem}.`,
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 200 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((w) => w.work.includes('comprehensive'));
        expect(found).toBeDefined();
        if (found) {
          expect(found.work.length).toBeGreaterThan(50);
        }
      }
    });

    it('should detect automation work type', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: 'We need to automate the data pipeline workflow for production.',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 100 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((w) => w.work.includes('pipeline'));
        expect(found?.type).toBe('agent_automation');
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
    it('should extract technical work from individual messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We need to implement a new parser.',
        },
        {
          id: '2',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'I can help you build a comprehensive solution.',
        },
        {
          id: '3',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'user',
          content: 'We should also refactor the error handling.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value.some((w) => w.work.includes('implement'))).toBe(true);
      }
    });

    it('should preserve full work content from messages (NO TRUNCATION)', () => {
      const longMessage =
        'We need to implement a comprehensive TypeScript parser that handles all conversation formats with full error handling, type safety, and extensive testing coverage for production use.';
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
        const found = result.value.find((w) => w.work.includes('comprehensive'));
        expect(found).toBeDefined();
        if (found) {
          expect(found.work.length).toBeGreaterThan(100);
        }
      }
    });

    it('should detect automation work from code blocks', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'assistant',
          content: 'Here is the script:\n```bash\n#!/bin/bash\necho "test"\n```',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((w) => w.work.includes('script'));
        expect(found?.type).toBe('agent_automation');
      }
    });

    it('should filter messages without technical keywords', () => {
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

  describe('work type detection', () => {
    it('should detect conversation work type', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We need to implement a new feature.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].type).toBe('technical_conversation');
      }
    });

    it('should detect automation work type for scripts', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We need to create a script for automation.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].type).toBe('agent_automation');
      }
    });

    it('should detect automation work type for workflows', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'We need to build a workflow pipeline.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].type).toBe('agent_automation');
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
          content: 'We need to implement message work.',
        },
      ];

      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] response...',
        fullConversation: 'We need to implement summary work.',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 100 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const found = result.value.find((w) => w.work.includes('summary'));
        expect(found).toBeDefined();
        expect(found?.source).toBe('conversation_summary');
      }
    });
  });

  describe('error handling', () => {
    it('should handle extraction gracefully', () => {
      const messages: Message[] = [];
      const summary: ConversationSummary = {
        userQueries: '',
        aiResponses: '',
        fullConversation: 'We need to implement a new feature.',
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
