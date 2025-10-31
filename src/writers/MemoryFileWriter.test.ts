/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Memory File Writer Tests
 * October 2025
 */

import { describe, it, expect } from 'vitest';
import { MemoryFileWriter } from './MemoryFileWriter.js';
import type { AnalysisResult } from '../types/index.js';

describe('MemoryFileWriter', () => {
  const writer = new MemoryFileWriter();

  const createTestAnalysis = (): AnalysisResult => ({
    userIntents: [
      {
        timestamp: '2025-10-21T10:00:00Z',
        intent: 'Implement authentication system',
        inferredFrom: 'conversation_summary',
        confidence: 'high',
        messageIndex: 0,
      },
    ],
    aiActions: [
      {
        type: 'augment_ai_response',
        timestamp: '2025-10-21T10:00:01Z',
        details: 'Provided comprehensive authentication guide',
        source: 'conversation_summary',
      },
    ],
    technicalWork: [
      {
        timestamp: '2025-10-21T10:00:02Z',
        work: 'Implement JWT authentication with TypeScript',
        type: 'technical_conversation',
        source: 'conversation_summary',
      },
    ],
    decisions: [
      {
        timestamp: '2025-10-21T10:00:03Z',
        decision: 'Use JWT for authentication',
        context: 'Scalability and microservices architecture',
        impact: 'high',
      },
    ],
    flow: {
      sequence: ['user', 'assistant', 'user', 'assistant'],
      turns: 2,
      dominantRole: 'balanced',
    },
    workingState: {
      currentTask: 'Implementing authentication',
      blockers: ['CORS configuration', 'Database setup'],
      nextAction: 'Set up JWT middleware',
      lastUpdate: '2025-10-21T10:00:04Z',
    },
  });

  describe('generateAICF (deprecated)', () => {
    it('should return legacy format message', () => {
      const analysis = createTestAnalysis();
      const aicf = writer.generateAICF(analysis, 'conv-123');

      // generateAICF is deprecated, returns a simple message
      expect(aicf).toContain('AICF v3.1 Format');
      expect(aicf).toContain('conv-123');
    });
  });

  describe('writeAICF (v3.1 format)', () => {
    it('should write AICF v3.1 format to files', async () => {
      const analysis = createTestAnalysis();
      const result = await writer.writeAICF('conv-123', analysis);

      expect(result.ok).toBe(true);
    });

    it('should handle empty analysis', async () => {
      const analysis: AnalysisResult = {
        userIntents: [],
        aiActions: [],
        technicalWork: [],
        decisions: [],
        flow: { sequence: [], turns: 0, dominantRole: 'balanced' },
        workingState: {
          currentTask: '',
          blockers: [],
          nextAction: '',
          lastUpdate: new Date().toISOString(),
        },
      };

      const result = await writer.writeAICF('conv-123', analysis);
      expect(result.ok).toBe(true);
    });
  });

  describe('generateMarkdown', () => {
    it('should generate valid markdown format', () => {
      const analysis = createTestAnalysis();
      const markdown = writer.generateMarkdown(analysis, 'conv-123');

      expect(markdown).toContain('# Conversation Analysis');
      expect(markdown).toContain('**Conversation ID:** conv-123');
      expect(markdown).toContain('**Generated:**');
    });

    it('should include user intents section', () => {
      const analysis = createTestAnalysis();
      const markdown = writer.generateMarkdown(analysis, 'conv-123');

      expect(markdown).toContain('## User Intents');
      expect(markdown).toContain('Implement authentication system');
      expect(markdown).toContain('high');
    });

    it('should include AI actions section', () => {
      const analysis = createTestAnalysis();
      const markdown = writer.generateMarkdown(analysis, 'conv-123');

      expect(markdown).toContain('## AI Actions');
      expect(markdown).toContain('Provided comprehensive authentication guide');
    });

    it('should include technical work section', () => {
      const analysis = createTestAnalysis();
      const markdown = writer.generateMarkdown(analysis, 'conv-123');

      expect(markdown).toContain('## Technical Work');
      expect(markdown).toContain('Implement JWT authentication with TypeScript');
    });

    it('should include decisions section', () => {
      const analysis = createTestAnalysis();
      const markdown = writer.generateMarkdown(analysis, 'conv-123');

      expect(markdown).toContain('## Decisions');
      expect(markdown).toContain('Use JWT for authentication');
      expect(markdown).toContain('high impact');
    });

    it('should include flow section', () => {
      const analysis = createTestAnalysis();
      const markdown = writer.generateMarkdown(analysis, 'conv-123');

      expect(markdown).toContain('## Conversation Flow');
      expect(markdown).toContain('**Turns:** 2');
      expect(markdown).toContain('balanced');
    });

    it('should include working state section', () => {
      const analysis = createTestAnalysis();
      const markdown = writer.generateMarkdown(analysis, 'conv-123');

      expect(markdown).toContain('## Working State');
      expect(markdown).toContain('Implementing authentication');
      expect(markdown).toContain('CORS configuration');
      expect(markdown).toContain('Set up JWT middleware');
    });

    it('should handle empty analysis', () => {
      const analysis: AnalysisResult = {
        userIntents: [],
        aiActions: [],
        technicalWork: [],
        decisions: [],
        flow: { sequence: [], turns: 0, dominantRole: 'balanced' },
        workingState: {
          currentTask: '',
          blockers: [],
          nextAction: '',
          lastUpdate: new Date().toISOString(),
        },
      };

      const markdown = writer.generateMarkdown(analysis, 'conv-123');
      expect(markdown).toContain('# Conversation Analysis');
      expect(markdown).toContain('No intents extracted');
      expect(markdown).toContain('No actions extracted');
    });

    it('should format blockers correctly', () => {
      const analysis = createTestAnalysis();
      const markdown = writer.generateMarkdown(analysis, 'conv-123');

      expect(markdown).toContain('CORS configuration, Database setup');
    });
  });
});
