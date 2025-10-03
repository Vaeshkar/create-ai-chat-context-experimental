const { AgentUtils } = require('./agent-utils');

/**
 * DecisionExtractorAgent - Identifies and documents decisions made during conversations
 * Generates the @DECISIONS section for AICF format
 */
class DecisionExtractorAgent {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Extract decisions from conversation messages
   * @param {Array} messages - Array of conversation messages
   * @returns {Object} Extracted decisions data
   */
  async extract(messages) {
    try {
      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          section: '@DECISIONS',
          content: [],
          metadata: { decisionsFound: 0, error: 'No messages to process' }
        };
      }

      // Extract raw decisions from messages
      const rawDecisions = this.extractRawDecisions(messages);
      
      // Process and structure decisions
      const structuredDecisions = this.processDecisions(rawDecisions);
      
      // Deduplicate and prioritize
      const finalDecisions = this.finalizeDecisions(structuredDecisions);

      return {
        section: '@DECISIONS',
        content: finalDecisions,
        metadata: {
          decisionsFound: finalDecisions.length,
          totalMessages: messages.length,
          rawDecisionsFound: rawDecisions.length,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      return {
        section: '@DECISIONS',
        content: [],
        metadata: {
          error: true,
          errorMessage: error.message,
          decisionsFound: 0
        }
      };
    }
  }

  /**
   * Extract raw decisions from all messages
   * @param {Array} messages - Conversation messages
   * @returns {Array} Array of raw decision data
   */
  extractRawDecisions(messages) {
    const decisions = [];

    messages.forEach((message, index) => {
      if (!message.content) return;

      const content = message.content;
      
      // Check if message contains decision patterns
      if (this.containsDecision(content)) {
        const decisionData = this.extractDecisionData(message, index);
        if (decisionData) {
          decisions.push(decisionData);
        }
      }
    });

    return decisions;
  }

  /**
   * Check if message content contains decision indicators
   * @param {string} content - Message content
   * @returns {boolean} True if contains decision
   */
  containsDecision(content) {
    return AgentUtils.matchesPattern(content, 'decisions');
  }

  /**
   * Extract structured decision data from a message
   * @param {Object} message - Message object
   * @param {number} messageIndex - Index of message in conversation
   * @returns {Object|null} Structured decision data
   */
  extractDecisionData(message, messageIndex) {
    const content = message.content;
    const timestamp = AgentUtils.extractTimestamp(message);
    
    try {
      // Extract the main decision statement
      const decisionStatement = this.extractDecisionStatement(content);
      
      // Extract reasoning/context
      const reasoning = this.extractReasoning(content, decisionStatement);
      
      // Assess impact and priority
      const impact = AgentUtils.assessImpact(content);
      const priority = AgentUtils.calculatePriority(content);
      
      // Categorize the decision
      const category = this.categorizeDecision(content);
      
      // Extract any alternatives that were considered
      const alternatives = this.extractAlternatives(content);

      return {
        decision: decisionStatement,
        reasoning: reasoning,
        impact: impact,
        priority: priority,
        category: category,
        alternatives: alternatives,
        timestamp: timestamp,
        messageIndex: messageIndex,
        speaker: this.extractSpeaker(message),
        confidence: this.assessConfidence(content)
      };

    } catch (error) {
      // Return basic decision if detailed extraction fails
      return {
        decision: AgentUtils.truncateText(content, 100),
        reasoning: 'extraction_failed',
        impact: 'MEDIUM',
        priority: 'MEDIUM',
        category: 'GENERAL',
        alternatives: [],
        timestamp: timestamp,
        messageIndex: messageIndex,
        speaker: this.extractSpeaker(message),
        confidence: 'LOW'
      };
    }
  }

  /**
   * Extract the core decision statement from content
   * @param {string} content - Message content
   * @returns {string} Decision statement
   */
  extractDecisionStatement(content) {
    const matches = AgentUtils.extractMatches(content, 'decisions', 150);
    
    if (matches.length === 0) {
      return AgentUtils.truncateText(content, 100);
    }

    // Use the context around the decision pattern
    let bestMatch = matches[0];
    
    // Prefer matches with more context
    matches.forEach(match => {
      if (match.context.length > bestMatch.context.length) {
        bestMatch = match;
      }
    });

    // Clean up the decision statement
    return this.cleanDecisionStatement(bestMatch.context);
  }

  /**
   * Clean and format decision statement
   * @param {string} rawStatement - Raw decision text
   * @returns {string} Cleaned decision statement
   */
  cleanDecisionStatement(rawStatement) {
    return rawStatement
      .replace(/^(we|i|let's|the)\s+(decided|chose|selected|agreed|will|are|going)\s+(to\s+)?/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 150); // Limit length
  }

  /**
   * Extract reasoning/context for the decision
   * @param {string} content - Full message content
   * @param {string} decisionStatement - The main decision
   * @returns {string} Reasoning/context
   */
  extractReasoning(content, decisionStatement) {
    // Look for reasoning indicators
    const reasoningPatterns = [
      /because\s+(.{20,100})/i,
      /since\s+(.{20,100})/i,
      /due to\s+(.{20,100})/i,
      /as\s+(.{20,100})/i,
      /given that\s+(.{20,100})/i,
      /reason is\s+(.{20,100})/i,
      /this will\s+(.{20,100})/i,
      /helps us\s+(.{20,100})/i
    ];

    for (const pattern of reasoningPatterns) {
      const match = pattern.exec(content);
      if (match && match[1]) {
        return AgentUtils.truncateText(match[1].trim(), 200);
      }
    }

    // Fallback: extract context around the decision
    const decisionIndex = content.toLowerCase().indexOf(decisionStatement.toLowerCase());
    if (decisionIndex !== -1) {
      const start = Math.max(0, decisionIndex + decisionStatement.length);
      const reasoning = content.substring(start, start + 200).trim();
      if (reasoning.length > 10) {
        return AgentUtils.truncateText(reasoning, 200);
      }
    }

    return 'context_unclear';
  }

  /**
   * Categorize the decision by domain/type
   * @param {string} content - Message content
   * @returns {string} Decision category
   */
  categorizeDecision(content) {
    const content_lower = content.toLowerCase();

    // Technical architecture decisions
    if (this.matchesTechnicalPatterns(content_lower)) {
      return 'TECHNICAL';
    }

    // Design decisions
    if (this.matchesDesignPatterns(content_lower)) {
      return 'DESIGN';
    }

    // Process/workflow decisions
    if (this.matchesProcessPatterns(content_lower)) {
      return 'PROCESS';
    }

    // Tool/technology choices
    if (this.matchesToolPatterns(content_lower)) {
      return 'TOOLING';
    }

    // Business/product decisions
    if (this.matchesBusinessPatterns(content_lower)) {
      return 'BUSINESS';
    }

    // Implementation approach
    if (this.matchesImplementationPatterns(content_lower)) {
      return 'IMPLEMENTATION';
    }

    return 'GENERAL';
  }

  /**
   * Check for technical architecture patterns
   */
  matchesTechnicalPatterns(content) {
    const patterns = [
      'architecture', 'database', 'api', 'service', 'microservice',
      'infrastructure', 'deployment', 'scaling', 'performance',
      'security', 'authentication', 'authorization'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for design patterns
   */
  matchesDesignPatterns(content) {
    const patterns = [
      'design', 'ui', 'ux', 'interface', 'layout', 'styling',
      'user experience', 'wireframe', 'mockup', 'prototype'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for process patterns
   */
  matchesProcessPatterns(content) {
    const patterns = [
      'process', 'workflow', 'procedure', 'methodology', 'approach',
      'strategy', 'plan', 'schedule', 'timeline'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for tool patterns
   */
  matchesToolPatterns(content) {
    const patterns = [
      'tool', 'framework', 'library', 'package', 'dependency',
      'technology', 'platform', 'environment', 'stack'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for business patterns
   */
  matchesBusinessPatterns(content) {
    const patterns = [
      'business', 'product', 'feature', 'requirement', 'scope',
      'priority', 'milestone', 'deadline', 'budget', 'resource'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for implementation patterns
   */
  matchesImplementationPatterns(content) {
    const patterns = [
      'implement', 'build', 'create', 'develop', 'code',
      'function', 'method', 'class', 'component', 'module'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Extract alternatives that were considered
   * @param {string} content - Message content
   * @returns {Array} Array of alternatives
   */
  extractAlternatives(content) {
    const alternatives = [];
    
    // Look for alternative indicators
    const alternativePatterns = [
      /instead of\s+([^.]{10,50})/gi,
      /rather than\s+([^.]{10,50})/gi,
      /over\s+([^.]{10,50})/gi,
      /versus\s+([^.]{10,50})/gi,
      /vs\s+([^.]{10,50})/gi,
      /alternative\s+([^.]{10,50})/gi,
      /could have\s+([^.]{10,50})/gi,
      /might use\s+([^.]{10,50})/gi
    ];

    alternativePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && match[1].trim().length > 5) {
          alternatives.push(AgentUtils.truncateText(match[1].trim(), 100));
        }
      }
    });

    return AgentUtils.deduplicate(alternatives);
  }

  /**
   * Assess confidence level of the decision
   * @param {string} content - Message content
   * @returns {string} Confidence level
   */
  assessConfidence(content) {
    const content_lower = content.toLowerCase();

    // High confidence indicators
    const highConfidenceWords = [
      'definitely', 'certainly', 'clearly', 'obviously', 'sure',
      'confident', 'final', 'decided', 'committed'
    ];

    // Low confidence indicators
    const lowConfidenceWords = [
      'maybe', 'perhaps', 'might', 'could', 'possibly', 'tentatively',
      'not sure', 'unsure', 'uncertain', 'temporary'
    ];

    // Medium confidence indicators
    const mediumConfidenceWords = [
      'probably', 'likely', 'seems', 'appears', 'think',
      'believe', 'assume', 'expect'
    ];

    if (highConfidenceWords.some(word => content_lower.includes(word))) {
      return 'HIGH';
    }
    if (lowConfidenceWords.some(word => content_lower.includes(word))) {
      return 'LOW';
    }
    if (mediumConfidenceWords.some(word => content_lower.includes(word))) {
      return 'MEDIUM';
    }

    return 'MEDIUM'; // Default
  }

  /**
   * Extract speaker from message
   */
  extractSpeaker(message) {
    if (message.role) return message.role;
    if (message.author) return message.author;
    if (message.user) return message.user;
    if (message.speaker) return message.speaker;
    return 'unknown';
  }

  /**
   * Process raw decisions into structured format
   * @param {Array} rawDecisions - Array of raw decision data
   * @returns {Array} Processed decisions
   */
  processDecisions(rawDecisions) {
    return rawDecisions.map(decision => ({
      decision: decision.decision,
      reasoning: decision.reasoning,
      impact: decision.impact,
      priority: decision.priority,
      category: decision.category,
      alternatives: decision.alternatives,
      timestamp: decision.timestamp,
      speaker: decision.speaker,
      confidence: decision.confidence
    }));
  }

  /**
   * Finalize decisions - deduplicate, sort by importance
   * @param {Array} decisions - Processed decisions
   * @returns {Array} Final decision list
   */
  finalizeDecisions(decisions) {
    // Remove duplicates based on decision content similarity
    const uniqueDecisions = this.deduplicateDecisions(decisions);
    
    // Sort by impact and priority
    const sortedDecisions = this.sortDecisionsByImportance(uniqueDecisions);
    
    // Limit to most important decisions (max 20)
    return sortedDecisions.slice(0, 20);
  }

  /**
   * Remove duplicate decisions
   */
  deduplicateDecisions(decisions) {
    const uniqueDecisions = [];
    const seenDecisions = new Set();

    decisions.forEach(decision => {
      const normalizedDecision = decision.decision.toLowerCase().replace(/\s+/g, ' ');
      
      // Check for exact matches
      if (seenDecisions.has(normalizedDecision)) {
        return;
      }

      // Check for similar decisions (>80% similarity)
      const isSimilar = uniqueDecisions.some(existing => {
        const existingNormalized = existing.decision.toLowerCase().replace(/\s+/g, ' ');
        return this.calculateSimilarity(normalizedDecision, existingNormalized) > 0.8;
      });

      if (!isSimilar) {
        seenDecisions.add(normalizedDecision);
        uniqueDecisions.push(decision);
      }
    });

    return uniqueDecisions;
  }

  /**
   * Calculate text similarity (simple Jaccard index)
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Sort decisions by importance (impact + priority)
   */
  sortDecisionsByImportance(decisions) {
    const impactWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const priorityWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const confidenceWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };

    return decisions.sort((a, b) => {
      const scoreA = (impactWeight[a.impact] || 2) + 
                     (priorityWeight[a.priority] || 2) + 
                     (confidenceWeight[a.confidence] || 2);
      const scoreB = (impactWeight[b.impact] || 2) + 
                     (priorityWeight[b.priority] || 2) + 
                     (confidenceWeight[b.confidence] || 2);
      
      return scoreB - scoreA; // Higher scores first
    });
  }
}

module.exports = { DecisionExtractorAgent };