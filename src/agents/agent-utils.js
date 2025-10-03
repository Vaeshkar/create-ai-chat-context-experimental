/**
 * AgentUtils - Common utilities for pattern matching, text analysis, and data processing
 * Used by all specialized logic agents for consistent processing
 */
class AgentUtils {
  
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
      /plan is to/i
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
      /interesting/i
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
      /optimized/i
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
      /not working/i
    ],
    
    // State patterns - current work status
    workingOn: [
      /working on/i,
      /currently/i,
      /in progress/i,
      /building/i,
      /developing/i,
      /focusing on/i,
      /task is/i
    ],
    
    // Next action patterns
    nextActions: [
      /next step/i,
      /need to/i,
      /will/i,
      /plan to/i,
      /should/i,
      /todo/i,
      /next/i
    ]
  };

  /**
   * Check if text matches any pattern in a category
   * @param {string} text - Text to check
   * @param {string} category - Pattern category (decisions, insights, etc.)
   * @returns {boolean} True if pattern matches
   */
  static matchesPattern(text, category) {
    const patterns = this.patterns[category] || [];
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract text matching specific patterns with context
   * @param {string} text - Source text
   * @param {string} category - Pattern category
   * @param {number} contextLength - Characters of context to include
   * @returns {Array} Array of matches with context
   */
  static extractMatches(text, category, contextLength = 100) {
    const patterns = this.patterns[category] || [];
    const matches = [];
    
    patterns.forEach(pattern => {
      const match = pattern.exec(text);
      if (match) {
        const start = Math.max(0, match.index - contextLength / 2);
        const end = Math.min(text.length, match.index + match[0].length + contextLength / 2);
        matches.push({
          pattern: pattern.toString(),
          match: match[0],
          context: text.slice(start, end).trim(),
          index: match.index
        });
      }
    });
    
    return matches;
  }

  /**
   * Clean and normalize text for processing
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  static cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .replace(/[^\w\s\-_.]/g, '') // Keep only word chars, spaces, hyphens, underscores, periods
      .trim();
  }

  /**
   * Extract action verb from text (for flow generation)
   * @param {string} text - Message text
   * @returns {string} Normalized action
   */
  static extractAction(text) {
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
   * @param {string} action - Raw action text
   * @returns {string} Normalized action string
   */
  static normalizeAction(action) {
    return action
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Replace non-word chars with spaces
      .replace(/\s+/g, '_')      // Replace spaces with underscores
      .substring(0, 50)          // Limit length
      .replace(/^_+|_+$/g, '');  // Remove leading/trailing underscores
  }

  /**
   * Assess impact level of a decision or insight
   * @param {string} text - Text to analyze
   * @returns {string} Impact level: CRITICAL, HIGH, MEDIUM, LOW
   */
  static assessImpact(text) {
    const content = text.toLowerCase();
    
    // Critical impact keywords
    const criticalWords = [
      'architecture', 'database', 'security', 'performance',
      'api design', 'data model', 'infrastructure', 'deployment',
      'authentication', 'authorization', 'scalability'
    ];
    
    // High impact keywords
    const highWords = [
      'feature', 'component', 'integration', 'framework',
      'library', 'service', 'module', 'interface', 'workflow'
    ];
    
    // Medium impact keywords
    const mediumWords = [
      'function', 'method', 'variable', 'styling', 'ui',
      'layout', 'formatting', 'validation', 'helper'
    ];
    
    if (criticalWords.some(word => content.includes(word))) return 'CRITICAL';
    if (highWords.some(word => content.includes(word))) return 'HIGH';
    if (mediumWords.some(word => content.includes(word))) return 'MEDIUM';
    
    return 'LOW';
  }

  /**
   * Categorize insights by domain
   * @param {string} text - Insight text
   * @returns {string} Category
   */
  static categorizeInsight(text) {
    const content = text.toLowerCase();
    
    if (content.includes('performance') || content.includes('speed') || content.includes('optimization')) {
      return 'PERFORMANCE';
    }
    if (content.includes('security') || content.includes('authentication') || content.includes('authorization')) {
      return 'SECURITY';
    }
    if (content.includes('architecture') || content.includes('design') || content.includes('structure')) {
      return 'ARCHITECTURE';
    }
    if (content.includes('bug') || content.includes('error') || content.includes('fix') || content.includes('debug')) {
      return 'DEBUGGING';
    }
    if (content.includes('user') || content.includes('ui') || content.includes('ux') || content.includes('interface')) {
      return 'USER_EXPERIENCE';
    }
    if (content.includes('data') || content.includes('database') || content.includes('model')) {
      return 'DATA';
    }
    
    return 'GENERAL';
  }

  /**
   * Calculate priority based on keywords and context
   * @param {string} text - Text to analyze
   * @returns {string} Priority level: HIGH, MEDIUM, LOW
   */
  static calculatePriority(text) {
    const content = text.toLowerCase();
    
    // High priority indicators
    const highPriorityWords = [
      'critical', 'urgent', 'blocker', 'important', 'must',
      'required', 'essential', 'crucial', 'key'
    ];
    
    // Low priority indicators
    const lowPriorityWords = [
      'nice to have', 'optional', 'later', 'future', 'minor',
      'cosmetic', 'enhancement', 'improvement'
    ];
    
    if (highPriorityWords.some(word => content.includes(word))) return 'HIGH';
    if (lowPriorityWords.some(word => content.includes(word))) return 'LOW';
    
    return 'MEDIUM';
  }

  /**
   * Extract timestamp from message if available
   * @param {Object} message - Message object
   * @returns {string} ISO timestamp or current time
   */
  static extractTimestamp(message) {
    if (message.timestamp) return message.timestamp;
    if (message.created_at) return message.created_at;
    if (message.time) return message.time;
    if (message.date) return message.date;
    
    return new Date().toISOString();
  }

  /**
   * Count items found for metadata
   * @param {Array} items - Array of items
   * @returns {number} Count
   */
  static countItems(items) {
    if (!items) return 0;
    if (Array.isArray(items)) return items.length;
    if (typeof items === 'object') return Object.keys(items).length;
    if (typeof items === 'string') return items.length > 0 ? 1 : 0;
    
    return 0;
  }

  /**
   * Truncate text to specified length with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Remove duplicate items from array based on key property
   * @param {Array} items - Array of items
   * @param {string} keyProperty - Property to check for duplicates
   * @returns {Array} Deduplicated array
   */
  static deduplicate(items, keyProperty = 'content') {
    if (!Array.isArray(items)) return items;
    
    const seen = new Set();
    return items.filter(item => {
      const key = item[keyProperty] || item;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Format AICF section content
   * @param {string} section - Section name (e.g., '@FLOW')
   * @param {*} content - Content to format
   * @returns {string} Formatted AICF content
   */
  static formatAICFSection(section, content) {
    const lines = [section];
    
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (typeof item === 'object') {
          // Format object as pipe-delimited
          const values = Object.values(item).join('|');
          lines.push(values);
        } else {
          lines.push(item.toString());
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

module.exports = { AgentUtils };