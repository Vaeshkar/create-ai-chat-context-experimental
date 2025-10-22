/**
 * Tests for ConversationSummaryParser
 * October 2025
 */

import { describe, it, expect } from 'vitest';
import type { Message } from '../types/index.js';
import { ConversationSummaryParser } from './ConversationSummaryParser.js';

describe('ConversationSummaryParser', () => {
  const parser = new ConversationSummaryParser();

  describe('extractSummary', () => {
    it('should handle empty messages array', () => {
      const result = parser.extractSummary([]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metrics.totalMessages).toBe(0);
        expect(result.value.userQueries).toBe('');
        expect(result.value.aiResponses).toBe('');
      }
    });

    it('should extract user queries with full content (NO TRUNCATION)', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'This is a long user query that should NOT be truncated',
        },
        {
          id: '2',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'This is a response',
        },
      ];

      const result = parser.extractSummary(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userQueries).toContain(
          'This is a long user query that should NOT be truncated'
        );
        expect(result.value.userQueries).toContain('[User 1]');
      }
    });

    it('should extract AI responses with full content (NO TRUNCATION)', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Question?',
        },
        {
          id: '2',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'This is a very long AI response that should NOT be truncated to 250 chars',
        },
      ];

      const result = parser.extractSummary(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.aiResponses).toContain(
          'This is a very long AI response that should NOT be truncated to 250 chars'
        );
        expect(result.value.aiResponses).toContain('[AI 1]');
      }
    });

    it('should create full conversation with timestamps', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Hello',
        },
        {
          id: '2',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'Hi there',
        },
      ];

      const result = parser.extractSummary(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.fullConversation).toContain('[1] USER (2025-10-21T10:00:00Z)');
        expect(result.value.fullConversation).toContain('Hello');
        expect(result.value.fullConversation).toContain('[2] ASSISTANT (2025-10-21T10:01:00Z)');
        expect(result.value.fullConversation).toContain('Hi there');
      }
    });

    it('should calculate correct metrics', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'Hello',
        },
        {
          id: '2',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'Hi there',
        },
        {
          id: '3',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'user',
          content: 'How are you?',
        },
      ];

      const result = parser.extractSummary(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metrics.totalMessages).toBe(3);
        expect(result.value.metrics.userMessages).toBe(2);
        expect(result.value.metrics.aiMessages).toBe(1);
        expect(result.value.metrics.totalChars).toBe(5 + 8 + 12); // "Hello" + "Hi there" + "How are you?"
        expect(result.value.metrics.avgMessageLength).toBe(8); // 25 / 3 = 8.33 rounded
      }
    });

    it('should handle multiple user and AI messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'user',
          content: 'First question',
        },
        {
          id: '2',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:01:00Z',
          role: 'assistant',
          content: 'First answer',
        },
        {
          id: '3',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:02:00Z',
          role: 'user',
          content: 'Second question',
        },
        {
          id: '4',
          conversationId: 'conv-1',
          timestamp: '2025-10-21T10:03:00Z',
          role: 'assistant',
          content: 'Second answer',
        },
      ];

      const result = parser.extractSummary(messages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userQueries).toContain('[User 1]');
        expect(result.value.userQueries).toContain('[User 2]');
        expect(result.value.aiResponses).toContain('[AI 1]');
        expect(result.value.aiResponses).toContain('[AI 2]');
      }
    });
  });
});
