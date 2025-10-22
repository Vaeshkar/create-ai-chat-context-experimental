/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect } from 'vitest';
import { TEMPLATES, getTemplate, listTemplates, getTemplateDir, templateExists } from './Templates';

describe('Templates', () => {
  describe('TEMPLATES', () => {
    it('should have default template', () => {
      expect(TEMPLATES.default).toBeDefined();
      expect(TEMPLATES.default.name).toBe('Generic/Universal');
    });

    it('should have multiple templates', () => {
      expect(Object.keys(TEMPLATES).length).toBeGreaterThan(20);
    });

    it('should have required properties for each template', () => {
      Object.entries(TEMPLATES).forEach(([key, template]) => {
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.dir).toBeDefined();
        expect(typeof template.name).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(typeof template.dir).toBe('string');
      });
    });
  });

  describe('getTemplate', () => {
    it('should return template by name', () => {
      const template = getTemplate('default');
      expect(template.name).toBe('Generic/Universal');
      expect(template.dir).toBe('ai');
    });

    it('should return different templates', () => {
      const defaultTemplate = getTemplate('default');
      const reactTemplate = getTemplate('react');

      expect(defaultTemplate.name).not.toBe(reactTemplate.name);
      expect(defaultTemplate.dir).not.toBe(reactTemplate.dir);
    });

    it('should throw error for unknown template', () => {
      expect(() => getTemplate('unknown-template')).toThrow('Unknown template');
    });

    it('should throw error with available templates list', () => {
      try {
        getTemplate('nonexistent');
      } catch (error) {
        expect((error as Error).message).toContain('Available:');
      }
    });
  });

  describe('listTemplates', () => {
    it('should return array of templates', () => {
      const templates = listTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should include key in each template entry', () => {
      const templates = listTemplates();
      templates.forEach((template) => {
        expect(template.key).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.dir).toBeDefined();
      });
    });

    it('should have same count as TEMPLATES', () => {
      const templates = listTemplates();
      expect(templates.length).toBe(Object.keys(TEMPLATES).length);
    });

    it('should include default template', () => {
      const templates = listTemplates();
      const defaultTemplate = templates.find((t) => t.key === 'default');
      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate?.name).toBe('Generic/Universal');
    });
  });

  describe('getTemplateDir', () => {
    it('should return path for template', () => {
      const dir = getTemplateDir('default');
      expect(dir).toContain('templates');
      expect(dir).toContain('ai');
    });

    it('should return different paths for different templates', () => {
      const defaultDir = getTemplateDir('default');
      const reactDir = getTemplateDir('react');

      expect(defaultDir).not.toBe(reactDir);
      expect(defaultDir).toContain('ai');
      expect(reactDir).toContain('react');
    });

    it('should throw error for unknown template', () => {
      expect(() => getTemplateDir('unknown')).toThrow('Unknown template');
    });
  });

  describe('templateExists', () => {
    it('should return true for existing templates', () => {
      expect(templateExists('default')).toBe(true);
      expect(templateExists('react')).toBe(true);
      expect(templateExists('nextjs')).toBe(true);
    });

    it('should return false for non-existing templates', () => {
      expect(templateExists('unknown')).toBe(false);
      expect(templateExists('nonexistent')).toBe(false);
      expect(templateExists('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(templateExists('default')).toBe(true);
      expect(templateExists('Default')).toBe(false);
      expect(templateExists('DEFAULT')).toBe(false);
    });
  });

  describe('Template categories', () => {
    it('should have JavaScript/TypeScript templates', () => {
      expect(templateExists('nextjs')).toBe(true);
      expect(templateExists('react')).toBe(true);
      expect(templateExists('vue')).toBe(true);
      expect(templateExists('angular')).toBe(true);
      expect(templateExists('node')).toBe(true);
    });

    it('should have Python templates', () => {
      expect(templateExists('python')).toBe(true);
      expect(templateExists('django')).toBe(true);
      expect(templateExists('fastapi')).toBe(true);
      expect(templateExists('flask')).toBe(true);
    });

    it('should have systems programming templates', () => {
      expect(templateExists('rust')).toBe(true);
      expect(templateExists('go')).toBe(true);
      expect(templateExists('cpp')).toBe(true);
    });

    it('should have enterprise templates', () => {
      expect(templateExists('java')).toBe(true);
      expect(templateExists('spring')).toBe(true);
      expect(templateExists('csharp')).toBe(true);
      expect(templateExists('dotnet')).toBe(true);
    });

    it('should have specialized templates', () => {
      expect(templateExists('ai_ml')).toBe(true);
      expect(templateExists('blockchain')).toBe(true);
      expect(templateExists('gamedev')).toBe(true);
    });
  });
});
