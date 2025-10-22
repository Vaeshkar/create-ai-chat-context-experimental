/**
 * Claude CLI Parser Tests
 * Phase 5.5a: October 2025
 */

import { describe, it, expect } from 'vitest';
import { ClaudeCliParser } from './ClaudeCliParser.js';

describe('ClaudeCliParser', () => {
  const parser = new ClaudeCliParser();
  const sessionId = 'afd5bf86-45b7-4554-bdc5-176d1161e230';

  describe('Valid JSONL parsing', () => {
    it('should parse valid JSONL with user and assistant messages', () => {
      const jsonl = `{"type":"message","role":"user","content":"Hello Claude","timestamp":"2025-10-22T10:00:00Z","uuid":"msg-1"}
{"type":"message","role":"assistant","content":"Hi there!","timestamp":"2025-10-22T10:00:05Z","uuid":"msg-2"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].role).toBe('user');
        expect(result.value[0].content).toBe('Hello Claude');
        expect(result.value[1].role).toBe('assistant');
        expect(result.value[1].content).toBe('Hi there!');
      }
    });

    it('should skip non-message types', () => {
      const jsonl = `{"type":"event","name":"session_start"}
{"type":"message","role":"user","content":"Test","timestamp":"2025-10-22T10:00:00Z"}
{"type":"metadata","key":"value"}
{"type":"message","role":"assistant","content":"Response","timestamp":"2025-10-22T10:00:05Z"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].content).toBe('Test');
        expect(result.value[1].content).toBe('Response');
      }
    });

    it('should preserve token usage metadata', () => {
      const jsonl = `{"type":"message","role":"assistant","content":"Response","timestamp":"2025-10-22T10:00:00Z","tokenUsage":{"input":100,"output":50}}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata?.tokenUsage).toEqual({ input: 100, output: 50 });
      }
    });

    it('should preserve thinking blocks', () => {
      const jsonl = `{"type":"message","role":"assistant","content":"Final answer","timestamp":"2025-10-22T10:00:00Z","thinking":"Let me think about this..."}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata?.thinking).toBe('Let me think about this...');
      }
    });

    it('should preserve git branch and working directory', () => {
      const jsonl = `{"type":"message","role":"user","content":"Test","timestamp":"2025-10-22T10:00:00Z","metadata":{"gitBranch":"main","workingDirectory":"/Users/leeuwen/Programming/project"}}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata?.gitBranch).toBe('main');
        expect(result.value[0].metadata?.workingDirectory).toBe(
          '/Users/leeuwen/Programming/project'
        );
      }
    });

    it('should handle empty lines', () => {
      const jsonl = `{"type":"message","role":"user","content":"First","timestamp":"2025-10-22T10:00:00Z"}

{"type":"message","role":"assistant","content":"Second","timestamp":"2025-10-22T10:00:05Z"}

`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('should handle structured content objects', () => {
      const jsonl = `{"type":"message","role":"assistant","content":{"text":"Structured response"},"timestamp":"2025-10-22T10:00:00Z"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].content).toBe('Structured response');
      }
    });

    it('should set correct platform metadata', () => {
      const jsonl = `{"type":"message","role":"user","content":"Test","timestamp":"2025-10-22T10:00:00Z"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata?.extractedFrom).toBe('claude-cli-jsonl');
        expect(result.value[0].metadata?.platform).toBe('claude-cli');
        expect(result.value[0].metadata?.messageType).toBe('user_request');
      }
    });
  });

  describe('Error handling', () => {
    it('should reject null input', () => {
      const result = parser.parse(null as unknown as string, sessionId);
      expect(result.ok).toBe(false);
    });

    it('should reject non-string input', () => {
      const result = parser.parse({} as unknown as string, sessionId);
      expect(result.ok).toBe(false);
    });

    it('should handle malformed JSON lines gracefully', () => {
      const jsonl = `{"type":"message","role":"user","content":"Valid"}
{invalid json here}
{"type":"message","role":"assistant","content":"Also valid"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should skip malformed line and return valid messages
        expect(result.value).toHaveLength(2);
      }
    });

    it('should skip messages without role', () => {
      const jsonl = `{"type":"message","content":"No role"}
{"type":"message","role":"user","content":"Has role"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].content).toBe('Has role');
      }
    });

    it('should skip messages without content', () => {
      const jsonl = `{"type":"message","role":"user"}
{"type":"message","role":"assistant","content":"Has content"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].content).toBe('Has content');
      }
    });

    it('should skip empty content', () => {
      const jsonl = `{"type":"message","role":"user","content":""}
{"type":"message","role":"assistant","content":"Valid"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });
  });

  describe('Message ID generation', () => {
    it('should use uuid if provided', () => {
      const jsonl = `{"type":"message","role":"user","content":"Test","uuid":"custom-uuid-123"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].id).toBe('custom-uuid-123');
      }
    });

    it('should generate ID if uuid not provided', () => {
      const jsonl = `{"type":"message","role":"user","content":"Test"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].id).toMatch(/claude-cli-/);
      }
    });
  });

  describe('Timestamp handling', () => {
    it('should use provided timestamp', () => {
      const timestamp = '2025-10-22T10:00:00Z';
      const jsonl = `{"type":"message","role":"user","content":"Test","timestamp":"${timestamp}"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].timestamp).toBe(timestamp);
      }
    });

    it('should generate timestamp if not provided', () => {
      const jsonl = `{"type":"message","role":"user","content":"Test"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should be a valid ISO timestamp
        expect(result.value[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });

  describe('Conversation grouping', () => {
    it('should group all messages under same conversation ID', () => {
      const jsonl = `{"type":"message","role":"user","content":"First"}
{"type":"message","role":"assistant","content":"Second"}
{"type":"message","role":"user","content":"Third"}`;

      const result = parser.parse(jsonl, sessionId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.every((msg) => msg.conversationId === sessionId)).toBe(true);
      }
    });
  });
});
