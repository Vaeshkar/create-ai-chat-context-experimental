const { AgentUtils } = require('./agent-utils');

/**
 * StateTrackerAgent - Tracks current work status, blockers, and next actions
 * Generates the @STATE section for AICF format
 */
class StateTrackerAgent {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Track conversation state from messages and metadata
   * @param {Array} messages - Array of conversation messages
   * @param {Object} metadata - Conversation metadata
   * @returns {Object} State tracking data
   */
  async track(messages, metadata) {
    try {
      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          section: '@STATE',
          content: this.getDefaultState(metadata),
          metadata: { error: 'No messages to track' }
        };
      }

      // Extract current work status
      const currentWork = this.extractCurrentWork(messages);
      
      // Find blockers and issues
      const blockers = this.findBlockers(messages);
      
      // Identify next actions
      const nextActions = this.identifyNextActions(messages);
      
      // Calculate progress indicators
      const progress = this.calculateProgress(messages);
      
      // Determine session status
      const sessionStatus = this.determineSessionStatus(messages);
      
      // Extract work context
      const workContext = this.extractWorkContext(messages);

      const stateContent = {
        working_on: currentWork || 'unknown',
        blockers: blockers.length > 0 ? blockers.join('|') : 'none',
        next_action: nextActions[0] || 'to_be_determined',
        progress: progress,
        session_status: sessionStatus,
        work_context: workContext,
        session_id: metadata.sessionId || 'unknown',
        checkpoint_number: metadata.checkpointNumber || 0,
        last_activity: this.getLastActivity(messages),
        completion_indicators: this.getCompletionIndicators(messages)
      };

      return {
        section: '@STATE',
        content: stateContent,
        metadata: {
          blockersFound: blockers.length,
          nextActionsFound: nextActions.length,
          progressScore: progress.score || 0,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      return {
        section: '@STATE',
        content: this.getDefaultState(metadata, error.message),
        metadata: {
          error: true,
          errorMessage: error.message
        }
      };
    }
  }

  /**
   * Extract current work from conversation messages
   * @param {Array} messages - Conversation messages
   * @returns {string|null} Current work description
   */
  extractCurrentWork(messages) {
    // Look for recent "working on" patterns in reverse order (most recent first)
    const recentMessages = messages.slice(-10).reverse();
    
    for (const message of recentMessages) {
      if (!message.content) continue;
      
      const workPattern = this.findWorkPattern(message.content);
      if (workPattern) {
        return workPattern;
      }
    }

    // Fallback: analyze message topics to infer current work
    return this.inferWorkFromTopics(messages);
  }

  /**
   * Find work patterns in message content
   * @param {string} content - Message content
   * @returns {string|null} Work pattern if found
   */
  findWorkPattern(content) {
    if (!AgentUtils.matchesPattern(content, 'workingOn')) {
      return null;
    }

    // Extract work patterns with context
    const workPatterns = [
      /working on\s+([^.]{10,100})/i,
      /currently\s+([^.]{10,100})/i,
      /building\s+([^.]{10,100})/i,
      /developing\s+([^.]{10,100})/i,
      /focusing on\s+([^.]{10,100})/i,
      /task is\s+([^.]{10,100})/i,
      /implementing\s+([^.]{10,100})/i,
      /creating\s+([^.]{10,100})/i
    ];

    for (const pattern of workPatterns) {
      const match = pattern.exec(content);
      if (match && match[1]) {
        return AgentUtils.truncateText(match[1].trim(), 150);
      }
    }

    return null;
  }

  /**
   * Infer work from message topics and keywords
   * @param {Array} messages - All messages
   * @returns {string} Inferred work description
   */
  inferWorkFromTopics(messages) {
    const topics = new Map();
    
    // Count frequency of work-related topics
    messages.forEach(message => {
      if (!message.content) return;
      
      const workKeywords = this.extractWorkKeywords(message.content);
      workKeywords.forEach(keyword => {
        topics.set(keyword, (topics.get(keyword) || 0) + 1);
      });
    });

    // Find most frequent topic
    let mostFrequentTopic = 'general_development';
    let maxCount = 0;
    
    topics.forEach((count, topic) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentTopic = topic;
      }
    });

    return maxCount > 2 ? mostFrequentTopic : 'project_work';
  }

  /**
   * Extract work-related keywords from content
   * @param {string} content - Message content
   * @returns {Array} Array of work keywords
   */
  extractWorkKeywords(content) {
    const keywords = [];
    const content_lower = content.toLowerCase();
    
    // Technical keywords
    const technicalKeywords = [
      'api', 'database', 'frontend', 'backend', 'component', 'service',
      'authentication', 'authorization', 'testing', 'deployment', 'bug',
      'feature', 'function', 'class', 'module', 'interface'
    ];
    
    // Project keywords
    const projectKeywords = [
      'user_interface', 'user_experience', 'performance', 'security',
      'integration', 'migration', 'optimization', 'refactoring'
    ];
    
    [...technicalKeywords, ...projectKeywords].forEach(keyword => {
      if (content_lower.includes(keyword)) {
        keywords.push(keyword);
      }
    });
    
    return keywords;
  }

  /**
   * Find blockers and issues in messages
   * @param {Array} messages - Conversation messages
   * @returns {Array} Array of blocker descriptions
   */
  findBlockers(messages) {
    const blockers = [];
    
    messages.forEach(message => {
      if (!message.content) return;
      
      const content = message.content;
      
      if (AgentUtils.matchesPattern(content, 'blockers')) {
        const blocker = this.extractBlocker(content);
        if (blocker && !blockers.includes(blocker)) {
          blockers.push(blocker);
        }
      }
    });
    
    return blockers.slice(0, 5); // Limit to 5 most recent blockers
  }

  /**
   * Extract blocker description from content
   * @param {string} content - Message content
   * @returns {string|null} Blocker description
   */
  extractBlocker(content) {
    const blockerPatterns = [
      /blocked by\s+([^.]{10,80})/i,
      /can't proceed\s+([^.]{10,80})/i,
      /stuck on\s+([^.]{10,80})/i,
      /waiting for\s+([^.]{10,80})/i,
      /issue with\s+([^.]{10,80})/i,
      /problem with\s+([^.]{10,80})/i,
      /dependency on\s+([^.]{10,80})/i,
      /error\s+([^.]{10,80})/i
    ];

    for (const pattern of blockerPatterns) {
      const match = pattern.exec(content);
      if (match && match[1]) {
        return AgentUtils.truncateText(match[1].trim(), 100);
      }
    }

    return null;
  }

  /**
   * Identify next actions from messages
   * @param {Array} messages - Conversation messages
   * @returns {Array} Array of next action descriptions
   */
  identifyNextActions(messages) {
    const nextActions = [];
    const recentMessages = messages.slice(-5); // Focus on recent messages
    
    recentMessages.forEach(message => {
      if (!message.content) return;
      
      const content = message.content;
      
      if (AgentUtils.matchesPattern(content, 'nextActions')) {
        const action = this.extractNextAction(content);
        if (action && !nextActions.includes(action)) {
          nextActions.push(action);
        }
      }
    });
    
    return nextActions.slice(0, 3); // Limit to 3 next actions
  }

  /**
   * Extract next action description from content
   * @param {string} content - Message content
   * @returns {string|null} Next action description
   */
  extractNextAction(content) {
    const nextActionPatterns = [
      /next step\s+(?:is\s+)?([^.]{10,80})/i,
      /need to\s+([^.]{10,80})/i,
      /will\s+([^.]{10,80})/i,
      /plan to\s+([^.]{10,80})/i,
      /should\s+([^.]{10,80})/i,
      /going to\s+([^.]{10,80})/i,
      /todo\s*:?\s*([^.]{10,80})/i
    ];

    for (const pattern of nextActionPatterns) {
      const match = pattern.exec(content);
      if (match && match[1]) {
        return AgentUtils.truncateText(match[1].trim(), 100);
      }
    }

    return null;
  }

  /**
   * Calculate progress indicators from conversation
   * @param {Array} messages - Conversation messages
   * @returns {Object} Progress data
   */
  calculateProgress(messages) {
    let completedTasks = 0;
    let totalTasks = 0;
    let progressIndicators = [];

    messages.forEach(message => {
      if (!message.content) return;
      
      const content = message.content;
      
      // Count completed tasks
      if (this.isTaskCompletion(content)) {
        completedTasks++;
        const task = this.extractCompletedTask(content);
        if (task) {
          progressIndicators.push(`completed: ${task}`);
        }
      }
      
      // Count total tasks mentioned
      if (this.isTaskMention(content)) {
        totalTasks++;
      }
    });

    const progressScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      score: progressScore,
      completed_tasks: completedTasks,
      total_tasks: totalTasks,
      indicators: progressIndicators.slice(-3) // Keep last 3 indicators
    };
  }

  /**
   * Check if content indicates task completion
   * @param {string} content - Message content
   * @returns {boolean} True if task completion
   */
  isTaskCompletion(content) {
    const completionPatterns = [
      /completed/i, /finished/i, /done/i, /ready/i,
      /successfully/i, /works/i, /fixed/i, /solved/i,
      /implemented/i, /built/i, /created/i
    ];
    
    return completionPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if content mentions a task
   * @param {string} content - Message content
   * @returns {boolean} True if task mention
   */
  isTaskMention(content) {
    const taskPatterns = [
      /task/i, /todo/i, /need to/i, /will/i, /should/i,
      /implement/i, /build/i, /create/i, /fix/i, /add/i
    ];
    
    return taskPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Extract completed task description
   * @param {string} content - Message content
   * @returns {string|null} Task description
   */
  extractCompletedTask(content) {
    const taskPatterns = [
      /completed\s+([^.]{10,60})/i,
      /finished\s+([^.]{10,60})/i,
      /successfully\s+([^.]{10,60})/i,
      /implemented\s+([^.]{10,60})/i,
      /built\s+([^.]{10,60})/i,
      /created\s+([^.]{10,60})/i
    ];

    for (const pattern of taskPatterns) {
      const match = pattern.exec(content);
      if (match && match[1]) {
        return AgentUtils.truncateText(match[1].trim(), 80);
      }
    }

    return null;
  }

  /**
   * Determine overall session status
   * @param {Array} messages - Conversation messages
   * @returns {string} Session status
   */
  determineSessionStatus(messages) {
    const recentMessages = messages.slice(-3);
    
    // Check for completion indicators
    const hasCompletions = recentMessages.some(m => 
      m.content && this.isTaskCompletion(m.content)
    );
    
    // Check for blockers
    const hasRecentBlockers = recentMessages.some(m => 
      m.content && AgentUtils.matchesPattern(m.content, 'blockers')
    );
    
    // Check for next actions
    const hasNextActions = recentMessages.some(m => 
      m.content && AgentUtils.matchesPattern(m.content, 'nextActions')
    );

    if (hasCompletions && hasNextActions) {
      return 'progressing';
    } else if (hasCompletions) {
      return 'completed_tasks';
    } else if (hasRecentBlockers) {
      return 'blocked';
    } else if (hasNextActions) {
      return 'planning';
    } else {
      return 'active';
    }
  }

  /**
   * Extract work context from conversation
   * @param {Array} messages - Conversation messages
   * @returns {string} Work context
   */
  extractWorkContext(messages) {
    // Look for project, feature, or domain context
    const contextPatterns = [
      /project\s+([^.]{5,50})/i,
      /feature\s+([^.]{5,50})/i,
      /system\s+([^.]{5,50})/i,
      /application\s+([^.]{5,50})/i,
      /component\s+([^.]{5,50})/i
    ];

    for (const message of messages.slice(-10)) {
      if (!message.content) continue;
      
      for (const pattern of contextPatterns) {
        const match = pattern.exec(message.content);
        if (match && match[1]) {
          return AgentUtils.truncateText(match[1].trim(), 80);
        }
      }
    }

    return 'general_development';
  }

  /**
   * Get last significant activity from messages
   * @param {Array} messages - Conversation messages
   * @returns {string} Last activity description
   */
  getLastActivity(messages) {
    const recentMessages = messages.slice(-5).reverse();
    
    for (const message of recentMessages) {
      if (!message.content) continue;
      
      // Look for action verbs
      const actionPatterns = [
        /implemented/i, /built/i, /created/i, /fixed/i, /updated/i,
        /changed/i, /added/i, /removed/i, /tested/i, /deployed/i
      ];
      
      for (const pattern of actionPatterns) {
        if (pattern.test(message.content)) {
          const action = this.extractActionFromContent(message.content, pattern);
          if (action) {
            return action;
          }
        }
      }
    }

    return 'reviewing_progress';
  }

  /**
   * Extract action from content using pattern
   * @param {string} content - Message content
   * @param {RegExp} pattern - Action pattern
   * @returns {string} Action description
   */
  extractActionFromContent(content, pattern) {
    const match = pattern.exec(content);
    if (match) {
      const start = match.index;
      const actionContext = content.substring(start, start + 100);
      return AgentUtils.truncateText(actionContext, 80);
    }
    return null;
  }

  /**
   * Get completion indicators from messages
   * @param {Array} messages - Conversation messages
   * @returns {Array} Completion indicators
   */
  getCompletionIndicators(messages) {
    const indicators = [];
    
    messages.forEach(message => {
      if (!message.content) return;
      
      const content = message.content;
      
      // Look for completion signals
      const completionSignals = [
        /all done/i, /everything works/i, /ready to deploy/i,
        /tests passing/i, /no errors/i, /successfully/i
      ];
      
      completionSignals.forEach(signal => {
        if (signal.test(content)) {
          const context = content.substring(0, 80);
          indicators.push(AgentUtils.truncateText(context, 60));
        }
      });
    });
    
    return indicators.slice(-2); // Keep last 2 indicators
  }

  /**
   * Get default state object
   * @param {Object} metadata - Conversation metadata
   * @param {string} errorMessage - Optional error message
   * @returns {Object} Default state
   */
  getDefaultState(metadata, errorMessage = null) {
    return {
      working_on: errorMessage ? 'error_processing' : 'unknown',
      blockers: 'none',
      next_action: 'to_be_determined',
      progress: { score: 0, completed_tasks: 0, total_tasks: 0, indicators: [] },
      session_status: 'unknown',
      work_context: 'unknown',
      session_id: metadata.sessionId || 'unknown',
      checkpoint_number: metadata.checkpointNumber || 0,
      last_activity: 'unknown',
      completion_indicators: []
    };
  }
}

module.exports = { StateTrackerAgent };