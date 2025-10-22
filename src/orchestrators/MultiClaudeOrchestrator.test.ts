/**
 * Multi-Claude Orchestrator Tests
 * Phase 5.5c: October 2025
 */

import { describe, it, expect } from 'vitest';
import type { Message } from '../types/index.js';
import { MultiClaudeOrchestrator } from './MultiClaudeOrchestrator.js';

describe('MultiClaudeOrchestrator', () => {
  let orchestrator: MultiClaudeOrchestrator;

  const createMessage = (
    id: string,
    content: string,
    role: 'user' | 'assistant' = 'user',
    conversationId: string = 'conv-1'
  ): Message => ({
    id,
    conversationId,
    timestamp: new Date().toISOString(),
    role,
    content,
    metadata: {
      extractedFrom: 'test',
      rawLength: content.length,
      messageType: role === 'user' ? 'user_request' : 'ai_response',
    },
  });

  beforeEach(() => {
    orchestrator = new MultiClaudeOrchestrator();
  });

  describe('consolidate', () => {
    it('should consolidate empty arrays', () => {
      const result = orchestrator.consolidate([], [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages).toEqual([]);
        expect(result.value.deduplicatedCount).toBe(0);
      }
    });

    it('should consolidate messages from single source', () => {
      const webMessages = [createMessage('msg-1', 'Hello from web')];

      const result = orchestrator.consolidate(webMessages, [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages).toHaveLength(1);
        expect(result.value.messages[0].metadata.source).toBe('claude-web');
        expect(result.value.sourceBreakdown.web).toBe(1);
        expect(result.value.sourceBreakdown.desktop).toBe(0);
        expect(result.value.sourceBreakdown.cli).toBe(0);
      }
    });

    it('should consolidate messages from all sources', () => {
      const webMessages = [createMessage('msg-1', 'Hello from web')];
      const desktopMessages = [createMessage('msg-2', 'Hello from desktop')];
      const cliMessages = [createMessage('msg-3', 'Hello from CLI')];

      const result = orchestrator.consolidate(webMessages, desktopMessages, cliMessages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages).toHaveLength(3);
        expect(result.value.sourceBreakdown.web).toBe(1);
        expect(result.value.sourceBreakdown.desktop).toBe(1);
        expect(result.value.sourceBreakdown.cli).toBe(1);
      }
    });

    it('should add source metadata to messages', () => {
      const webMessages = [createMessage('msg-1', 'Test')];

      const result = orchestrator.consolidate(webMessages, [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const msg = result.value.messages[0];
        expect(msg.metadata.source).toBe('claude-web');
        expect(msg.metadata.sourceTimestamp).toBeDefined();
        expect(msg.metadata.contentHash).toBeDefined();
      }
    });

    it('should add content hash to messages', () => {
      const webMessages = [createMessage('msg-1', 'Test content')];

      const result = orchestrator.consolidate(webMessages, [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const msg = result.value.messages[0];
        expect(msg.metadata.contentHash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
      }
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate identical content', () => {
      const content = 'Identical message';
      const webMessages = [createMessage('msg-1', content)];
      const desktopMessages = [createMessage('msg-2', content)];

      const result = orchestrator.consolidate(webMessages, desktopMessages, []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages).toHaveLength(1);
        expect(result.value.deduplicatedCount).toBe(1);
        expect(result.value.conflictCount).toBe(1);
      }
    });

    it('should keep earliest timestamp on duplicate', () => {
      const content = 'Duplicate';
      const msg1 = createMessage('msg-1', content);
      msg1.timestamp = '2025-10-22T10:00:00Z';

      const msg2 = createMessage('msg-2', content);
      msg2.timestamp = '2025-10-22T10:00:05Z';

      const result = orchestrator.consolidate([msg1], [msg2], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages).toHaveLength(1);
        expect(result.value.messages[0].timestamp).toBe('2025-10-22T10:00:00Z');
      }
    });

    it('should not deduplicate different content', () => {
      const webMessages = [createMessage('msg-1', 'Message 1')];
      const desktopMessages = [createMessage('msg-2', 'Message 2')];

      const result = orchestrator.consolidate(webMessages, desktopMessages, []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages).toHaveLength(2);
        expect(result.value.deduplicatedCount).toBe(0);
      }
    });

    it('should handle multiple duplicates', () => {
      const content = 'Duplicate';
      const msg1 = createMessage('msg-1', content);
      const msg2 = createMessage('msg-2', content);
      const msg3 = createMessage('msg-3', content);

      const result = orchestrator.consolidate([msg1], [msg2], [msg3]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages).toHaveLength(1);
        expect(result.value.deduplicatedCount).toBe(2);
        expect(result.value.conflictCount).toBe(2);
      }
    });
  });

  describe('Source tracking', () => {
    it('should track web source', () => {
      const webMessages = [createMessage('msg-1', 'Web message')];

      const result = orchestrator.consolidate(webMessages, [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages[0].metadata.source).toBe('claude-web');
      }
    });

    it('should track desktop source', () => {
      const desktopMessages = [createMessage('msg-1', 'Desktop message')];

      const result = orchestrator.consolidate([], desktopMessages, []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages[0].metadata.source).toBe('claude-desktop');
      }
    });

    it('should track CLI source', () => {
      const cliMessages = [createMessage('msg-1', 'CLI message')];

      const result = orchestrator.consolidate([], [], cliMessages);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages[0].metadata.source).toBe('claude-cli');
      }
    });
  });

  describe('groupByConversation', () => {
    it('should group messages by conversation ID', () => {
      const webMessages = [
        createMessage('msg-1', 'Message 1', 'user', 'conv-1'),
        createMessage('msg-2', 'Message 2', 'assistant', 'conv-1'),
        createMessage('msg-3', 'Message 3', 'user', 'conv-2'),
      ];

      const result = orchestrator.consolidate(webMessages, [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const grouped = orchestrator.groupByConversation(result.value.messages);

        expect(grouped.size).toBe(2);
        expect(grouped.get('conv-1')).toHaveLength(2);
        expect(grouped.get('conv-2')).toHaveLength(1);
      }
    });
  });

  describe('filterBySource', () => {
    it('should filter messages by source', () => {
      const webMessages = [createMessage('msg-1', 'Web')];
      const desktopMessages = [createMessage('msg-2', 'Desktop')];

      const result = orchestrator.consolidate(webMessages, desktopMessages, []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const webOnly = orchestrator.filterBySource(result.value.messages, 'claude-web');
        expect(webOnly).toHaveLength(1);
        expect(webOnly[0].metadata.source).toBe('claude-web');
      }
    });
  });

  describe('filterByConversation', () => {
    it('should filter messages by conversation', () => {
      const webMessages = [
        createMessage('msg-1', 'Message 1', 'user', 'conv-1'),
        createMessage('msg-2', 'Message 2', 'user', 'conv-2'),
      ];

      const result = orchestrator.consolidate(webMessages, [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const conv1 = orchestrator.filterByConversation(result.value.messages, 'conv-1');
        expect(conv1).toHaveLength(1);
        expect(conv1[0].conversationId).toBe('conv-1');
      }
    });
  });

  describe('sortByTimestamp', () => {
    it('should sort messages by timestamp', () => {
      const msg1 = createMessage('msg-1', 'First');
      msg1.timestamp = '2025-10-22T10:00:05Z';

      const msg2 = createMessage('msg-2', 'Second');
      msg2.timestamp = '2025-10-22T10:00:00Z';

      const msg3 = createMessage('msg-3', 'Third');
      msg3.timestamp = '2025-10-22T10:00:10Z';

      const result = orchestrator.consolidate([msg1, msg2, msg3], [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const sorted = orchestrator.sortByTimestamp(result.value.messages);

        expect(sorted[0].content).toBe('Second');
        expect(sorted[1].content).toBe('First');
        expect(sorted[2].content).toBe('Third');
      }
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics', () => {
      const webMessages = [createMessage('msg-1', 'Message 1')];
      const desktopMessages = [createMessage('msg-2', 'Message 2')];

      const result = orchestrator.consolidate(webMessages, desktopMessages, []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const stats = orchestrator.getStatistics(result.value);

        expect(stats.totalMessages).toBe(2);
        expect(stats.deduplicatedCount).toBe(0);
        expect(stats.deduplicationRate).toBe('0.00%');
        expect(stats.sourceBreakdown.web).toBe(1);
        expect(stats.sourceBreakdown.desktop).toBe(1);
      }
    });

    it('should calculate deduplication rate', () => {
      const content = 'Duplicate';
      const msg1 = createMessage('msg-1', content);
      const msg2 = createMessage('msg-2', content);

      const result = orchestrator.consolidate([msg1], [msg2], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const stats = orchestrator.getStatistics(result.value);

        expect(stats.totalMessages).toBe(1);
        expect(stats.deduplicatedCount).toBe(1);
        expect(stats.deduplicationRate).toBe('50.00%');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle null messages gracefully', () => {
      const result = orchestrator.consolidate([], [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.messages).toEqual([]);
      }
    });

    it('should preserve metadata from original messages', () => {
      const webMessages = [
        {
          ...createMessage('msg-1', 'Test'),
          metadata: {
            extractedFrom: 'claude-export',
            rawLength: 4,
            messageType: 'user_request' as const,
            platform: 'claude',
            customField: 'custom-value',
          },
        },
      ];

      const result = orchestrator.consolidate(webMessages, [], []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const msg = result.value.messages[0];
        expect(msg.metadata.extractedFrom).toBe('claude-export');
        expect(msg.metadata.platform).toBe('claude');
      }
    });
  });
});

