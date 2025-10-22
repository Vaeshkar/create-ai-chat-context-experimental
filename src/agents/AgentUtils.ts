/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * AgentUtils - Common utilities for pattern matching, text analysis, and data processing
 * Used by all specialized logic agents for consistent processing
 */

export interface PatternMatch {
  pattern: string;
  match: string;
  context: string;
  index: number;
}

export interface FormattedSection {
  title: string;
  content: string;
}

export type ImpactLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export class AgentUtils {
  /**
   * Pattern matching utilities for identifying key content
   */
  static patterns = {
    // Decision patterns - identify when decisions are made
    decisions: [
      /we decided to/i,
      /I chose/i,
      /let's go with/i,
      /the approach is/i,
      /we'll use/i,
      /selected/i,
      /agreed on/i,
      /going to use/i,
      /will implement/i,
      /plan is to/i,
    ],

    // Insight patterns - capture key learnings and realizations
    insights: [
      /realized/i,
      /discovered/i,
      /key insight/i,
      /learned that/i,
      /important to note/i,
      /critical/i,
      /breakthrough/i,
      /found out/i,
      /figured out/i,
      /turns out/i,
      /interesting/i,
    ],

    // Action patterns - identify key events and activities
    actions: [
      /implemented/i,
      /built/i,
      /created/i,
      /fixed/i,
      /solved/i,
      /updated/i,
      /changed/i,
      /modified/i,
      /added/i,
      /removed/i,
      /refactored/i,
      /optimized/i,
    ],

    // Blocker patterns - identify obstacles and issues
    blockers: [
      /blocked by/i,
      /can't proceed/i,
      /stuck on/i,
      /waiting for/i,
      /dependency/i,
      /issue with/i,
      /problem with/i,
      /error/i,
      /failing/i,
      /not working/i,
    ],

    // State patterns - current work status
    workingOn: [
      /working on/i,
      /currently/i,
      /in progress/i,
      /building/i,
      /developing/i,
      /focusing on/i,
      /task is/i,
    ],

    // Next action patterns
    nextActions: [/next step/i, /need to/i, /will/i, /plan to/i, /should/i, /todo/i, /next/i],
  };

  /**
   * Check if text matches any pattern in a category
   */
  static matchesPattern(text: string, category: keyof typeof AgentUtils.patterns): boolean {
    const patterns = this.patterns[category] || [];
    return patterns.some((pattern) => pattern.test(text));
  }

  /**
   * Extract text matching specific patterns with context
   */
  static extractMatches(
    text: string,
    category: keyof typeof AgentUtils.patterns,
    contextLength: number = 100
  ): PatternMatch[] {
    const patterns = this.patterns[category] || [];
    const matches: PatternMatch[] = [];

    patterns.forEach((pattern) => {
      const match = pattern.exec(text);
      if (match) {
        const start = Math.max(0, match.index - contextLength / 2);
        const end = Math.min(text.length, match.index + match[0].length + contextLength / 2);
        matches.push({
          pattern: pattern.toString(),
          match: match[0],
          context: text.slice(start, end).trim(),
          index: match.index,
        });
      }
    });

    return matches;
  }

  /**
   * Clean and normalize text for processing
   */
  static cleanText(text: string): string {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-_.]/g, '') // Keep only word chars, spaces, hyphens, underscores, periods
      .trim();
  }

  /**
   * Extract action verb from text (for flow generation)
   */
  static extractAction(text: string): string {
    if (!text) return '';

    // Find first action pattern match
    for (const pattern of this.patterns.actions) {
      const match = pattern.exec(text);
      if (match) {
        // Extract surrounding context to understand the action
        const start = Math.max(0, match.index - 20);
        const end = Math.min(text.length, match.index + match[0].length + 30);
        const context = text.slice(start, end);

        return this.normalizeAction(context);
      }
    }

    // Fallback to simple text normalization
    return this.normalizeAction(text.substring(0, 50));
  }

  /**
   * Normalize action text to consistent format
   */
  static normalizeAction(action: string): string {
    return action
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace non-word chars with spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50) // Limit length
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  }

  /**
   * Assess impact level of a decision or insight
   */
  static assessImpact(text: string): ImpactLevel {
    const content = text.toLowerCase();

    // Critical impact keywords
    const criticalWords = [
      'architecture',
      'database',
      'security',
      'performance',
      'api design',
      'data model',
      'infrastructure',
      'deployment',
      'authentication',
      'authorization',
      'scalability',
    ];

    // High impact keywords
    const highWords = [
      'refactor',
      'redesign',
      'migration',
      'integration',
      'optimization',
      'testing',
      'deployment',
      'release',
    ];

    // Check for critical keywords
    if (criticalWords.some((word) => content.includes(word))) {
      return 'CRITICAL';
    }

    // Check for high impact keywords
    if (highWords.some((word) => content.includes(word))) {
      return 'HIGH';
    }

    // Check for medium impact indicators
    if (content.includes('fix') || content.includes('update') || content.includes('improve')) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Extract key entities (names, technologies, concepts)
   */
  static extractEntities(text: string): string[] {
    if (!text) return [];

    // Simple entity extraction - capitalized words and known tech terms
    const words = text.split(/\s+/);
    const entities: string[] = [];

    words.forEach((word) => {
      // Capitalized words (likely proper nouns)
      if (/^[A-Z][a-z]+/.test(word)) {
        entities.push(word.replace(/[^\w]/g, ''));
      }
    });

    // Remove duplicates
    return [...new Set(entities)];
  }

  /**
   * Calculate relevance score for text against keywords
   */
  static calculateRelevance(text: string, keywords: string[]): number {
    if (!text || keywords.length === 0) return 0;

    const lowerText = text.toLowerCase();
    const matches = keywords.filter((keyword) => lowerText.includes(keyword.toLowerCase())).length;

    return (matches / keywords.length) * 100;
  }

  /**
   * Format content into a structured section
   */
  static formatSection(
    title: string,
    content: string | string[] | Record<string, unknown>
  ): string {
    const lines: string[] = [];

    lines.push(`## ${title}`);
    lines.push('');

    if (Array.isArray(content)) {
      // Format array items
      content.forEach((item) => {
        if (typeof item === 'string') {
          lines.push(`- ${item}`);
        } else if (item !== null && typeof item === 'object') {
          lines.push(String(item));
        } else {
          lines.push(String(item));
        }
      });
    } else if (typeof content === 'object') {
      // Format object properties
      Object.entries(content).forEach(([key, value]) => {
        lines.push(`${key}=${value}`);
      });
    } else {
      lines.push(content.toString());
    }

    lines.push(''); // Empty line after section
    return lines.join('\n');
  }
}
