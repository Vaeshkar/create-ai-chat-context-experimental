const { AgentUtils } = require('./agent-utils');

/**
 * InsightAnalyzerAgent - Captures key insights and learnings from conversations
 * Generates the @INSIGHTS section for AICF format
 */
class InsightAnalyzerAgent {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Analyze conversation messages to extract insights
   * @param {Array} messages - Array of conversation messages
   * @returns {Object} Extracted insights data
   */
  async analyze(messages) {
    try {
      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          section: '@INSIGHTS',
          content: [],
          metadata: { insightsFound: 0, error: 'No messages to analyze' }
        };
      }

      // Extract raw insights from messages
      const rawInsights = this.extractRawInsights(messages);
      
      // Process and enrich insights
      const processedInsights = this.processInsights(rawInsights);
      
      // Finalize insights (deduplicate, prioritize, categorize)
      const finalInsights = this.finalizeInsights(processedInsights);

      return {
        section: '@INSIGHTS',
        content: finalInsights,
        metadata: {
          insightsFound: finalInsights.length,
          totalMessages: messages.length,
          rawInsightsFound: rawInsights.length,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      return {
        section: '@INSIGHTS',
        content: [],
        metadata: {
          error: true,
          errorMessage: error.message,
          insightsFound: 0
        }
      };
    }
  }

  /**
   * Extract raw insights from all messages
   * @param {Array} messages - Conversation messages
   * @returns {Array} Array of raw insight data
   */
  extractRawInsights(messages) {
    const insights = [];

    messages.forEach((message, index) => {
      if (!message.content) return;

      const content = message.content;
      
      // Check for insight patterns
      if (this.containsInsight(content)) {
        const insightData = this.extractInsightData(message, index);
        if (insightData) {
          insights.push(insightData);
        }
      }

      // Also check for implicit insights (problems solved, patterns discovered)
      const implicitInsights = this.extractImplicitInsights(message, index);
      insights.push(...implicitInsights);
    });

    return insights;
  }

  /**
   * Check if message content contains insight indicators
   * @param {string} content - Message content
   * @returns {boolean} True if contains insight
   */
  containsInsight(content) {
    return AgentUtils.matchesPattern(content, 'insights');
  }

  /**
   * Extract structured insight data from a message
   * @param {Object} message - Message object
   * @param {number} messageIndex - Index of message in conversation
   * @returns {Object|null} Structured insight data
   */
  extractInsightData(message, messageIndex) {
    const content = message.content;
    const timestamp = AgentUtils.extractTimestamp(message);
    
    try {
      // Extract the core insight
      const insight = this.extractCoreInsight(content);
      
      // Determine insight type
      const insightType = this.determineInsightType(content);
      
      // Assess importance and priority
      const importance = this.assessImportance(content);
      const priority = AgentUtils.calculatePriority(content);
      
      // Categorize the insight
      const category = AgentUtils.categorizeInsight(content);
      
      // Extract context and implications
      const context = this.extractContext(content, insight);
      const implications = this.extractImplications(content);
      
      // Assess confidence level
      const confidence = this.assessInsightConfidence(content);

      return {
        insight: insight,
        type: insightType,
        importance: importance,
        priority: priority,
        category: category,
        context: context,
        implications: implications,
        confidence: confidence,
        timestamp: timestamp,
        messageIndex: messageIndex,
        speaker: this.extractSpeaker(message)
      };

    } catch (error) {
      // Return basic insight if detailed extraction fails
      return {
        insight: AgentUtils.truncateText(content, 150),
        type: 'OBSERVATION',
        importance: 'MEDIUM',
        priority: 'MEDIUM',
        category: 'GENERAL',
        context: 'extraction_failed',
        implications: [],
        confidence: 'LOW',
        timestamp: timestamp,
        messageIndex: messageIndex,
        speaker: this.extractSpeaker(message)
      };
    }
  }

  /**
   * Extract implicit insights (patterns, solutions, discoveries not explicitly stated)
   * @param {Object} message - Message object
   * @param {number} messageIndex - Message index
   * @returns {Array} Array of implicit insights
   */
  extractImplicitInsights(message, messageIndex) {
    const content = message.content;
    const insights = [];

    // Problem-solution patterns
    if (this.containsProblemSolution(content)) {
      const problemSolution = this.extractProblemSolution(content);
      if (problemSolution) {
        insights.push({
          insight: problemSolution.solution,
          type: 'SOLUTION',
          importance: 'HIGH',
          priority: 'HIGH',
          category: 'DEBUGGING',
          context: problemSolution.problem,
          implications: [`solves: ${problemSolution.problem}`],
          confidence: 'HIGH',
          timestamp: AgentUtils.extractTimestamp(message),
          messageIndex: messageIndex,
          speaker: this.extractSpeaker(message)
        });
      }
    }

    // Pattern discoveries
    if (this.containsPatternDiscovery(content)) {
      const pattern = this.extractPattern(content);
      if (pattern) {
        insights.push({
          insight: pattern,
          type: 'PATTERN',
          importance: 'MEDIUM',
          priority: 'MEDIUM',
          category: 'ARCHITECTURE',
          context: content.substring(0, 100),
          implications: ['pattern_identified'],
          confidence: 'MEDIUM',
          timestamp: AgentUtils.extractTimestamp(message),
          messageIndex: messageIndex,
          speaker: this.extractSpeaker(message)
        });
      }
    }

    // Performance discoveries
    if (this.containsPerformanceInsight(content)) {
      const perfInsight = this.extractPerformanceInsight(content);
      if (perfInsight) {
        insights.push({
          insight: perfInsight,
          type: 'PERFORMANCE',
          importance: 'HIGH',
          priority: 'HIGH',
          category: 'PERFORMANCE',
          context: content.substring(0, 100),
          implications: ['performance_impact'],
          confidence: 'HIGH',
          timestamp: AgentUtils.extractTimestamp(message),
          messageIndex: messageIndex,
          speaker: this.extractSpeaker(message)
        });
      }
    }

    return insights;
  }

  /**
   * Extract the core insight statement from content
   * @param {string} content - Message content
   * @returns {string} Core insight
   */
  extractCoreInsight(content) {
    const matches = AgentUtils.extractMatches(content, 'insights', 200);
    
    if (matches.length === 0) {
      return AgentUtils.truncateText(content, 150);
    }

    // Use the context around the insight pattern
    let bestMatch = matches[0];
    
    // Prefer matches with more substantial context
    matches.forEach(match => {
      if (match.context.length > bestMatch.context.length) {
        bestMatch = match;
      }
    });

    // Clean up the insight statement
    return this.cleanInsightStatement(bestMatch.context);
  }

  /**
   * Clean and format insight statement
   * @param {string} rawInsight - Raw insight text
   * @returns {string} Cleaned insight statement
   */
  cleanInsightStatement(rawInsight) {
    return rawInsight
      .replace(/^(i|we|it)\s+(realized|discovered|learned|found|figured)\s+(that\s+)?/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Determine the type of insight
   * @param {string} content - Message content
   * @returns {string} Insight type
   */
  determineInsightType(content) {
    const content_lower = content.toLowerCase();

    // Technical insights
    if (this.matchesTechnicalInsightPatterns(content_lower)) {
      return 'TECHNICAL';
    }

    // Process insights
    if (this.matchesProcessInsightPatterns(content_lower)) {
      return 'PROCESS';
    }

    // User experience insights
    if (this.matchesUXInsightPatterns(content_lower)) {
      return 'USER_EXPERIENCE';
    }

    // Business insights
    if (this.matchesBusinessInsightPatterns(content_lower)) {
      return 'BUSINESS';
    }

    // Learning insights
    if (this.matchesLearningInsightPatterns(content_lower)) {
      return 'LEARNING';
    }

    // Problem-solving insights
    if (this.matchesProblemSolvingPatterns(content_lower)) {
      return 'SOLUTION';
    }

    // General observation
    return 'OBSERVATION';
  }

  /**
   * Check for technical insight patterns
   */
  matchesTechnicalInsightPatterns(content) {
    const patterns = [
      'performance', 'optimization', 'bug', 'error', 'fix',
      'algorithm', 'data structure', 'architecture', 'scalability',
      'memory', 'cpu', 'database', 'query', 'api'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for process insight patterns
   */
  matchesProcessInsightPatterns(content) {
    const patterns = [
      'workflow', 'process', 'method', 'approach', 'strategy',
      'team', 'collaboration', 'communication', 'efficiency'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for UX insight patterns
   */
  matchesUXInsightPatterns(content) {
    const patterns = [
      'user', 'interface', 'experience', 'usability', 'design',
      'interaction', 'behavior', 'feedback', 'accessibility'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for business insight patterns
   */
  matchesBusinessInsightPatterns(content) {
    const patterns = [
      'business', 'market', 'customer', 'revenue', 'cost',
      'roi', 'value', 'opportunity', 'risk', 'competitive'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for learning insight patterns
   */
  matchesLearningInsightPatterns(content) {
    const patterns = [
      'learned', 'discovered', 'understand', 'knowledge',
      'skill', 'technique', 'concept', 'principle'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check for problem-solving patterns
   */
  matchesProblemSolvingPatterns(content) {
    const patterns = [
      'solution', 'solved', 'fix', 'resolve', 'answer',
      'workaround', 'approach works', 'breakthrough'
    ];
    return patterns.some(pattern => content.includes(pattern));
  }

  /**
   * Assess importance level of insight
   * @param {string} content - Message content
   * @returns {string} Importance level
   */
  assessImportance(content) {
    const content_lower = content.toLowerCase();

    // Critical importance indicators
    const criticalWords = [
      'critical', 'crucial', 'essential', 'fundamental', 'breakthrough',
      'game changer', 'major', 'significant', 'important discovery'
    ];

    // High importance indicators
    const highWords = [
      'important', 'key', 'major', 'significant', 'valuable',
      'useful', 'helpful', 'good to know'
    ];

    // Low importance indicators
    const lowWords = [
      'minor', 'small', 'trivial', 'obvious', 'expected',
      'not surprising', 'already knew'
    ];

    if (criticalWords.some(word => content_lower.includes(word))) {
      return 'CRITICAL';
    }
    if (highWords.some(word => content_lower.includes(word))) {
      return 'HIGH';
    }
    if (lowWords.some(word => content_lower.includes(word))) {
      return 'LOW';
    }

    return 'MEDIUM'; // Default
  }

  /**
   * Extract context around the insight
   * @param {string} content - Full message content
   * @param {string} insight - The core insight
   * @returns {string} Context
   */
  extractContext(content, insight) {
    // Find the insight in the content and extract surrounding context
    const insightIndex = content.toLowerCase().indexOf(insight.toLowerCase());
    
    if (insightIndex === -1) {
      return AgentUtils.truncateText(content, 100);
    }

    // Extract context before and after
    const contextStart = Math.max(0, insightIndex - 50);
    const contextEnd = Math.min(content.length, insightIndex + insight.length + 50);
    const context = content.substring(contextStart, contextEnd);

    return AgentUtils.truncateText(context, 150);
  }

  /**
   * Extract implications of the insight
   * @param {string} content - Message content
   * @returns {Array} Array of implications
   */
  extractImplications(content) {
    const implications = [];
    
    // Look for implication indicators
    const implicationPatterns = [
      /this means\s+([^.]{10,80})/gi,
      /implies that\s+([^.]{10,80})/gi,
      /therefore\s+([^.]{10,80})/gi,
      /as a result\s+([^.]{10,80})/gi,
      /this leads to\s+([^.]{10,80})/gi,
      /consequence is\s+([^.]{10,80})/gi,
      /impact on\s+([^.]{10,80})/gi
    ];

    implicationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && match[1].trim().length > 10) {
          implications.push(AgentUtils.truncateText(match[1].trim(), 100));
        }
      }
    });

    return AgentUtils.deduplicate(implications);
  }

  /**
   * Assess confidence level of the insight
   * @param {string} content - Message content
   * @returns {string} Confidence level
   */
  assessInsightConfidence(content) {
    const content_lower = content.toLowerCase();

    // High confidence indicators
    const highConfidenceWords = [
      'clearly', 'obviously', 'definitely', 'certainly', 'proven',
      'confirmed', 'verified', 'established', 'conclusive'
    ];

    // Low confidence indicators
    const lowConfidenceWords = [
      'might', 'could be', 'possibly', 'seems like', 'appears',
      'maybe', 'uncertain', 'unclear', 'speculation'
    ];

    // Medium confidence indicators
    const mediumConfidenceWords = [
      'likely', 'probably', 'suggests', 'indicates', 'implies',
      'tends to', 'generally', 'usually'
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
   * Check if content contains problem-solution patterns
   */
  containsProblemSolution(content) {
    const patterns = [
      /problem.*solution/i,
      /issue.*fix/i,
      /error.*resolved/i,
      /bug.*solved/i,
      /challenge.*overcome/i
    ];
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Extract problem-solution pair
   */
  extractProblemSolution(content) {
    const problemPatterns = [
      /problem\s+(?:is|was)\s+([^.]{10,100})/i,
      /issue\s+(?:is|was)\s+([^.]{10,100})/i,
      /bug\s+(?:is|was)\s+([^.]{10,100})/i
    ];

    const solutionPatterns = [
      /solution\s+(?:is|was)\s+([^.]{10,100})/i,
      /fix\s+(?:is|was)\s+([^.]{10,100})/i,
      /resolved\s+by\s+([^.]{10,100})/i
    ];

    let problem = null;
    let solution = null;

    // Find problem
    for (const pattern of problemPatterns) {
      const match = pattern.exec(content);
      if (match) {
        problem = match[1].trim();
        break;
      }
    }

    // Find solution
    for (const pattern of solutionPatterns) {
      const match = pattern.exec(content);
      if (match) {
        solution = match[1].trim();
        break;
      }
    }

    return problem && solution ? { problem, solution } : null;
  }

  /**
   * Check for pattern discovery indicators
   */
  containsPatternDiscovery(content) {
    const patterns = [
      /pattern/i, /always/i, /never/i, /tends to/i,
      /usually/i, /consistently/i, /recurring/i
    ];
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Extract discovered pattern
   */
  extractPattern(content) {
    const patternMatches = [
      /pattern\s+(?:is|was)\s+([^.]{10,100})/i,
      /always\s+([^.]{10,100})/i,
      /tends to\s+([^.]{10,100})/i
    ];

    for (const pattern of patternMatches) {
      const match = pattern.exec(content);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Check for performance-related insights
   */
  containsPerformanceInsight(content) {
    const patterns = [
      /faster/i, /slower/i, /performance/i, /optimization/i,
      /memory/i, /cpu/i, /efficient/i, /benchmark/i
    ];
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Extract performance insight
   */
  extractPerformanceInsight(content) {
    const perfPatterns = [
      /(\d+[x%]?\s+faster)/i,
      /(\d+[x%]?\s+slower)/i,
      /(performance\s+improved)/i,
      /(memory\s+usage\s+[^.]{5,50})/i
    ];

    for (const pattern of perfPatterns) {
      const match = pattern.exec(content);
      if (match) {
        return match[1].trim();
      }
    }

    return 'performance optimization identified';
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
   * Process raw insights into structured format
   * @param {Array} rawInsights - Array of raw insight data
   * @returns {Array} Processed insights
   */
  processInsights(rawInsights) {
    return rawInsights.map(insight => ({
      insight: insight.insight,
      type: insight.type,
      importance: insight.importance,
      priority: insight.priority,
      category: insight.category,
      context: insight.context,
      implications: insight.implications,
      confidence: insight.confidence,
      timestamp: insight.timestamp,
      speaker: insight.speaker
    }));
  }

  /**
   * Finalize insights - deduplicate, sort by importance
   * @param {Array} insights - Processed insights
   * @returns {Array} Final insight list
   */
  finalizeInsights(insights) {
    // Remove duplicates
    const uniqueInsights = this.deduplicateInsights(insights);
    
    // Sort by importance and priority
    const sortedInsights = this.sortInsightsByImportance(uniqueInsights);
    
    // Limit to most important insights (max 15)
    return sortedInsights.slice(0, 15);
  }

  /**
   * Remove duplicate insights
   */
  deduplicateInsights(insights) {
    const uniqueInsights = [];
    const seenInsights = new Set();

    insights.forEach(insight => {
      const normalizedInsight = insight.insight.toLowerCase().replace(/\s+/g, ' ');
      
      // Check for exact matches
      if (seenInsights.has(normalizedInsight)) {
        return;
      }

      // Check for similar insights (>75% similarity)
      const isSimilar = uniqueInsights.some(existing => {
        const existingNormalized = existing.insight.toLowerCase().replace(/\s+/g, ' ');
        return this.calculateSimilarity(normalizedInsight, existingNormalized) > 0.75;
      });

      if (!isSimilar) {
        seenInsights.add(normalizedInsight);
        uniqueInsights.push(insight);
      }
    });

    return uniqueInsights;
  }

  /**
   * Calculate text similarity (Jaccard index)
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Sort insights by importance and priority
   */
  sortInsightsByImportance(insights) {
    const importanceWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const priorityWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const confidenceWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };

    return insights.sort((a, b) => {
      const scoreA = (importanceWeight[a.importance] || 2) + 
                     (priorityWeight[a.priority] || 2) + 
                     (confidenceWeight[a.confidence] || 2);
      const scoreB = (importanceWeight[b.importance] || 2) + 
                     (priorityWeight[b.priority] || 2) + 
                     (confidenceWeight[b.confidence] || 2);
      
      return scoreB - scoreA; // Higher scores first
    });
  }
}

module.exports = { InsightAnalyzerAgent };