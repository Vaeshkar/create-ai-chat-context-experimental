/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * ActionExtractor Tests
 * Verify AI action extraction with NO TRUNCATION
 */

import { describe, it, expect } from 'vitest';
import { ActionExtractor } from './ActionExtractor.js';
import type { Message, ConversationSummary } from '../types/index.js';

describe('ActionExtractor', () => {
  const extractor = new ActionExtractor();

  describe('extract from summary (PRIORITY 1)', () => {
    it('should extract AI actions from conversation summary with full content', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: `[AI 1] Here is a comprehensive response to your question about TypeScript implementation.

[AI 2] Let me provide additional context and examples.`,
        fullConversation: 'full...',
        metrics: { totalMessages: 2, userMessages: 1, aiMessages: 2, totalCharacters: 150 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].details).toBe(
          'Here is a comprehensive response to your question about TypeScript implementation.'
        );
        expect(result.value[0].source).toBe('conversation_summary');
        expect(result.value[0].type).toBe('augment_ai_response');
      }
    });

    it('should preserve full action content (NO TRUNCATION)', () => {
      const longResponse =
        'This is a very long AI response that contains detailed information, code examples, explanations, and comprehensive guidance. It should not be truncated under any circumstances because the full context is important.';
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: `[AI 1] ${longResponse}`,
        fullConversation: 'full...',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 1, totalCharacters: 250 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].details).toBe(longResponse);
        expect(result.value[0].details.length).toBeGreaterThan(100);
      }
    });

    it('should detect agent_action type for code responses', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: `[AI 1] Here is the implementation:

\`\`\`typescript
export class Parser {
  parse(data: string) {
    return data;
  }
}
\`\`\``,
        fullConversation: 'full...',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 1, totalCharacters: 150 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].type).toBe('augment_agent_action');
      }
    });

    it('should handle empty AI responses in summary', () => {
      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '',
        fullConversation: 'full...',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 0, totalCharacters: 50 },
      };

      const result = extractor.extract([], summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('extract from messages (PRIORITY 2)', () => {
    it('should extract actions from individual messages when summary is null', () => {
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
          content: 'Here is how you implement a parser with TypeScript.',
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
          content: 'Error handling is important for robustness.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].details).toBe('Here is how you implement a parser with TypeScript.');
        expect(result.value[0].source).toBe('augment_leveldb');
      }
    });

    it('should preserve full action content from messages (NO TRUNCATION)', () => {
      const longResponse =
        'This is a comprehensive AI response that provides detailed explanations, code examples, best practices, and comprehensive guidance on the topic. It should not be truncated.';
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'assistant',
          content: longResponse,
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].details).toBe(longResponse);
        expect(result.value[0].details.length).toBeGreaterThan(100);
      }
    });

    it('should filter out non-assistant messages', () => {
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
        expect(result.value[0].details).toBe('AI response');
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

  describe('action type detection', () => {
    it('should detect response type for normal text', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'assistant',
          content: 'This is a normal response.',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].type).toBe('augment_ai_response');
      }
    });

    it('should detect agent_action for code blocks', () => {
      const messages: Message[] = [
        {
          id: '1',
          conversationId: 'conv1',
          timestamp: '2025-10-21T10:00:00Z',
          role: 'assistant',
          content: 'Here is the code:\n```typescript\nconst x = 1;\n```',
        },
      ];

      const result = extractor.extract(messages, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].type).toBe('augment_agent_action');
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
          role: 'assistant',
          content: 'Message action',
        },
      ];

      const summary: ConversationSummary = {
        userQueries: '[User 1] question...',
        aiResponses: '[AI 1] Summary action',
        fullConversation: 'full...',
        metrics: { totalMessages: 1, userMessages: 1, aiMessages: 1, totalCharacters: 50 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].details).toBe('Summary action');
        expect(result.value[0].source).toBe('conversation_summary');
      }
    });
  });

  describe('error handling', () => {
    it('should handle extraction gracefully', () => {
      const messages: Message[] = [];
      const summary: ConversationSummary = {
        userQueries: '',
        aiResponses: '[AI 1] Test response',
        fullConversation: '',
        metrics: { totalMessages: 1, userMessages: 0, aiMessages: 1, totalCharacters: 20 },
      };

      const result = extractor.extract(messages, summary);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });
  });
});
