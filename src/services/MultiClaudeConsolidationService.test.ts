/**
 * Multi-Claude Consolidation Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MultiClaudeConsolidationService } from './MultiClaudeConsolidationService.js';
import type { Message } from '../types/conversation.js';

describe('MultiClaudeConsolidationService', () => {
  let service: MultiClaudeConsolidationService;

  beforeEach(() => {
    service = new MultiClaudeConsolidationService({
      verbose: false,
      enableCli: true,
      enableDesktop: true,
    });
  });

  it('should create service instance', () => {
    expect(service).toBeDefined();
  });

  it('should check if any Claude instance is available', () => {
    const available = service.isAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should get available sources', () => {
    const sources = service.getAvailableSources();
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.every((s) => ['claude-cli', 'claude-desktop'].includes(s))).toBe(true);
  });

  it('should consolidate empty messages', async () => {
    const result = await service.consolidate([]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.value)).toBe(true);
    }
  });

  it('should consolidate web messages', async () => {
    const webMessages: Message[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        timestamp: '2025-10-22T10:00:00Z',
        role: 'user',
        content: 'Hello',
        metadata: {
          extractedFrom: 'test',
          rawLength: 5,
          messageType: 'user_request',
        },
      },
    ];

    const result = await service.consolidate(webMessages);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should get messages by source', async () => {
    const webMessages: Message[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        timestamp: '2025-10-22T10:00:00Z',
        role: 'user',
        content: 'Hello',
        metadata: {
          extractedFrom: 'test',
          rawLength: 5,
          messageType: 'user_request',
          source: 'claude-web',
        },
      },
    ];

    const result = await service.consolidate(webMessages);
    if (result.ok) {
      const webOnly = service.getMessagesBySource(result.value, 'claude-web');
      expect(Array.isArray(webOnly)).toBe(true);
    }
  });

  it('should get messages by conversation', async () => {
    const webMessages: Message[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        timestamp: '2025-10-22T10:00:00Z',
        role: 'user',
        content: 'Hello',
        metadata: {
          extractedFrom: 'test',
          rawLength: 5,
          messageType: 'user_request',
        },
      },
    ];

    const result = await service.consolidate(webMessages);
    if (result.ok) {
      const conv1Messages = service.getMessagesByConversation(result.value, 'conv-1');
      expect(Array.isArray(conv1Messages)).toBe(true);
    }
  });

  it('should get unique conversations', async () => {
    const webMessages: Message[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        timestamp: '2025-10-22T10:00:00Z',
        role: 'user',
        content: 'Hello',
        metadata: {
          extractedFrom: 'test',
          rawLength: 5,
          messageType: 'user_request',
        },
      },
      {
        id: 'msg-2',
        conversationId: 'conv-2',
        timestamp: '2025-10-22T10:00:01Z',
        role: 'assistant',
        content: 'Hi',
        metadata: {
          extractedFrom: 'test',
          rawLength: 2,
          messageType: 'ai_response',
        },
      },
    ];

    const result = await service.consolidate(webMessages);
    if (result.ok) {
      const conversations = service.getConversations(result.value);
      expect(conversations.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should get consolidation summary', async () => {
    const webMessages: Message[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        timestamp: '2025-10-22T10:00:00Z',
        role: 'user',
        content: 'Hello',
        metadata: {
          extractedFrom: 'test',
          rawLength: 5,
          messageType: 'user_request',
        },
      },
    ];

    const result = await service.consolidate(webMessages);
    if (result.ok) {
      const summary = service.getSummary();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('Multi-Claude Consolidation Summary');
    }
  });

  it('should get last stats after consolidation', async () => {
    const webMessages: Message[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        timestamp: '2025-10-22T10:00:00Z',
        role: 'user',
        content: 'Hello',
        metadata: {
          extractedFrom: 'test',
          rawLength: 5,
          messageType: 'user_request',
        },
      },
    ];

    const result = await service.consolidate(webMessages);
    if (result.ok) {
      const stats = service.getLastStats();
      expect(stats).toBeDefined();
      if (stats) {
        expect(stats.totalMessages).toBeGreaterThanOrEqual(1);
        expect(stats.sourceBreakdown).toBeDefined();
        expect(stats.timestamp).toBeDefined();
      }
    }
  });

  it('should return null stats before consolidation', () => {
    const newService = new MultiClaudeConsolidationService();
    const stats = newService.getLastStats();
    expect(stats).toBeNull();
  });

  it('should handle consolidation with verbose mode', async () => {
    const verboseService = new MultiClaudeConsolidationService({
      verbose: true,
      enableCli: true,
      enableDesktop: true,
    });

    const result = await verboseService.consolidate([]);
    expect(result.ok).toBe(true);
  });

  it('should handle disabled sources', async () => {
    const disabledService = new MultiClaudeConsolidationService({
      verbose: false,
      enableCli: false,
      enableDesktop: false,
    });

    const available = disabledService.isAvailable();
    expect(available).toBe(false);
  });
});
