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

  describe('generateAICF', () => {
    it('should generate valid AICF format', () => {
      const analysis = createTestAnalysis();
      const aicf = writer.generateAICF(analysis, 'conv-123');

      expect(aicf).toContain('version|3.0.0-alpha');
      expect(aicf).toContain('conversationId|conv-123');
      expect(aicf).toContain('timestamp|');
    });

    it('should include user intents in AICF', () => {
      const analysis = createTestAnalysis();
      const aicf = writer.generateAICF(analysis, 'conv-123');

      expect(aicf).toContain('userIntents|');
      expect(aicf).toContain('Implement authentication system');
    });

    it('should include AI actions in AICF', () => {
      const analysis = createTestAnalysis();
      const aicf = writer.generateAICF(analysis, 'conv-123');

      expect(aicf).toContain('aiActions|');
      expect(aicf).toContain('Provided comprehensive authentication guide');
    });

    it('should include technical work in AICF', () => {
      const analysis = createTestAnalysis();
      const aicf = writer.generateAICF(analysis, 'conv-123');

      expect(aicf).toContain('technicalWork|');
      expect(aicf).toContain('Implement JWT authentication with TypeScript');
    });

    it('should include decisions in AICF', () => {
      const analysis = createTestAnalysis();
      const aicf = writer.generateAICF(analysis, 'conv-123');

      expect(aicf).toContain('decisions|');
      expect(aicf).toContain('Use JWT for authentication');
    });

    it('should include flow in AICF', () => {
      const analysis = createTestAnalysis();
      const aicf = writer.generateAICF(analysis, 'conv-123');

      expect(aicf).toContain('flow|');
      expect(aicf).toContain('balanced');
    });

    it('should include working state in AICF', () => {
      const analysis = createTestAnalysis();
      const aicf = writer.generateAICF(analysis, 'conv-123');

      expect(aicf).toContain('workingState|');
      expect(aicf).toContain('Implementing authentication');
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

      const aicf = writer.generateAICF(analysis, 'conv-123');
      expect(aicf).toContain('version|3.0.0-alpha');
      expect(aicf).toContain('conversationId|conv-123');
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
