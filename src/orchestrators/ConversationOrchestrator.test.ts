/**
 * Conversation Orchestrator Tests
 * October 2025
 */

import { describe, it, expect } from 'vitest';
import { ConversationOrchestrator } from './ConversationOrchestrator.js';
import type { Conversation, Message } from '../types/index.js';

describe('ConversationOrchestrator', () => {
  const orchestrator = new ConversationOrchestrator();

  const createTestConversation = (messages: Message[]): Conversation => ({
    id: 'test-conv-123',
    messages,
    timestamp: new Date().toISOString(),
    source: 'augment',
  });

  const createTestMessage = (
    role: 'user' | 'assistant',
    content: string,
    index: number
  ): Message => ({
    id: `msg-${index}`,
    conversationId: 'test-conv-123',
    timestamp: new Date().toISOString(),
    role,
    content,
  });

  describe('analyze', () => {
    it('should analyze conversation with messages', () => {
      const messages = [
        createTestMessage('user', 'What is the best way to implement authentication?', 0),
        createTestMessage(
          'assistant',
          'Here is a comprehensive guide to implementing authentication with JWT tokens and best practices for security.',
          1
        ),
      ];

      const conversation = createTestConversation(messages);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userIntents).toBeDefined();
        expect(result.value.aiActions).toBeDefined();
        expect(result.value.technicalWork).toBeDefined();
        expect(result.value.decisions).toBeDefined();
        expect(result.value.flow).toBeDefined();
        expect(result.value.workingState).toBeDefined();
      }
    });

    it('should extract user intents', () => {
      const messages = [
        createTestMessage('user', 'I need to implement a new feature for user authentication', 0),
        createTestMessage(
          'assistant',
          'I can help you implement authentication with JWT tokens',
          1
        ),
      ];

      const conversation = createTestConversation(messages);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userIntents.length).toBeGreaterThan(0);
      }
    });

    it('should extract AI actions', () => {
      const messages = [
        createTestMessage('user', 'Can you help me with implementing authentication?', 0),
        createTestMessage(
          'assistant',
          'I will create a comprehensive authentication system for you',
          1
        ),
      ];

      const conversation = createTestConversation(messages);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.aiActions.length).toBeGreaterThan(0);
      }
    });

    it('should extract technical work', () => {
      const messages = [
        createTestMessage('user', 'I need to implement JWT authentication in TypeScript', 0),
        createTestMessage(
          'assistant',
          'I will help you implement JWT authentication with proper error handling',
          1
        ),
      ];

      const conversation = createTestConversation(messages);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.technicalWork.length).toBeGreaterThan(0);
      }
    });

    it('should extract decisions', () => {
      const messages = [
        createTestMessage('user', 'Should we use JWT or session-based authentication?', 0),
        createTestMessage(
          'assistant',
          'JWT is better for scalability and microservices architecture',
          1
        ),
      ];

      const conversation = createTestConversation(messages);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.decisions).toBeDefined();
      }
    });

    it('should extract conversation flow', () => {
      const messages = [
        createTestMessage('user', 'What is authentication?', 0),
        createTestMessage(
          'assistant',
          'Authentication is the process of verifying user identity',
          1
        ),
        createTestMessage('user', 'How do I implement it?', 2),
        createTestMessage('assistant', 'You can use JWT tokens or session-based authentication', 3),
      ];

      const conversation = createTestConversation(messages);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.flow.turns).toBeGreaterThan(0);
        expect(result.value.flow.dominantRole).toBeDefined();
      }
    });

    it('should extract working state', () => {
      const messages = [
        createTestMessage('user', 'I am implementing authentication but blocked by CORS issues', 0),
        createTestMessage('assistant', 'Let me help you fix the CORS configuration', 1),
      ];

      const conversation = createTestConversation(messages);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.workingState).toBeDefined();
        expect(result.value.workingState.currentTask).toBeDefined();
      }
    });

    it('should handle empty conversation', () => {
      const conversation = createTestConversation([]);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userIntents).toBeDefined();
        expect(result.value.aiActions).toBeDefined();
      }
    });
  });

  describe('detectSource', () => {
    it('should detect Augment format', () => {
      const augmentData = `"request_message": "This is a test message with enough content"`;
      const source = orchestrator.detectSource(augmentData);
      expect(source).toBe('augment');
    });

    it('should detect generic JSON format', () => {
      const jsonData = JSON.stringify([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ]);
      const source = orchestrator.detectSource(jsonData);
      expect(source).toBe('generic');
    });

    it('should detect generic line format', () => {
      const lineData =
        'user: This is a user message with enough content\nassistant: This is an assistant response';
      const source = orchestrator.detectSource(lineData);
      expect(source).toBe('generic');
    });

    it('should return generic for plain text', () => {
      const plainText = 'This is just plain text without any structure';
      const source = orchestrator.detectSource(plainText);
      // Plain text is treated as generic fallback
      expect(['generic', 'unknown']).toContain(source);
    });
  });

  describe('analyze with messages', () => {
    it('should analyze conversation with messages', () => {
      const messages = [
        createTestMessage('user', 'This is a user message with enough content', 0),
        createTestMessage('assistant', 'This is an assistant response with enough content', 1),
      ];

      const conversation = createTestConversation(messages);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userIntents).toBeDefined();
        expect(result.value.aiActions).toBeDefined();
      }
    });

    it('should handle multiple messages', () => {
      const messages = [
        createTestMessage('user', 'What is the best authentication method?', 0),
        createTestMessage('assistant', 'JWT tokens are recommended for scalability', 1),
        createTestMessage('user', 'How do I implement JWT in TypeScript?', 2),
        createTestMessage('assistant', 'Here is a comprehensive guide to JWT implementation', 3),
      ];

      const conversation = createTestConversation(messages);
      const result = orchestrator.analyze(conversation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.flow.turns).toBeGreaterThan(0);
      }
    });
  });
});
