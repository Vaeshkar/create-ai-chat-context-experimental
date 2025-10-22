import { describe, it, expect } from 'vitest';
import { AgentUtils } from './AgentUtils';

describe('AgentUtils', () => {
  describe('matchesPattern', () => {
    it('should match decision patterns', () => {
      expect(AgentUtils.matchesPattern('we decided to use TypeScript', 'decisions')).toBe(true);
      expect(AgentUtils.matchesPattern('I chose React', 'decisions')).toBe(true);
      expect(AgentUtils.matchesPattern('random text', 'decisions')).toBe(false);
    });

    it('should match insight patterns', () => {
      expect(AgentUtils.matchesPattern('I realized the issue', 'insights')).toBe(true);
      expect(AgentUtils.matchesPattern('key insight here', 'insights')).toBe(true);
      expect(AgentUtils.matchesPattern('random text', 'insights')).toBe(false);
    });

    it('should match action patterns', () => {
      expect(AgentUtils.matchesPattern('we implemented the feature', 'actions')).toBe(true);
      expect(AgentUtils.matchesPattern('I built a new component', 'actions')).toBe(true);
      expect(AgentUtils.matchesPattern('random text', 'actions')).toBe(false);
    });

    it('should match blocker patterns', () => {
      expect(AgentUtils.matchesPattern('blocked by missing dependency', 'blockers')).toBe(true);
      expect(AgentUtils.matchesPattern('stuck on this issue', 'blockers')).toBe(true);
      expect(AgentUtils.matchesPattern('random text', 'blockers')).toBe(false);
    });
  });

  describe('extractMatches', () => {
    it('should extract matches with context', () => {
      const text = 'We decided to use TypeScript for the project';
      const matches = AgentUtils.extractMatches(text, 'decisions');

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].context).toContain('decided');
    });

    it('should return empty array for no matches', () => {
      const text = 'This is random text with no patterns';
      const matches = AgentUtils.extractMatches(text, 'decisions');

      expect(matches).toEqual([]);
    });
  });

  describe('cleanText', () => {
    it('should normalize whitespace', () => {
      expect(AgentUtils.cleanText('hello   world')).toBe('hello world');
    });

    it('should remove special characters', () => {
      expect(AgentUtils.cleanText('hello@world#test')).toContain('hello');
      expect(AgentUtils.cleanText('hello@world#test')).toContain('world');
    });

    it('should handle empty strings', () => {
      expect(AgentUtils.cleanText('')).toBe('');
      expect(AgentUtils.cleanText(null as any)).toBe('');
    });
  });

  describe('extractAction', () => {
    it('should extract action from text', () => {
      const action = AgentUtils.extractAction('we implemented the new feature');
      expect(action).toContain('implement');
    });

    it('should normalize action text', () => {
      const action = AgentUtils.extractAction('I built a new component');
      expect(action).toBeTruthy();
      expect(action).not.toContain(' ');
    });

    it('should handle empty text', () => {
      expect(AgentUtils.extractAction('')).toBe('');
    });
  });

  describe('normalizeAction', () => {
    it('should convert to lowercase', () => {
      expect(AgentUtils.normalizeAction('HELLO WORLD')).toBe('hello_world');
    });

    it('should replace spaces with underscores', () => {
      expect(AgentUtils.normalizeAction('hello world test')).toBe('hello_world_test');
    });

    it('should remove special characters', () => {
      const result = AgentUtils.normalizeAction('hello@world#test');
      expect(result).toContain('hello');
      expect(result).toContain('world');
    });

    it('should limit length to 50 characters', () => {
      const longText = 'a'.repeat(100);
      expect(AgentUtils.normalizeAction(longText).length).toBeLessThanOrEqual(50);
    });
  });

  describe('assessImpact', () => {
    it('should identify critical impact', () => {
      expect(AgentUtils.assessImpact('architecture redesign')).toBe('CRITICAL');
      expect(AgentUtils.assessImpact('database migration')).toBe('CRITICAL');
      expect(AgentUtils.assessImpact('security update')).toBe('CRITICAL');
    });

    it('should identify high impact', () => {
      expect(AgentUtils.assessImpact('refactor the code')).toBe('HIGH');
      expect(AgentUtils.assessImpact('integration testing')).toBe('HIGH');
    });

    it('should identify medium impact', () => {
      expect(AgentUtils.assessImpact('fix the bug')).toBe('MEDIUM');
      expect(AgentUtils.assessImpact('update the docs')).toBe('MEDIUM');
    });

    it('should identify low impact', () => {
      expect(AgentUtils.assessImpact('random text')).toBe('LOW');
    });
  });

  describe('extractEntities', () => {
    it('should extract capitalized words', () => {
      const entities = AgentUtils.extractEntities('We used React and TypeScript');
      expect(entities).toContain('React');
      expect(entities).toContain('TypeScript');
    });

    it('should remove duplicates', () => {
      const entities = AgentUtils.extractEntities('React React TypeScript');
      expect(entities.filter((e) => e === 'React').length).toBe(1);
    });

    it('should handle empty text', () => {
      expect(AgentUtils.extractEntities('')).toEqual([]);
    });
  });

  describe('calculateRelevance', () => {
    it('should calculate relevance score', () => {
      const score = AgentUtils.calculateRelevance('TypeScript React Node', ['TypeScript', 'React']);
      expect(score).toBe(100);
    });

    it('should return 0 for no matches', () => {
      const score = AgentUtils.calculateRelevance('Python Django', ['TypeScript', 'React']);
      expect(score).toBe(0);
    });

    it('should handle partial matches', () => {
      const score = AgentUtils.calculateRelevance('TypeScript Node', ['TypeScript', 'React']);
      expect(score).toBe(50);
    });
  });

  describe('formatSection', () => {
    it('should format string content', () => {
      const result = AgentUtils.formatSection('Title', 'content');
      expect(result).toContain('## Title');
      expect(result).toContain('content');
    });

    it('should format array content', () => {
      const result = AgentUtils.formatSection('Items', ['item1', 'item2']);
      expect(result).toContain('- item1');
      expect(result).toContain('- item2');
    });

    it('should format object content', () => {
      const result = AgentUtils.formatSection('Props', { key: 'value' });
      expect(result).toContain('key=value');
    });
  });
});
