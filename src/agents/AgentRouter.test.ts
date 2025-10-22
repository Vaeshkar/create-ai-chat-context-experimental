import { describe, it, expect, beforeEach } from 'vitest';
import { AgentRouter } from './AgentRouter';

describe('AgentRouter', () => {
  let router: AgentRouter;

  beforeEach(() => {
    router = new AgentRouter();
  });

  describe('routeContent', () => {
    it('should route decision content to decisions.aicf', () => {
      const result = router.routeContent('decision', 'We decided to use TypeScript', 'chunk-1');

      expect(result).not.toBeNull();
      expect(result?.targetFile).toBe('.aicf/decisions.aicf');
      expect(result?.contentType).toBe('decision');
    });

    it('should route technical content to technical-context.aicf', () => {
      const result = router.routeContent('technical_insight', 'Architecture change', 'chunk-2');

      expect(result).not.toBeNull();
      expect(result?.targetFile).toBe('.aicf/technical-context.aicf');
    });

    it('should route task content to work-state.aicf', () => {
      const result = router.routeContent('task_progress', 'Working on feature', 'chunk-3');

      expect(result).not.toBeNull();
      expect(result?.targetFile).toBe('.aicf/work-state.aicf');
    });

    it('should route issue content to issues.aicf', () => {
      const result = router.routeContent('issue_discovered', 'Found a bug', 'chunk-4');

      expect(result).not.toBeNull();
      expect(result?.targetFile).toBe('.aicf/issues.aicf');
    });

    it('should route design content to design-system.aicf', () => {
      const result = router.routeContent('design_decision', 'UI pattern', 'chunk-5');

      expect(result).not.toBeNull();
      expect(result?.targetFile).toBe('.aicf/design-system.aicf');
    });

    it('should default to conversation-memory.aicf for unknown types', () => {
      const result = router.routeContent('unknown_type', 'Some content', 'chunk-6');

      expect(result).not.toBeNull();
      expect(result?.targetFile).toBe('.aicf/conversation-memory.aicf');
    });

    it('should include timestamp in routed content', () => {
      const result = router.routeContent('decision', 'Content', 'chunk-7');

      expect(result?.timestamp).toBeDefined();
      expect(new Date(result!.timestamp)).toBeInstanceOf(Date);
    });

    it('should prevent duplicate content', () => {
      const result1 = router.routeContent('decision', 'Same content', 'chunk-8');
      const result2 = router.routeContent('decision', 'Same content', 'chunk-8');

      expect(result1).not.toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('classifyContent', () => {
    it('should classify decision content', () => {
      const classifications = router.classifyContent({ text: 'We decided to use React' });

      expect(classifications).toContain('decision');
    });

    it('should classify technical content', () => {
      const classifications = router.classifyContent({ text: 'Architecture change needed' });

      expect(classifications).toContain('technical_insight');
    });

    it('should classify task content', () => {
      const classifications = router.classifyContent({ text: 'Working on the task' });

      expect(classifications).toContain('task_progress');
    });

    it('should classify issue content', () => {
      const classifications = router.classifyContent({ text: 'Found a bug in the code' });

      expect(classifications).toContain('issue_discovered');
    });

    it('should classify design content', () => {
      const classifications = router.classifyContent({ text: 'UI design pattern' });

      expect(classifications).toContain('design_decision');
    });

    it('should default to conversation_flow for unclassified content', () => {
      const classifications = router.classifyContent({ text: 'Random text' });

      expect(classifications).toContain('conversation_flow');
    });

    it('should allow multiple classifications', () => {
      const classifications = router.classifyContent({
        text: 'We decided on the architecture for the system',
      });

      expect(classifications.length).toBeGreaterThan(1);
      expect(classifications).toContain('decision');
      expect(classifications).toContain('technical_insight');
    });
  });

  describe('getTokenAllocationStrategy', () => {
    it('should return token allocation strategy', () => {
      const strategy = router.getTokenAllocationStrategy();

      expect(strategy).toBeDefined();
      expect(strategy['conversation-memory.aicf']).toBe(2000);
      expect(strategy['technical-context.aicf']).toBe(3000);
    });

    it('should have all expected files in strategy', () => {
      const strategy = router.getTokenAllocationStrategy();

      expect(strategy['decisions.aicf']).toBe(1500);
      expect(strategy['work-state.aicf']).toBe(1000);
      expect(strategy['tasks.aicf']).toBe(1500);
      expect(strategy['issues.aicf']).toBe(1000);
      expect(strategy['design-system.aicf']).toBe(1500);
    });
  });

  describe('resetChunkTracker', () => {
    it('should reset chunk tracker', () => {
      // Add a chunk
      router.routeContent('decision', 'Content', 'chunk-9');

      // Try to add same chunk - should be skipped
      let result = router.routeContent('decision', 'Content', 'chunk-9');
      expect(result).toBeNull();

      // Reset tracker
      router.resetChunkTracker();

      // Now same chunk should be allowed
      result = router.routeContent('decision', 'Content', 'chunk-9');
      expect(result).not.toBeNull();
    });
  });
});
